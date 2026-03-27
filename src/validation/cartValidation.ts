import { z } from 'zod';

export const addItemSchema = z.object({
    product_id: z.string().uuid("Invalid Product ID"),
    products_sku_id: z.string().uuid("Invalid SKU ID"),
    quantity: z.number().int().positive("Quantity must be at least 1").default(1),
});