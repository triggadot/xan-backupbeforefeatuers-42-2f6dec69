/**
 * @function glsync_estimate_lines
 * @deprecated This function has been removed from the database. All tables including gl_estimate_lines now use the standard upsert pattern.
 * 
 * @description
 * [DEPRECATED] This function previously synchronized estimate line data from Glide to the Supabase database.
 * It has been removed as part of the standardization to use the same upsert pattern for all tables.
 * 
 * According to the Glidebase pattern:
 * - All tables use the same standard upsert method with no special handling for specific tables
 * - Relationships use rowid_ fields referencing glide_row_id values without foreign key constraints
 * - The sync process temporarily disables constraints and triggers using SET session_replication_role = 'replica'
 * 
 * @migration
 * If you encounter errors related to this function, apply the migration file:
 * 20250407_fix_glsync_estimate_lines_references.sql
 * 
 * @replacementPattern
 * Instead of using this specialized function, use the standard upsert pattern:
 * ```typescript
 * // Standard upsert for all tables including gl_estimate_lines
 * const { error } = await supabase
 *   .from(mapping.supabase_table)
 *   .upsert(batch, { 
 *     onConflict: 'glide_row_id',
 *     ignoreDuplicates: false
 *   });
 * ```
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
 * @deprecated This function has been removed. Use standard upsert pattern instead.
 */
export interface GlsyncEstimateLines {
  /**
   * [DEPRECATED] This function has been removed.
   * @param data JSONB array of estimate line records to be processed
   * @returns A promise that resolves to the result of the operation
   */
  (data: EstimateLineData[]): Promise<GlsyncEstimateLinesResult>;
}
