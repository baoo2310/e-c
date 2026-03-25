/**
 * PRODUCT INPUT TYPES
 */

export interface ProductSkuInput {
  size_attribute_id?: string | null;
  color_attribute_id?: string | null;
  sku: string;
  price: number;
  quantity: number;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  summary?: string;
  cover?: string;
  category_id: string;
  skus: ProductSkuInput[];
}

export interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  summary: string | null;
  cover: string | null;
  category_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductSkuRow {
  id: string;
  product_id: string;
  size_attribute_id: string | null;
  color_attribute_id: string | null;
  sku: string;
  price: number;
  quantity: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductWithSkus extends ProductRow {
  skus: ProductSkuRow[];
}