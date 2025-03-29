/**
 * @function glsync_master_control
 * @description
 * Enables complete override mode for Glidebase sync operations by disabling all PostgreSQL
 * constraints and triggers. This function is called at the beginning of sync operations to
 * allow inconsistent data to be processed.
 * 
 * @sql
 * ```sql
 * CREATE OR REPLACE FUNCTION public.glsync_master_control()
 * RETURNS void
 * LANGUAGE plpgsql
 * SECURITY DEFINER
 * AS $$
 * BEGIN
 *   -- Completely disable all triggers during sync operations
 *   SET session_replication_role = 'replica';
 *   
 *   -- Set a session variable to indicate we're in glsync mode
 *   -- This can be checked by other functions/triggers if needed
 *   SET LOCAL "app.glsync_mode" = 'true';
 *   
 *   -- Log the start of sync mode
 *   RAISE NOTICE 'GLSYNC: Entering override mode - all constraints and triggers disabled';
 * END;
 * $$;
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
 */
export interface GlsyncMasterControl {
  /**
   * Call the glsync_master_control function to enable override mode
   * @returns A promise that resolves to void (no return value)
   */
  (): Promise<void>;
}
