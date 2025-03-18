import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GlColumnMapping } from '@/types/glsync';

export function useAddMapping() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
      
      // Create the mapping
      const { error } = await supabase
        .from('gl_mappings')
        .insert({
          connection_id: connectionId,
          glide_table: glideTable,
          glide_table_display_name: glideTableDisplayName,
          supabase_table: supabaseTable,
          column_mappings: columnMappings,
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
