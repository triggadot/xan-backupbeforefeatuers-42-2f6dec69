
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GlMapping, GlColumnMapping } from '@/types/glsync';
import { useMappingValidation } from './useMappingValidation';

export function useMappingOperations() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { validateMapping } = useMappingValidation();

  const createMapping = async (mapping: Partial<GlMapping>): Promise<GlMapping | null> => {
    // Validate mapping
    const isValid = await validateMapping(mapping);
    if (!isValid) return null;

    setIsSubmitting(true);
    try {
      // Ensure default $rowID mapping if not provided
      if (!mapping.column_mappings?.['$rowID']) {
        if (!mapping.column_mappings) mapping.column_mappings = {};
        mapping.column_mappings['$rowID'] = {
          glide_column_name: '$rowID',
          supabase_column_name: 'glide_row_id',
          data_type: 'string',
        };
      }

      // Convert GlMapping column_mappings to a format Supabase can handle
      const dbMapping = {
        connection_id: mapping.connection_id,
        glide_table: mapping.glide_table,
        glide_table_display_name: mapping.glide_table_display_name,
        supabase_table: mapping.supabase_table,
        column_mappings: mapping.column_mappings as Record<string, unknown>,
        sync_direction: mapping.sync_direction || 'to_supabase',
        enabled: mapping.enabled !== undefined ? mapping.enabled : true,
      };

      const { data, error } = await supabase
        .from('gl_mappings')
        .insert(dbMapping)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Mapping created successfully',
      });

      // Convert the returned data to a GlMapping with the proper types
      return {
        ...data,
        column_mappings: data.column_mappings as unknown as Record<string, GlColumnMapping>
      } as GlMapping;
    } catch (error) {
      console.error('Error creating mapping:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create mapping',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateMapping = async (id: string, mapping: Partial<GlMapping>): Promise<GlMapping | null> => {
    // Validate mapping
    const isValid = await validateMapping(mapping);
    if (!isValid) return null;

    setIsSubmitting(true);
    try {
      // Convert GlMapping column_mappings to a format Supabase can handle
      const dbMapping = {
        connection_id: mapping.connection_id,
        glide_table: mapping.glide_table,
        glide_table_display_name: mapping.glide_table_display_name,
        supabase_table: mapping.supabase_table,
        column_mappings: mapping.column_mappings as Record<string, unknown>,
        sync_direction: mapping.sync_direction,
        enabled: mapping.enabled,
      };

      const { data, error } = await supabase
        .from('gl_mappings')
        .update(dbMapping)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Mapping updated successfully',
      });

      // Convert the returned data to a GlMapping with the proper types
      return {
        ...data,
        column_mappings: data.column_mappings as unknown as Record<string, GlColumnMapping>
      } as GlMapping;
    } catch (error) {
      console.error('Error updating mapping:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update mapping',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteMapping = async (id: string): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('gl_mappings').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Mapping deleted successfully',
      });

      return true;
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete mapping',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createMapping,
    updateMapping,
    deleteMapping,
    isSubmitting,
  };
}
