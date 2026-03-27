import { pool } from '../config/db';
import { redis } from '../config/redis';
import { ItemData } from '../types/cart';

export const addItemToCart = async (userId: string, itemData: ItemData) => {
  const { product_id, products_sku_id, quantity } = itemData;

  // 1. GET OR CREATE CART
  // First, check if the user already has an active cart.
  let cartQuery = `SELECT id FROM cart WHERE user_id = $1`;
  let cartResult = await pool.query(cartQuery, [userId]);
  let cartId;

  if (cartResult.rows.length === 0) {
    // If no cart exists, create one
    const newCartQuery = `INSERT INTO cart (user_id) VALUES ($1) RETURNING id`;
    const newCartResult = await pool.query(newCartQuery, [userId]);
    cartId = newCartResult.rows[0].id;
  } else {
    cartId = cartResult.rows[0].id;
  }

  // 2. CHECK FOR EXISTING ITEM
  // Check if this exact SKU is already in the user's cart.
  const checkItemQuery = `
    SELECT id, quantity FROM cart_item 
    WHERE cart_id = $1 AND products_sku_id = $2
  `;
  const checkItemResult = await pool.query(checkItemQuery, [cartId, products_sku_id]);

  if (checkItemResult.rows.length > 0) {
    // 3A. UPDATE (If item exists, add to the existing quantity)
    const existingItemId = checkItemResult.rows[0].id;
    const updateItemQuery = `
      UPDATE cart_item 
      SET quantity = quantity + $1 
      WHERE id = $2 
      RETURNING *;
    `;
    await pool.query(updateItemQuery, [quantity, existingItemId]);
  } else {
    // 3B. INSERT (If item is new, insert a new row)
    const insertItemQuery = `
      INSERT INTO cart_item (cart_id, product_id, products_sku_id, quantity) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *;
    `;
    await pool.query(insertItemQuery, [cartId, product_id, products_sku_id, quantity]);
  }

  // 4. FETCH THE UPDATED CART TOTAL
  // Thanks to your PostgreSQL trigger, the total is already updated! We just fetch it.
  const updatedCartQuery = `SELECT id, total FROM cart WHERE id = $1`;
  const updatedCartResult = await pool.query(updatedCartQuery, [cartId]);

  // 5. CACHE INVALIDATION
  // Clear the user's cached cart so the next GET request fetches fresh data.
  await redis.del(`cart:${userId}`);

  return updatedCartResult.rows[0];
};


export const getCart = async (userId: string) => {
  const cacheKey = `cart:${userId}`;

  // 1. Check Redis Cache
  const cachedCart = await redis.get(cacheKey);
  if (cachedCart) {
    console.log(`CACHE HIT: Fetched cart for user ${userId} from Redis`);
    return JSON.parse(cachedCart);
  }

  console.log(`CACHE MISS: Fetching cart for user ${userId} from PostgreSQL`);

  // 2. The Multi-Join JSON Query
  const query = `
    SELECT 
      c.id AS cart_id, 
      c.total, 
      c.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'item_id', ci.id,
            'quantity', ci.quantity,
            'product', json_build_object(
              'id', p.id,
              'name', p.name,
              'cover', p.cover
            ),
            'variant', json_build_object(
              'sku_id', ps.id,
              'sku', ps.sku,
              'price', ps.price
            )
          )
        ) FILTER (WHERE ci.id IS NOT NULL), '[]'
      ) AS items
    FROM cart c
    LEFT JOIN cart_item ci ON c.id = ci.cart_id
    LEFT JOIN products p ON ci.product_id = p.id
    LEFT JOIN products_skus ps ON ci.products_sku_id = ps.id
    WHERE c.user_id = $1
    GROUP BY c.id;
  `;

  const result = await pool.query(query, [userId]);

  // If the user has never added anything to a cart, return an empty template
  if (result.rows.length === 0) {
    return { cart_id: null, total: "0.00", items: [] };
  }

  const cartData = result.rows[0];

  // 3. Save to Redis (Cache for 1 hour, or until they modify the cart again)
  await redis.set(cacheKey, JSON.stringify(cartData), 'EX', 3600);

  return cartData;
};