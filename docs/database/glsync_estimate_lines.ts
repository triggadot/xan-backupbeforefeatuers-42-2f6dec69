/**
 * @function glsync_estimate_lines
 * @description
 * Synchronizes estimate line data from Glide to the Supabase database. This function handles
 * the complex relationship between estimates, products, and estimate lines, creating placeholder
 * records for missing related entities and ensuring proper data integrity.
 * 
 * @sql
 * ```sql
 * CREATE OR REPLACE FUNCTION public.glsync_estimate_lines(data jsonb)
 * RETURNS jsonb
 * LANGUAGE plpgsql
 * SECURITY DEFINER
 * AS $$
 * DECLARE
 *     item jsonb;
 *     v_glide_row_id text;
 *     v_rowid_estimates text;
 *     v_rowid_products text;
 *     v_sale_product_name text;
 *     v_qty_sold numeric;
 *     v_selling_price numeric;
 *     v_product_sale_note text;
 *     v_date_of_sale timestamp with time zone;
 *     v_created_at timestamp with time zone;
 *     v_updated_at timestamp with time zone;
 *     result jsonb := '{"inserted": [], "updated": [], "errors": []}'::jsonb;
 *     v_estimate_exists boolean;
 *     v_product_exists boolean;
 * BEGIN
 *     -- Disable all triggers temporarily during sync
 *     PERFORM public.glsync_master_control();
 *     
 *     -- Process each item in the data array
 *     FOR item IN SELECT * FROM jsonb_array_elements(data)
 *     LOOP
 *         BEGIN
 *             -- Extract values from the item
 *             v_glide_row_id := item->>'glide_row_id';
 *             v_rowid_estimates := item->>'rowid_estimates';
 *             v_rowid_products := item->>'rowid_products';
 *             v_sale_product_name := item->>'sale_product_name';
 *             v_qty_sold := (item->>'qty_sold')::numeric;
 *             v_selling_price := (item->>'selling_price')::numeric;
 *             v_product_sale_note := item->>'product_sale_note';
 *             v_date_of_sale := (item->>'date_of_sale')::timestamp with time zone;
 *             v_created_at := COALESCE((item->>'created_at')::timestamp with time zone, now());
 *             v_updated_at := COALESCE((item->>'updated_at')::timestamp with time zone, now());
 *             
 *             -- Verify estimate exists (create placeholder if needed)
 *             IF v_rowid_estimates IS NOT NULL THEN
 *                 SELECT EXISTS(SELECT 1 FROM public.gl_estimates WHERE glide_row_id = v_rowid_estimates) INTO v_estimate_exists;
 *                 IF NOT v_estimate_exists THEN
 *                     -- Create a placeholder estimate if it doesn't exist
 *                     INSERT INTO public.gl_estimates (glide_row_id, created_at, updated_at)
 *                     VALUES (v_rowid_estimates, now(), now())
 *                     ON CONFLICT (glide_row_id) DO NOTHING;
 *                 END IF;
 *             END IF;
 *             
 *             -- Verify product exists (create placeholder if needed)
 *             IF v_rowid_products IS NOT NULL THEN
 *                 SELECT EXISTS(SELECT 1 FROM public.gl_products WHERE glide_row_id = v_rowid_products) INTO v_product_exists;
 *                 IF NOT v_product_exists THEN
 *                     -- Create a placeholder product if it doesn't exist
 *                     INSERT INTO public.gl_products (glide_row_id, created_at, updated_at)
 *                     VALUES (v_rowid_products, now(), now())
 *                     ON CONFLICT (glide_row_id) DO NOTHING;
 *                 END IF;
 *             END IF;
 *             
 *             -- Insert or update the estimate line
 *             INSERT INTO public.gl_estimate_lines (
 *                 glide_row_id,
 *                 rowid_estimates,
 *                 rowid_products,
 *                 sale_product_name,
 *                 qty_sold,
 *                 selling_price,
 *                 product_sale_note,
 *                 date_of_sale,
 *                 created_at,
 *                 updated_at,
 *                 display_name
 *             ) VALUES (
 *                 v_glide_row_id,
 *                 v_rowid_estimates,
 *                 v_rowid_products,
 *                 v_sale_product_name,
 *                 v_qty_sold,
 *                 v_selling_price,
 *                 v_product_sale_note,
 *                 v_date_of_sale,
 *                 v_created_at,
 *                 v_updated_at,
 *                 COALESCE(v_sale_product_name, 'Product ' || v_rowid_products)
 *             )
 *             ON CONFLICT (glide_row_id) DO UPDATE SET
 *                 rowid_estimates = EXCLUDED.rowid_estimates,
 *                 rowid_products = EXCLUDED.rowid_products,
 *                 sale_product_name = EXCLUDED.sale_product_name,
 *                 qty_sold = EXCLUDED.qty_sold,
 *                 selling_price = EXCLUDED.selling_price,
 *                 product_sale_note = EXCLUDED.product_sale_note,
 *                 date_of_sale = EXCLUDED.date_of_sale,
 *                 updated_at = now(),
 *                 display_name = COALESCE(EXCLUDED.sale_product_name, 'Product ' || EXCLUDED.rowid_products)
 *             RETURNING id INTO v_glide_row_id;
 *             
 *             -- Record the successful operation
 *             IF FOUND THEN
 *                 result := jsonb_set(result, '{updated}', (result->'updated') || to_jsonb(v_glide_row_id));
 *             ELSE
 *                 result := jsonb_set(result, '{inserted}', (result->'inserted') || to_jsonb(v_glide_row_id));
 *             END IF;
 *         EXCEPTION WHEN OTHERS THEN
 *             -- Record the error
 *             result := jsonb_set(
 *                 result, 
 *                 '{errors}', 
 *                 (result->'errors') || jsonb_build_object(
 *                     'glide_row_id', v_glide_row_id,
 *                     'error', SQLERRM,
 *                     'detail', SQLSTATE
 *                 )
 *             );
 *         END;
 *     END LOOP;
 *     
 *     -- Re-enable all triggers after sync
 *     PERFORM public.glsync_master_cleanup();
 *     
 *     RETURN result;
 * END;
 * $$;
 * ```
 * 
 * @param {Object} data - JSONB array of estimate line records to be processed
 * @param {string} data[].glide_row_id - Unique identifier from Glide for the estimate line
 * @param {string} [data[].rowid_estimates] - Reference to the parent estimate's glide_row_id
 * @param {string} [data[].rowid_products] - Reference to the related product's glide_row_id
 * @param {string} [data[].sale_product_name] - Name of the product for this line
 * @param {number} [data[].qty_sold] - Quantity sold
 * @param {number} [data[].selling_price] - Price per unit
 * @param {string} [data[].product_sale_note] - Additional notes for this line
 * @param {string} [data[].date_of_sale] - Date when the sale occurred (ISO format)
 * @param {string} [data[].created_at] - Creation timestamp (ISO format)
 * @param {string} [data[].updated_at] - Last update timestamp (ISO format)
 * 
 * @returns {Object} JSONB object containing the results of the operation
 * @returns {string[]} .inserted - Array of glide_row_ids for newly inserted records
 * @returns {string[]} .updated - Array of glide_row_ids for updated records
 * @returns {Object[]} .errors - Array of error objects with details
 * 
 * @example
 * ```typescript
 * // Call from edge function
 * const data = [
 *   {
 *     glide_row_id: "el_123",
 *     rowid_estimates: "est_456",
 *     rowid_products: "prod_789",
 *     sale_product_name: "Custom Widget",
 *     qty_sold: 5,
 *     selling_price: 19.99,
 *     product_sale_note: "Rush order",
 *     date_of_sale: "2025-03-15T00:00:00Z"
 *   }
 * ];
 * 
 * const { data: result, error } = await supabase.rpc('glsync_estimate_lines', { data });
 * if (error) {
 *   console.error('Sync failed:', error);
 * } else {
 *   console.log(`Inserted: ${result.inserted.length}, Updated: ${result.updated.length}, Errors: ${result.errors.length}`);
 * }
 * ```
 * 
 * @security
 * - SECURITY DEFINER: Runs with the privileges of the function creator
 * - This function has elevated permissions to insert/update records in multiple tables
 * 
 * @sideEffects
 * - Creates or updates records in gl_estimate_lines table
 * - May create placeholder records in gl_estimates and gl_products tables
 * - Calls glsync_master_control() to disable triggers
 * - Calls glsync_master_cleanup() to re-enable triggers and fix inconsistencies
 * 
 * @performance
 * - Processes each record individually within a loop
 * - Creates placeholder records as needed, which may impact performance
 * - For large datasets, consider batching the input data
 * 
 * @dependencies
 * - gl_estimates table: Used to verify and create placeholder estimates
 * - gl_products table: Used to verify and create placeholder products
 * - gl_estimate_lines table: Main table for inserting/updating records
 * - glsync_master_control function: Called to disable triggers
 * - glsync_master_cleanup function: Called to re-enable triggers and fix inconsistencies
 * 
 * @errors
 * - Captures and records any errors that occur during processing
 * - Continues processing remaining records even if some fail
 * - Returns detailed error information in the result
 */

/**
 * Type definition for estimate line data from Glide
 */
export interface EstimateLineData {
  /** Unique identifier from Glide for the estimate line */
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
  /** Additional notes for this line */
  product_sale_note?: string;
  /** Date when the sale occurred (ISO format) */
  date_of_sale?: string;
  /** Creation timestamp (ISO format) */
  created_at?: string;
  /** Last update timestamp (ISO format) */
  updated_at?: string;
}

/**
 * Type definition for error information
 */
export interface SyncError {
  /** The glide_row_id of the record that caused the error */
  glide_row_id: string;
  /** Error message */
  error: string;
  /** SQL state code */
  detail: string;
}

/**
 * Type definition for the result of the glsync_estimate_lines function
 */
export interface GlsyncEstimateLinesResult {
  /** Array of glide_row_ids for newly inserted records */
  inserted: string[];
  /** Array of glide_row_ids for updated records */
  updated: string[];
  /** Array of error objects with details */
  errors: SyncError[];
}

/**
 * Type definition for the glsync_estimate_lines function parameters and return value
 */
export interface GlsyncEstimateLines {
  /**
   * Call the glsync_estimate_lines function to sync estimate line data
   * @param data JSONB array of estimate line records to be processed
   * @returns A promise that resolves to the result of the operation
   */
  (data: EstimateLineData[]): Promise<GlsyncEstimateLinesResult>;
}
