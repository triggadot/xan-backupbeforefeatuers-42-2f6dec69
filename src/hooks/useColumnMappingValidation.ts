
import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GlColumnMapping } from '@/types/glsync';
import { TypedColumnMapping, ensureValidDataType, isValidDataType } from '@/types/syncLog';

export function useColumnMappingValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const validateColumnMapping = useCallback(async (
    tableName: string,
    columnMappings: Record<string, GlColumnMapping>
  ): Promise<{ isValid: boolean; message: string }> => {
    if (!tableName) {
      return { isValid: false, message: 'Table name is required' };
    }

    if (!columnMappings || Object.keys(columnMappings).length === 0) {
      return { isValid: false, message: 'At least one column mapping is required' };
    }

    setIsValidating(true);
    try {
      // Validate with our enhanced database function 
      // by passing the mapping as JSON
      const { data, error } = await supabase.rpc('gl_validate_mapping_data', {
        p_mapping: {
          supabase_table: tableName,
          column_mappings: columnMappings
        }
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        return { 
          isValid: false, 
          message: 'Validation failed: No response from server'
        };
      }

      const result = data[0];
      return {
        isValid: result.is_valid,
        message: result.validation_message
      };
    } catch (error) {
      console.error('Error validating column mappings:', error);
      return {
        isValid: false,
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const suggestColumnMappings = useCallback(async (
    tableName: string,
    glideColumns: Array<{ id: string; name: string; type?: string }>
  ): Promise<Record<string, GlColumnMapping>> => {
    if (!tableName || !glideColumns.length) {
      return {
        '$rowID': {
          glide_column_name: '$rowID',
          supabase_column_name: 'glide_row_id',
          data_type: 'string'
        }
      };
    }

    try {
      // Convert glideColumns to format expected by the function
      const columnsJson = glideColumns.map(col => ({
        id: col.id,
        name: col.name,
        type: col.type || null
      }));

      // Call our new database function
      const { data, error } = await supabase.rpc('gl_suggest_column_mappings', {
        p_supabase_table: tableName,
        p_glide_columns: columnsJson
      });

      if (error) throw error;

      // Process suggestions
      const suggestedMappings: Record<string, GlColumnMapping> = {
        '$rowID': {
          glide_column_name: '$rowID',
          supabase_column_name: 'glide_row_id',
          data_type: 'string'
        }
      };

      // Add suggested mappings with type validation
      if (data && data.length > 0) {
        for (const suggestion of data) {
          // Find the original glide column
          const glideCol = glideColumns.find(col => col.name === suggestion.glide_column_name);
          if (glideCol) {
            let dataType = suggestion.data_type;
            
            // Ensure valid data type
            if (!isValidDataType(dataType)) {
              dataType = 'string';
            }
            
            suggestedMappings[glideCol.id] = {
              glide_column_name: glideCol.name,
              supabase_column_name: suggestion.suggested_supabase_column,
              data_type: dataType as any
            };
          }
        }
      }

      return suggestedMappings;
    } catch (error) {
      console.error('Error generating column mapping suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate column mapping suggestions',
        variant: 'destructive',
      });
      
      return {
        '$rowID': {
          glide_column_name: '$rowID',
          supabase_column_name: 'glide_row_id',
          data_type: 'string'
        }
      };
    }
  }, [toast]);

  return {
    validateColumnMapping,
    suggestColumnMappings,
    isValidating
  };
}
