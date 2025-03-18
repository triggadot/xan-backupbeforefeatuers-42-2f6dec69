
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GlMapping } from '@/types/glsync';

export function useMappingValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);
  const { toast } = useToast();

  const validateMapping = useCallback(
    async (mapping: Partial<GlMapping>): Promise<boolean> => {
      if (!mapping.connection_id || !mapping.glide_table || !mapping.supabase_table) {
        setValidationResult({
          isValid: false,
          message: 'Connection, Glide table, and Supabase table are required',
        });
        return false;
      }

      // Ensure required fields
      if (!mapping.glide_table_display_name) {
        mapping.glide_table_display_name = mapping.glide_table;
      }

      // Validate column mappings
      if (!mapping.column_mappings || Object.keys(mapping.column_mappings).length === 0) {
        setValidationResult({
          isValid: false,
          message: 'At least one column mapping is required',
        });
        return false;
      }

      // Ensure $rowID mapping exists
      if (!mapping.column_mappings['$rowID']) {
        setValidationResult({
          isValid: false,
          message: 'Row ID mapping is required for Glide synchronization',
        });
        return false;
      }

      // Check if mapped Supabase columns exist in the target table
      setIsValidating(true);
      try {
        const { data: columns, error: columnsError } = await supabase.rpc(
          'get_table_columns',
          { table_name: mapping.supabase_table }
        );

        if (columnsError) throw columnsError;

        const availableColumns = new Set(columns.map((c) => c.column_name));
        const mappedColumns = Object.values(mapping.column_mappings).map(
          (c) => c.supabase_column_name
        );

        const invalidColumns = mappedColumns.filter((col) => !availableColumns.has(col));
        if (invalidColumns.length > 0) {
          setValidationResult({
            isValid: false,
            message: `The following columns do not exist in the target table: ${invalidColumns.join(
              ', '
            )}`,
          });
          return false;
        }

        setValidationResult({
          isValid: true,
          message: 'Mapping validation successful',
        });
        return true;
      } catch (error) {
        console.error('Error validating mapping:', error);
        setValidationResult({
          isValid: false,
          message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        
        toast({
          title: 'Validation Error',
          description: error instanceof Error ? error.message : 'Failed to validate mapping',
          variant: 'destructive',
        });
        
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [toast]
  );

  return {
    validateMapping,
    isValidating,
    validationResult,
  };
}
