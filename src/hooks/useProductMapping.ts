import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GlMapping, GlColumnMapping } from '@/types/glsync';

interface UseProductMappingProps {
  mappingId?: string;
}

export function useProductMapping({ mappingId }: UseProductMappingProps = {}) {
  const [mapping, setMapping] = useState<GlMapping | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMapping = useCallback(async () => {
    if (!mappingId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('gl_mappings')
        .select('*')
        .eq('id', mappingId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        setError('Mapping not found');
        return;
      }

      const rawMapping = data;

      // Convert column_mappings to the correct type
      const columnMappings: Record<string, GlColumnMapping> = typeof rawMapping.column_mappings === 'string'
        ? JSON.parse(rawMapping.column_mappings)
        : rawMapping.column_mappings;

      // Ensure sync_direction is the correct type
      const syncDirection = rawMapping.sync_direction as "to_supabase" | "to_glide" | "both";

      setMapping({
        id: rawMapping.id,
        connection_id: rawMapping.connection_id,
        glide_table: rawMapping.glide_table,
        glide_table_display_name: rawMapping.glide_table_display_name,
        supabase_table: rawMapping.supabase_table,
        column_mappings: columnMappings,
        sync_direction: syncDirection,
        enabled: rawMapping.enabled,
        created_at: rawMapping.created_at,
        updated_at: rawMapping.updated_at,
        current_status: rawMapping.current_status,
        last_sync_started_at: rawMapping.last_sync_started_at,
        last_sync_completed_at: rawMapping.last_sync_completed_at,
        records_processed: rawMapping.records_processed,
        total_records: rawMapping.total_records,
        error_count: rawMapping.error_count,
        app_name: rawMapping.app_name
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch mapping';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [mappingId, toast]);

  useEffect(() => {
    if (mappingId) {
      fetchMapping();
    }
  }, [mappingId, fetchMapping]);

  return {
    mapping,
    isLoading,
    error,
    fetchMapping,
  };
}
