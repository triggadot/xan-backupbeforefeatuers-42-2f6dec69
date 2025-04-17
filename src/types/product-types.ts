// Product Type Definitions
// --- Database Types (snake_case, Gl prefix) ---

/**
 * Database record for a product (matches Supabase table structure)
 */
export interface GlProductRecord {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  price: number;
  quantity: number;
  sku: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  // Add any additional columns as needed
}

/**
 * Insert type for product (required fields only, omits auto-generated)
 */
export interface GlProductInsert {
  name: string;
  description?: string | null;
  category_id?: string | null;
  price: number;
  quantity: number;
  sku?: string | null;
  image_url?: string | null;
}

/**
 * Update type for product (all fields optional)
 */
export interface GlProductUpdate {
  name?: string;
  description?: string | null;
  category_id?: string | null;
  price?: number;
  quantity?: number;
  sku?: string | null;
  image_url?: string | null;
}

// --- Frontend Types (camelCase, no prefix) ---

/**
 * Product model for UI/business logic (can add derived fields)
 */
export interface Product {
  id: string;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  price: number;
  quantity: number;
  sku?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // Derived/computed fields
  categoryName?: string;
  inStock?: boolean;
}

/**
 * Product form data (for forms/UI input)
 */
export interface ProductForm {
  name: string;
  description?: string | null;
  categoryId?: string | null;
  price: number;
  quantity: number;
  sku?: string | null;
  imageUrl?: string | null;
}

/**
 * Product filters (for search/filter UI)
 */
export interface ProductFilters {
  name?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

/**
 * Converts a GlProductRecord to a Product (frontend model)
 */
export function convertDbToProduct(record: GlProductRecord): Product {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    categoryId: record.category_id,
    price: record.price,
    quantity: record.quantity,
    sku: record.sku,
    imageUrl: record.image_url,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    inStock: record.quantity > 0,
  };
}
