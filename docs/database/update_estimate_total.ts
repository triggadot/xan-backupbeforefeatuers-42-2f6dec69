/**
 * @function update_estimate_total
 * @description
 * Trigger function that automatically updates the total_amount field in the gl_estimates table
 * whenever an estimate line is inserted, updated, or deleted. This ensures that the estimate's
 * total amount always reflects the sum of its line items.
 * 
 * @sql
 * ```sql
 * CREATE OR REPLACE FUNCTION public.update_estimate_total()
 * RETURNS TRIGGER
 * LANGUAGE plpgsql
 * AS $$
 * BEGIN
 *   -- Update the estimate's total_amount
 *   UPDATE public.gl_estimates
 *   SET total_amount = (
 *     SELECT COALESCE(SUM(qty_sold * selling_price), 0)
 *     FROM public.gl_estimate_lines
 *     WHERE rowid_estimates = NEW.rowid_estimates
 *   )
 *   WHERE glide_row_id = NEW.rowid_estimates;
 *   
 *   RETURN NEW;
 * END;
 * $$;
 * 
 * -- Trigger definition for INSERT and UPDATE
 * CREATE TRIGGER trg_update_estimate_total_on_insert_update
 * AFTER INSERT OR UPDATE ON public.gl_estimate_lines
 * FOR EACH ROW
 * WHEN (NEW.rowid_estimates IS NOT NULL)
 * EXECUTE FUNCTION public.update_estimate_total();
 * 
 * -- Trigger definition for DELETE
 * CREATE TRIGGER trg_update_estimate_total_on_delete
 * AFTER DELETE ON public.gl_estimate_lines
 * FOR EACH ROW
 * WHEN (OLD.rowid_estimates IS NOT NULL)
 * EXECUTE FUNCTION public.update_estimate_total();
 * ```
 * 
 * @returns {Object} The unmodified NEW record (for INSERT/UPDATE) or OLD record (for DELETE)
 * 
 * @example
 * ```sql
 * -- This trigger is automatically called when inserting, updating, or deleting gl_estimate_lines
 * INSERT INTO public.gl_estimate_lines (
 *   glide_row_id,
 *   rowid_estimates,
 *   rowid_products,
 *   qty_sold,
 *   selling_price
 * ) VALUES (
 *   'el_123',
 *   'est_456',
 *   'prod_789',
 *   5,
 *   19.99
 * );
 * -- The total_amount in gl_estimates will be automatically updated
 * ```
 * 
 * @triggerTiming AFTER INSERT OR UPDATE OR DELETE
 * @triggerLevel ROW
 * @triggerTable public.gl_estimate_lines
 * @triggerCondition (NEW.rowid_estimates IS NOT NULL) for INSERT/UPDATE, (OLD.rowid_estimates IS NOT NULL) for DELETE
 * 
 * @sideEffects
 * - Updates the total_amount field in the gl_estimates table
 * - Performs a SUM calculation on all related estimate lines
 * 
 * @performance
 * - Executes an UPDATE query on gl_estimates for each affected row
 * - Performs a SUM aggregation on gl_estimate_lines for each affected estimate
 * - For bulk operations, consider disabling this trigger temporarily and updating totals in batch
 * 
 * @dependencies
 * - gl_estimates table: The target table for updates
 * - gl_estimate_lines table: The source table for calculating totals
 * 
 * @errors
 * - No specific errors are thrown by this function
 * - If gl_estimates table is missing or schema has changed, the update may fail
 * 
 * @logic
 * The function follows this logic:
 * 1. When an estimate line is inserted, updated, or deleted
 * 2. Calculate the sum of (qty_sold * selling_price) for all lines with the same rowid_estimates
 * 3. Update the corresponding estimate's total_amount with this sum
 */

/**
 * Type definition for the NEW/OLD record in the update_estimate_total trigger
 */
export interface EstimateLine {
  /** Unique identifier (UUID) */
  id?: string;
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
  line_total?: number;
  /** Additional notes for this line */
  product_sale_note?: string;
  /** Date when the sale occurred */
  date_of_sale?: Date;
  /** Creation timestamp */
  created_at?: Date;
  /** Last update timestamp */
  updated_at?: Date;
  /** Display name for the product */
  display_name?: string;
}

/**
 * Type definition for the estimate record being updated
 */
export interface Estimate {
  /** Unique identifier (UUID) */
  id: string;
  /** Unique identifier from Glide */
  glide_row_id: string;
  /** Total amount of the estimate (sum of line items) */
  total_amount: number;
  /** Creation timestamp */
  created_at: Date;
  /** Last update timestamp */
  updated_at: Date;
}
