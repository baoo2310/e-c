import { z } from 'zod';

// Define what a single SKU looks like
export const skuSchema = z.object({
  size_attribute_id: z.string().uuid("Invalid size attribute UUID").optional().nullable(),
  color_attribute_id: z.string().uuid("Invalid color attribute UUID").optional().nullable(),
  sku: z.string().min(3, "SKU must be at least 3 characters"),
  price: z.number().positive("Price must be greater than 0"),
  quantity: z.number().int().nonnegative("Quantity cannot be negative"),
});

// Define the Master Product which contains an array of SKUs
export const createProductSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().optional(),
  summary: z.string().optional(),
  cover: z.string().url("Cover must be a valid URL").optional(),
  category_id: z.string().uuid("Invalid Category ID"),
  skus: z.array(skuSchema).min(1, "A product must have at least one SKU variant"),
});

// Add this below your existing createProductSchema

export const getProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
});