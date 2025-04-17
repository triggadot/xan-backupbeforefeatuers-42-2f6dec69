import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/utils/use-toast';
import { GlColumnMapping } from '@/types/glide-sync/glsync';

/**
 * Hook for adding a new mapping between Glide and Supabase tables
 * 
 * This hook provides functionality to create a new mapping between a Glide table
 * and a Supabase table, including column mappings for data synchronization.
 * 
 * @returns {Object} Object containing the addMapping function and isSubmitting state
 * @returns {Function} addMapping - Function to create a new mapping
 * @returns {boolean} isSubmitting - State indicating if a mapping creation is in progress
 * 
 * @example
 * ```tsx
 * const { addMapping, isSubmitting } = useAddMapping();
 * 
 * const handleCreateMapping = async () => {
 *   const success = await addMapping(
 *     connectionId,
 *     glideTable,
 *     glideTableDisplayName,
 *     supabaseTable,
 *     'both'
 *   );
 *   
 *   if (success) {
 *     // Handle successful mapping creation
 *   }
 * };
 * ```
 */
export function useAddMapping() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  /**
   * Creates a new mapping between a Glide table and a Supabase table
   * 
   * @param {string} connectionId - ID of the connection to use
   * @param {string} glideTable - Name of the Glide table
   * @param {string} glideTableDisplayName - Display name of the Glide table
   * @param {string} supabaseTable - Name of the Supabase table
   * @param {'to_supabase' | 'to_glide' | 'both'} syncDirection - Direction of synchronization
   * @param {Record<string, GlColumnMapping>} [customColumnMappings] - Optional custom column mappings
   * @returns {Promise<boolean>} True if mapping was created successfully, false otherwise
   */
  const addMapping = async (
    connectionId: string,
    glideTable: string,
    glideTableDisplayName: string,
    supabaseTable: string,
    syncDirection: 'to_supabase' | 'to_glide' | 'both',
    customColumnMappings?: Record<string, GlColumnMapping>
  ): Promise<boolean> => {
    if (!connectionId || !glideTable || !supabaseTable) {
      toast({
        title: 'Validation Error',
        description: 'Please select a connection, Glide table, and Supabase table',
        variant: 'destructive',
      });
      return false;
    }

    setIsSubmitting(true);
    try {
      // Create default column mapping with $rowID to glide_row_id
      let columnMappings = customColumnMappings;
      
      // If custom mappings are not provided, use default
      if (!columnMappings || Object.keys(columnMappings).length === 0) {
        columnMappings = {
          '$rowID': {
            glide_column_name: '$rowID',
            supabase_column_name: 'glide_row_id',
            data_type: 'string'
          }
        };
      }
      
      // Ensure $rowID mapping exists for Glide sync to work
      if (!columnMappings['$rowID']) {
        columnMappings['$rowID'] = {
          glide_column_name: '$rowID',
          supabase_column_name: 'glide_row_id',
          data_type: 'string'
        };
      }
      
      // Convert the column_mappings to a plain object for database storage
      const serializedColumnMappings = JSON.parse(JSON.stringify(columnMappings));
      
      // Create the mapping
      const { error } = await supabase
        .from('gl_mappings')
        .insert({
          connection_id: connectionId,
          glide_table: glideTable,
          glide_table_display_name: glideTableDisplayName,
          supabase_table: supabaseTable,
          column_mappings: serializedColumnMappings,
          sync_direction: syncDirection,
          enabled: true
        });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Mapping created successfully',
      });
      
      return true;
    } catch (error) {
      console.error('Error adding mapping:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add mapping',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    addMapping,
    isSubmitting
  };
}
