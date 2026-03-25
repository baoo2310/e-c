import { pool } from '../config/db';
import { redis } from '../config/redis';
import { publishEvent } from './kafkaService';
import { ApiError, PostgresError } from '../utils/ApiErrors';
import { StatusCodes } from 'http-status-codes';
import { CreateProductInput, ProductRow, ProductSkuRow, ProductWithSkus } from '../types/product';

export const createProductWithSkus = async (productData: CreateProductInput): Promise<ProductWithSkus> => {
    const { name, description, summary, cover, category_id, skus } = productData;
    const client = await pool.connect();

    // 1. Grab a dedicated client from the pool for the transaction

    try {
        // 2. Start the Transaction
        await client.query('BEGIN');

        // 3. Insert the Master Product
        const productQuery = `
      INSERT INTO products (name, description, summary, cover, category_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
        const productValues = [name, description, summary, cover, category_id];
        const productResult = await client.query<ProductRow>(productQuery, productValues);
        const newProduct = productResult.rows[0];

        if (!newProduct) {
            throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create product.');
        }

        // 4. Insert the Variants (SKUs)
        const insertedSkus: ProductSkuRow[] = [];
        const skuQuery = `
      INSERT INTO products_skus (product_id, size_attribute_id, color_attribute_id, sku, price, quantity)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

        for (const sku of skus) {
            const skuValues = [
                newProduct.id,
                sku.size_attribute_id,
                sku.color_attribute_id,
                sku.sku,
                sku.price,
                sku.quantity
            ];
            const skuResult = await client.query<ProductSkuRow>(skuQuery, skuValues);
            const insertedSku = skuResult.rows[0];

            if (!insertedSku) {
                throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create product SKU.');
            }

            insertedSkus.push(insertedSku);
        }

        // 5. Commit the Transaction (Save everything permanently)
        await client.query('COMMIT');

        // 6. Cache Invalidation (Clear the main products list from Redis)
        const keys = await redis.keys('product:page:*');
        if(keys.length > 0) await redis.del(keys);

        // 7. Fire Kafka Event for Search Indexers or Inventory Services
        await publishEvent('product-events', 'PRODUCT_CREATED', {
            productId: newProduct.id,
            name: newProduct.name,
            skuCount: insertedSkus.length,
            timestamp: new Date().toISOString()
        });

        // Return the combined object to the frontend
        return {
            ...newProduct,
            skus: insertedSkus
        };

    } catch (error: unknown) {
        // If ANYTHING fails, undo all changes to the database
        await client.query('ROLLBACK');

        const dbError = error as PostgresError;

        // Check for unique constraint violation on SKU
        if (dbError.code === '23505' && dbError.constraint === 'products_skus_sku_key') {
            throw new ApiError(StatusCodes.CONFLICT, 'One or more SKU codes already exist in the system.');
        }

        throw error;
    } finally {
        client.release();
    }
};

export const getProducts = async (page: number, limit: number) => {
  const offset = (page - 1) * limit;
  const cacheKey = `products:page:${page}:limit:${limit}`;

  // 1. Check Redis First
  const cachedData = await redis.get(cacheKey);
  if (cachedData) {
    console.log(`CACHE HIT: Fetched products page ${page} from Redis`);
    return JSON.parse(cachedData);
  }

  console.log(`CACHE MISS: Fetching products page ${page} from PostgreSQL`);

  // 2. The CTE Pagination Query
  const query = `
    WITH PaginatedProducts AS (
      SELECT * FROM products
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    )
    SELECT 
      p.id, p.name, p.description, p.summary, p.cover, p.category_id, p.created_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', ps.id,
            'sku', ps.sku,
            'price', ps.price,
            'quantity', ps.quantity,
            'size_attribute_id', ps.size_attribute_id,
            'color_attribute_id', ps.color_attribute_id
          )
        ) FILTER (WHERE ps.id IS NOT NULL), '[]'
      ) AS skus
    FROM PaginatedProducts p
    LEFT JOIN products_skus ps ON p.id = ps.product_id AND ps.deleted_at IS NULL
    GROUP BY p.id, p.name, p.description, p.summary, p.cover, p.category_id, p.created_at
    ORDER BY p.created_at DESC;
  `;

  // 3. We also need the TOTAL count of products so the frontend can build page numbers
  const countQuery = `SELECT COUNT(*) FROM products WHERE deleted_at IS NULL`;

  // Run both queries at the exact same time for speed
  const [productResult, countResult] = await Promise.all([
    pool.query(query, [limit, offset]),
    pool.query(countQuery)
  ]);

  const products = productResult.rows;
  const totalItems = parseInt(countResult.rows[0].count, 10);
  const totalPages = Math.ceil(totalItems / limit);

  const responseData = {
    data: products,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      limit
    }
  };

  // 4. Save to Redis
  await redis.set(cacheKey, JSON.stringify(responseData), 'EX', 3600);

  return responseData;
};