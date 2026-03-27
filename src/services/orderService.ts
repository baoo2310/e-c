import { pool } from '../config/db';
import { redis } from '../config/redis';
import { publishEvent } from './kafkaService';
import { ApiError } from '../utils/ApiErrors';
import { StatusCodes } from 'http-status-codes';

export const checkoutCart = async (userId: string) => {
  // 1. Grab a dedicated client for the Transaction
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 2. Fetch the user's cart and all its items
    const cartQuery = `
      SELECT c.id as cart_id, c.total, ci.product_id, ci.products_sku_id, ci.quantity
      FROM cart c
      JOIN cart_item ci ON c.id = ci.cart_id
      WHERE c.user_id = $1
    `;
    const cartResult = await client.query(cartQuery, [userId]);

    if (cartResult.rows.length === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Your cart is empty');
    }

    const cartId = cartResult.rows[0].cart_id;
    const cartTotal = cartResult.rows[0].total;

    // 3. Create the Main Order Record
    const orderQuery = `
      INSERT INTO order_details (user_id, total) 
      VALUES ($1, $2) 
      RETURNING id, total, created_at;
    `;
    const orderResult = await client.query(orderQuery, [userId, cartTotal]);
    const newOrder = orderResult.rows[0];

    // 4. Move items from Cart to Order (This fires your Inventory Trigger!)
    const orderItemQuery = `
      INSERT INTO order_item (order_id, product_id, products_sku_id, quantity)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;

    for (const item of cartResult.rows) {
      // DANGER ZONE: If this specific SKU doesn't have enough stock, 
      // PostgreSQL trigger will violently reject this INSERT and throw an error.
      await client.query(orderItemQuery, [
        newOrder.id, 
        item.product_id, 
        item.products_sku_id, 
        item.quantity
      ]);
    }

    // 5. Empty the Cart
    // (Your calculate_cart_total trigger will automatically set the cart total back to 0!)
    await client.query(`DELETE FROM cart_item WHERE cart_id = $1`, [cartId]);

    // 6. Commit the Transaction (Save everything)
    await client.query('COMMIT');

    // 7. Clear Caches & Fire Events
    await redis.del(`cart:${userId}`);
    await redis.del('products:all'); // Invalidate product cache because stock changed!
    
    // Wipe paginated product caches
    const keys = await redis.keys('products:page:*');
    if (keys.length > 0) await redis.del(keys);

    await publishEvent('order-events', 'ORDER_CREATED', {
      orderId: newOrder.id,
      userId,
      total: newOrder.total,
      timestamp: newOrder.created_at
    });

    return newOrder;

  } catch (error: any) {
    await client.query('ROLLBACK');

    // Catch custom PostgreSQL Trigger Exception!
    if (error.message && error.message.includes('Insufficient stock')) {
      throw new ApiError(StatusCodes.CONFLICT, 'Checkout failed: One or more items in your cart are out of stock.');
    }

    throw error;
  } finally {
    client.release();
  }
};