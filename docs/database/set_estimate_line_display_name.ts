/**
 * @function set_estimate_line_display_name
 * @description
 * Trigger function that automatically sets the display_name for estimate lines based on available
 * product information. This ensures that estimate lines always have a meaningful display name
 * even if product data is incomplete.
 * 
 * @sql
 * ```sql
 * CREATE OR REPLACE FUNCTION public.set_estimate_line_display_name()
 * RETURNS TRIGGER
 * LANGUAGE plpgsql
 * AS $$
 * BEGIN
 *   IF NEW.sale_product_name IS NOT NULL THEN
 *     NEW.display_name := NEW.sale_product_name;
 *   ELSIF NEW.rowid_products IS NOT NULL THEN
 *     SELECT COALESCE(new_product_name, vendor_product_name) INTO NEW.display_name
 *     FROM public.gl_products
 *     WHERE glide_row_id = NEW.rowid_products;
 *   END IF;
 *   
 *   IF NEW.display_name IS NULL THEN
 *     NEW.display_name := 'Product ' || NEW.rowid_products;
 *   END IF;
 *   
 *   RETURN NEW;
 * END;
 * $$;
 * 
 * -- Trigger definition
 * CREATE TRIGGER trg_set_estimate_line_display_name
 * BEFORE INSERT OR UPDATE ON public.gl_estimate_lines
 * FOR EACH ROW
 * EXECUTE FUNCTION public.set_estimate_line_display_name();
 * ```
 * 
 * @returns {Object} The modified NEW record with display_name set
 * 
 * @example
 * ```sql
 * -- This trigger is automatically called when inserting or updating gl_estimate_lines
 * INSERT INTO public.gl_estimate_lines (
 *   glide_row_id,
 *   rowid_estimates,
 *   rowid_products,
 *   sale_product_name,
 *   qty_sold,
 *   selling_price
 * ) VALUES (
 *   'el_123',
 *   'est_456',
 *   'prod_789',
 *   NULL,
 *   5,
 *   19.99
 * );
 * -- The display_name will be automatically set based on product data
 * ```
 * 
 * @triggerTiming BEFORE INSERT OR UPDATE
 * @triggerLevel ROW
 * @triggerTable public.gl_estimate_lines
 * 
 * @sideEffects
 * - Sets the display_name field on the NEW record before it is inserted or updated
 * - May perform a lookup in the gl_products table if rowid_products is set
 * 
 * @performance
 * - Performs a single SELECT query on gl_products when rowid_products is set
 * - Consider indexing gl_products.glide_row_id for optimal performance
 * 
 * @dependencies
 * - gl_products table: Used to lookup product names when rowid_products is set
 * 
 * @errors
 * - No specific errors are thrown by this function
 * - If gl_products table is missing or schema has changed, may result in NULL display_name
 * 
 * @logic
 * The function follows this logic to determine the display_name:
 * 1. If sale_product_name is provided, use it directly
 * 2. If rowid_products is provided, look up the product name from gl_products
 * 3. If no name is found, use a fallback of 'Product ' + rowid_products
 */

/**
 * Type definition for the NEW record in the set_estimate_line_display_name trigger
 */
export interface EstimateLine {
  /** Unique identifier (UUID) */
  id?: string;
  /** Unique identifier from Glide */
  glide_row_id: string;
  /** Reference to the parent estimate's glide_row_id */
  rowid_estimates?: string;
  /** Reference to the related product's glide_row_id */
  rowid_products?: string;
  /** Name of the product for this line */
  sale_product_name?: string;
  /** Quantity sold */
  qty_sold?: number;
  /** Price per unit */
  selling_price?: number;
  /** Calculated as qty_sold * selling_price */
  line_total?: number;
  /** Additional notes for this line */
  product_sale_note?: string;
  /** Date when the sale occurred */
  date_of_sale?: Date;
  /** Creation timestamp */
  created_at?: Date;
  /** Last update timestamp */
  updated_at?: Date;
  /** Display name for the product (set by this trigger) */
  display_name?: string;
}

/**
 * Type definition for the product record used in the display name lookup
 */
export interface Product {
  /** Unique identifier (UUID) */
  id: string;
  /** Unique identifier from Glide */
  glide_row_id: string;
  /** Custom name for the product */
  new_product_name?: string;
  /** Original vendor name for the product */
  vendor_product_name?: string;
  /** Creation timestamp */
  created_at: Date;
  /** Last update timestamp */
  updated_at: Date;
}
