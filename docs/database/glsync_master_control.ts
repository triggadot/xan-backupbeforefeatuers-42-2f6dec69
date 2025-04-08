/**
 * @function glsync_master_control
 * @deprecated This function has been removed from the database. All tables now use the standard upsert pattern without special handling.
 * 
 * @description
 * [DEPRECATED] This function previously enabled complete override mode for Glidebase sync operations
 * by disabling all PostgreSQL constraints and triggers. It has been removed as part of the 
 * standardization to use the same upsert pattern for all tables.
 * 
 * According to the Glidebase pattern:
 * - All tables use the same standard upsert method with no special handling for specific tables
 * - Relationships use rowid_ fields referencing glide_row_id values without foreign key constraints
 * - The sync process uses standard Supabase upsert functionality with consistent configuration
 * 
 * @migration
 * If you encounter errors related to this function, apply the migration file:
 * 20250407_fix_glsync_estimate_lines_references.sql
 * 
 * @replacementPattern
 * Instead of using this specialized function, use the standard upsert pattern:
 * ```typescript
 * // Standard upsert for all tables
 * const { error } = await supabase
 *   .from(mapping.supabase_table)
 *   .upsert(batch, { 
 *     onConflict: 'glide_row_id',
 *     ignoreDuplicates: false
 *   });
 * ```
 * 
 * @returns {void} This function doesn't return any value
 * 
 * @example
 * ```typescript
 * // Call from edge function
 * const { error } = await supabase.rpc('glsync_master_control');
 * if (error) {
 *   throw error;
 * }
 * 
 * // Call from another PostgreSQL function
 * PERFORM public.glsync_master_control();
 * ```
 * 
 * @security
 * - SECURITY DEFINER: Runs with the privileges of the function creator
 * - This function has elevated permissions to modify PostgreSQL session settings
 * 
 * @sideEffects
 * - Disables all triggers in the database by setting session_replication_role to 'replica'
 * - Sets the app.glsync_mode session variable to 'true'
 * - Outputs a NOTICE log message
 * 
 * @performance
 * - Lightweight operation with minimal overhead
 * - Should be called once at the beginning of a sync operation
 * 
 * @dependencies
 * - No direct dependencies on other functions or tables
 * 
 * @errors
 * - No specific errors are thrown by this function
 */

/**
 * Type definition for the glsync_master_control function parameters and return value
 * @deprecated This function has been removed. Use standard upsert pattern instead.
 */
export interface GlsyncMasterControl {
  /**
   * [DEPRECATED] This function has been removed.
   * @returns A promise that resolves to void (no return value)
   */
  (): Promise<void>;
}
