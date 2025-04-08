/**
 * @file index.ts
 * @description
 * This file serves as the central documentation hub for all database functions,
 * triggers, and views in the Glidebase sync system. It exports type definitions
 * and provides references to detailed documentation for each database object.
 */

// Import all type definitions from individual documentation files
import { GlsyncMasterControl } from './glsync_master_control';
import { GlsyncMasterCleanup } from './glsync_master_cleanup';
import { GlsyncEstimateLines, EstimateLineData, GlsyncEstimateLinesResult, SyncError } from './glsync_estimate_lines';
import { EstimateLine as TriggerEstimateLine, Product } from './set_estimate_line_display_name';
import { EstimateLine, Estimate } from './update_estimate_total';
import { EstimateLineWithProduct } from './v_estimate_lines_with_products';

/**
 * Database Functions
 * 
 * The Glidebase sync system uses the following key database functions:
 * 
 * 1. glsync_master_control - Enables override mode by disabling all constraints and triggers
 * 2. glsync_master_cleanup - Fixes inconsistent data and restores normal database operation
 * 3. glsync_estimate_lines - Synchronizes estimate line data with proper relationship handling
 */
export const DatabaseFunctions = {
  /**
   * @see ./glsync_master_control.ts for detailed documentation
   */
  glsync_master_control: {} as GlsyncMasterControl,
  
  /**
   * @see ./glsync_master_cleanup.ts for detailed documentation
   */
  glsync_master_cleanup: {} as GlsyncMasterCleanup,
  
  /**
   * @see ./glsync_estimate_lines.ts for detailed documentation
   */
  glsync_estimate_lines: {} as GlsyncEstimateLines
};

/**
 * Database Triggers
 * 
 * The Glidebase sync system uses the following key database triggers:
 * 
 * 1. set_estimate_line_display_name - Sets display names for estimate lines
 * 2. update_estimate_total - Updates total amounts for estimates
 */
export const DatabaseTriggers = {
  /**
   * @see ./set_estimate_line_display_name.ts for detailed documentation
   */
  set_estimate_line_display_name: 'BEFORE INSERT OR UPDATE ON public.gl_estimate_lines',
  
  /**
   * @see ./update_estimate_total.ts for detailed documentation
   */
  update_estimate_total: 'AFTER INSERT OR UPDATE OR DELETE ON public.gl_estimate_lines'
};

/**
 * Database Views
 * 
 * The Glidebase sync system uses the following key database views:
 * 
 * 1. v_estimate_lines_with_products - Joins estimate lines with product details
 */
export const DatabaseViews = {
  /**
   * @see ./v_estimate_lines_with_products.ts for detailed documentation
   */
  v_estimate_lines_with_products: 'SELECT FROM public.gl_estimate_lines LEFT JOIN public.gl_products'
};

/**
 * Re-export all type definitions for use in application code
 */
export {
  // Function parameter and return types
  GlsyncMasterControl,
  GlsyncMasterCleanup,
  GlsyncEstimateLines,
  EstimateLineData,
  GlsyncEstimateLinesResult,
  SyncError,
  
  // Table and view types
  TriggerEstimateLine,
  Product,
  EstimateLine,
  Estimate,
  EstimateLineWithProduct
};

/**
 * Database Schema Overview
 * 
 * The Glidebase sync system uses the following key tables:
 * 
 * 1. gl_estimate_lines - Stores line items for estimates
 *    - Primary key: id (UUID)
 *    - Unique constraint: glide_row_id (TEXT)
 *    - Foreign references: rowid_estimates, rowid_products (not enforced by constraints)
 *    - Generated column: line_total = qty_sold * selling_price
 * 
 * 2. gl_estimates - Stores estimate header information
 *    - Primary key: id (UUID)
 *    - Unique constraint: glide_row_id (TEXT)
 *    - Calculated field: total_amount (updated by trigger)
 * 
 * 3. gl_products - Stores product information
 *    - Primary key: id (UUID)
 *    - Unique constraint: glide_row_id (TEXT)
 * 
 * All tables follow the Glidebase pattern:
 * - No foreign key constraints
 * - Relationships maintained through rowid_ fields referencing glide_row_id values
 * - Timestamps: created_at, updated_at
 */

/**
 * Usage Examples
 * 
 * @example
 * ```typescript
 * // Example: Syncing estimate lines from Glide
 * import { EstimateLineData } from './database';
 * 
 * const data: EstimateLineData[] = [
 *   {
 *     glide_row_id: "el_123",
 *     rowid_estimates: "est_456",
 *     rowid_products: "prod_789",
 *     sale_product_name: "Custom Widget",
 *     qty_sold: 5,
 *     selling_price: 19.99
 *   }
 * ];
 * 
 * const { data: result, error } = await supabase.rpc('glsync_estimate_lines', { data });
 * ```
 * 
 * @example
 * ```typescript
 * // Example: Querying the estimate lines view
 * import { EstimateLineWithProduct } from './database';
 * 
 * const { data, error } = await supabase
 *   .from<EstimateLineWithProduct>('v_estimate_lines_with_products')
 *   .select('*')
 *   .eq('rowid_estimates', 'est_456');
 * ```
 */
