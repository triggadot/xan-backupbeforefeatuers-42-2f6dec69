/**
 * @module glsync_estimate_lines_complete
 * @description A self-contained function for syncing estimate lines from Glide to Supabase
 */

/**
 * SQL Definition:
 * ```sql
 * CREATE OR REPLACE FUNCTION public.glsync_estimate_lines_complete(data jsonb)
 * RETURNS jsonb
 * LANGUAGE plpgsql
 * SECURITY DEFINER
 * AS $$
 * -- Function body omitted for brevity
 * $$;
 * ```
 */

/**
 * Input parameter for the glsync_estimate_lines_complete function
 * @typedef {Object} GlsyncEstimateLinesCompleteParams
 * @property {Array<EstimateLineData>} data - Array of estimate line records to sync
 */

/**
 * Structure of each estimate line record in the input data
 * @typedef {Object} EstimateLineData
 * @property {string} glide_row_id - Unique identifier from Glide
 * @property {string} [rowid_estimates] - Reference to gl_estimates.glide_row_id
 * @property {string} [rowid_products] - Reference to gl_products.glide_row_id
 * @property {string} [sale_product_name] - Name of the product being sold
 * @property {number} [qty_sold] - Quantity of product sold
 * @property {number} [selling_price] - Price per unit
 * @property {string} [product_sale_note] - Additional notes for the sale
 * @property {string} [date_of_sale] - Date when the sale occurred (ISO format)
 * @property {string} [created_at] - Creation timestamp (ISO format)
 * @property {string} [updated_at] - Last update timestamp (ISO format)
 */

/**
 * Result structure returned by the function
 * @typedef {Object} GlsyncEstimateLinesResult
 * @property {Array<string>} inserted - Array of glide_row_ids that were inserted
 * @property {Array<string>} updated - Array of glide_row_ids that were updated
 * @property {Array<ErrorRecord>} errors - Array of records that encountered errors
 */

/**
 * Structure of error records in the result
 * @typedef {Object} ErrorRecord
 * @property {string} glide_row_id - The glide_row_id of the record that failed
 * @property {string} error - Error message
 * @property {string} detail - Error code or additional details
 */

/**
 * Synchronizes estimate line data from Glide to the Supabase database
 * 
 * This function is a self-contained sync process that doesn't rely on session parameters
 * or triggers. It handles all aspects of the sync process internally, including:
 * 
 * 1. Creating missing related records (estimates and products)
 * 2. Setting display names based on product information
 * 3. Updating estimate totals after processing
 * 4. Comprehensive error handling for each record
 * 
 * The function is designed to work within Supabase's permission model without requiring
 * elevated database privileges.
 * 
 * @param {GlsyncEstimateLinesCompleteParams} params - The input parameters
 * @returns {GlsyncEstimateLinesResult} Result object with inserted, updated, and error records
 * 
 * @example
 * // Sync a single estimate line
 * const result = await supabase.rpc('glsync_estimate_lines_complete', {
 *   data: [{
 *     glide_row_id: 'est_line_123',
 *     rowid_estimates: 'est_456',
 *     rowid_products: 'prod_789',
 *     sale_product_name: 'Custom Widget',
 *     qty_sold: 5,
 *     selling_price: 19.99,
 *     product_sale_note: 'Rush order',
 *     date_of_sale: '2025-03-28T12:00:00Z'
 *   }]
 * });
 * 
 * @example
 * // Sync multiple estimate lines in a batch
 * const result = await supabase.rpc('glsync_estimate_lines_complete', {
 *   data: batchOfEstimateLines
 * });
 * console.log(`Inserted: ${result.inserted.length}, Updated: ${result.updated.length}, Errors: ${result.errors.length}`);
 * 
 * @example
 * // Handle errors from the sync process
 * const result = await supabase.rpc('glsync_estimate_lines_complete', {
 *   data: batchOfEstimateLines
 * });
 * 
 * if (result.errors && result.errors.length > 0) {
 *   console.error('Some estimate lines had errors:', result.errors);
 *   // Implement error handling logic
 * }
 */
export interface GlsyncEstimateLinesComplete {
  /**
   * Synchronizes estimate line data from Glide to the Supabase database
   * 
   * @param params - Object containing the data array of estimate lines to sync
   * @returns Result object with counts of inserted, updated, and error records
   */
  (params: { data: EstimateLineData[] }): Promise<GlsyncEstimateLinesResult>;
}

/**
 * Structure of each estimate line record in the input data
 */
export interface EstimateLineData {
  /** Unique identifier from Glide */
  glide_row_id: string;
  /** Reference to gl_estimates.glide_row_id */
  rowid_estimates?: string;
  /** Reference to gl_products.glide_row_id */
  rowid_products?: string;
  /** Name of the product being sold */
  sale_product_name?: string;
  /** Quantity of product sold */
  qty_sold?: number;
  /** Price per unit */
  selling_price?: number;
  /** Additional notes for the sale */
  product_sale_note?: string;
  /** Date when the sale occurred (ISO format) */
  date_of_sale?: string;
  /** Creation timestamp (ISO format) */
  created_at?: string;
  /** Last update timestamp (ISO format) */
  updated_at?: string;
}

/**
 * Result structure returned by the function
 */
export interface GlsyncEstimateLinesResult {
  /** Array of glide_row_ids that were inserted */
  inserted: string[];
  /** Array of glide_row_ids that were updated */
  updated: string[];
  /** Array of records that encountered errors */
  errors: ErrorRecord[];
}

/**
 * Structure of error records in the result
 */
export interface ErrorRecord {
  /** The glide_row_id of the record that failed */
  glide_row_id: string;
  /** Error message */
  error: string;
  /** Error code or additional details */
  detail: string;
}
