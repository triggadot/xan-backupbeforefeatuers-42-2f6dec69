/**
 * @view v_estimate_lines_with_products
 * @description
 * A view that joins estimate lines with their related product information, providing a
 * comprehensive dataset for displaying estimate line items with product details. This view
 * replaces the previously used materialized view to ensure real-time data access.
 * 
 * @sql
 * ```sql
 * CREATE OR REPLACE VIEW public.v_estimate_lines_with_products AS
 * SELECT 
 *     el.id,
 *     el.glide_row_id,
 *     el.rowid_estimates,
 *     el.rowid_products,
 *     el.sale_product_name,
 *     el.qty_sold,
 *     el.selling_price,
 *     el.line_total,
 *     el.product_sale_note,
 *     el.date_of_sale,
 *     el.created_at,
 *     el.updated_at,
 *     el.display_name,
 *     p.new_product_name,
 *     p.vendor_product_name,
 *     p.product_cost,
 *     p.product_price,
 *     p.product_description,
 *     p.product_notes,
 *     p.product_sku,
 *     p.product_category,
 *     p.product_subcategory,
 *     p.product_tags
 * FROM 
 *     public.gl_estimate_lines el
 * LEFT JOIN 
 *     public.gl_products p ON el.rowid_products = p.glide_row_id;
 * ```
 * 
 * @columns
 * - id (UUID): Primary key of the estimate line
 * - glide_row_id (TEXT): Unique identifier from Glide for the estimate line
 * - rowid_estimates (TEXT): Reference to the parent estimate's glide_row_id
 * - rowid_products (TEXT): Reference to the related product's glide_row_id
 * - sale_product_name (TEXT): Name of the product for this line
 * - qty_sold (NUMERIC): Quantity sold
 * - selling_price (NUMERIC): Price per unit
 * - line_total (NUMERIC): Calculated as qty_sold * selling_price
 * - product_sale_note (TEXT): Additional notes for this line
 * - date_of_sale (TIMESTAMP WITH TIME ZONE): Date when the sale occurred
 * - created_at (TIMESTAMP WITH TIME ZONE): Creation timestamp
 * - updated_at (TIMESTAMP WITH TIME ZONE): Last update timestamp
 * - display_name (TEXT): Display name for the product
 * - new_product_name (TEXT): Custom name for the product from gl_products
 * - vendor_product_name (TEXT): Original vendor name for the product from gl_products
 * - product_cost (NUMERIC): Cost of the product from gl_products
 * - product_price (NUMERIC): Suggested retail price from gl_products
 * - product_description (TEXT): Description of the product from gl_products
 * - product_notes (TEXT): Additional notes about the product from gl_products
 * - product_sku (TEXT): Stock keeping unit from gl_products
 * - product_category (TEXT): Category of the product from gl_products
 * - product_subcategory (TEXT): Subcategory of the product from gl_products
 * - product_tags (TEXT): Tags associated with the product from gl_products
 * 
 * @example
 * ```typescript
 * // Query the view from a Supabase client
 * const { data, error } = await supabase
 *   .from('v_estimate_lines_with_products')
 *   .select('*')
 *   .eq('rowid_estimates', 'est_123');
 * 
 * if (error) {
 *   console.error('Error fetching estimate lines:', error);
 * } else {
 *   console.log('Estimate lines with product details:', data);
 * }
 * ```
 * 
 * @performance
 * - This is a regular view (not materialized) so it always reflects the latest data
 * - Performs a LEFT JOIN between gl_estimate_lines and gl_products
 * - Consider adding indexes on gl_estimate_lines.rowid_products and gl_products.glide_row_id
 * 
 * @dependencies
 * - gl_estimate_lines table: The main table for estimate line data
 * - gl_products table: Provides additional product information
 * 
 * @usage
 * This view is used for:
 * - Displaying estimate line items with complete product details
 * - Generating reports that require both estimate line and product information
 * - Providing a single query target for applications that need combined data
 */

/**
 * Type definition for the v_estimate_lines_with_products view
 */
export interface EstimateLineWithProduct {
  /** Unique identifier (UUID) */
  id: string;
  /** Unique identifier from Glide */
  glide_row_id: string;
  /** Reference to the parent estimate's glide_row_id */
  rowid_estimates: string;
  /** Reference to the related product's glide_row_id */
  rowid_products?: string;
  /** Name of the product for this line */
  sale_product_name?: string;
  /** Quantity sold */
  qty_sold: number;
  /** Price per unit */
  selling_price: number;
  /** Calculated as qty_sold * selling_price */
  line_total: number;
  /** Additional notes for this line */
  product_sale_note?: string;
  /** Date when the sale occurred */
  date_of_sale?: Date;
  /** Creation timestamp */
  created_at: Date;
  /** Last update timestamp */
  updated_at: Date;
  /** Display name for the product */
  display_name: string;
  /** Custom name for the product from gl_products */
  new_product_name?: string;
  /** Original vendor name for the product from gl_products */
  vendor_product_name?: string;
  /** Cost of the product from gl_products */
  product_cost?: number;
  /** Suggested retail price from gl_products */
  product_price?: number;
  /** Description of the product from gl_products */
  product_description?: string;
  /** Additional notes about the product from gl_products */
  product_notes?: string;
  /** Stock keeping unit from gl_products */
  product_sku?: string;
  /** Category of the product from gl_products */
  product_category?: string;
  /** Subcategory of the product from gl_products */
  product_subcategory?: string;
  /** Tags associated with the product from gl_products */
  product_tags?: string;
}
