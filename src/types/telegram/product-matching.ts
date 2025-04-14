/**
 * Types for the Telegram product matching system
 */

/**
 * Confidence level for product matches
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Match type classification
 */
export type MatchType = 'exact' | 'fuzzy' | 'manual' | 'auto';

/**
 * Status of items in the approval queue
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'auto_matched';

/**
 * Represents a product match with confidence score and reasoning
 */
export interface ProductMatch {
  id: string;
  glide_row_id: string;
  vendor_product_name: string;
  new_product_name?: string;
  display_name?: string;
  product_purchase_date?: string;
  match_score: number;
  match_reasons: {
    vendor_matched: boolean;
    purchase_date_match?: string;
    product_name_match?: string;
    purchase_order_match: boolean;
  };
}

/**
 * Product data for creating new products
 */
export interface NewProductData {
  product_name: string;
  vendor_id?: string;
  purchase_date?: string;
  purchase_order_id?: string;
  product_code?: string;
  description?: string;
  category?: string;
  price?: number;
  row_id_accounts?: string;
  rowid_purchase_orders?: string;
}

/**
 * Group of similar products for batch operations
 */
export interface ProductGroup {
  id: string;
  name: string;
  queueIds: string[];
  count: number;
  vendor?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Template for quick product creation
 */
export interface ProductTemplate {
  id: string;
  name: string;
  category: string;
  defaultFields: Partial<NewProductData>;
}
