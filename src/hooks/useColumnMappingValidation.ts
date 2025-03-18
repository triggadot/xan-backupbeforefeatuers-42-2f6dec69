
import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GlColumnMapping } from '@/types/glsync';

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
      // Get columns from the target table
      const { data: columns, error } = await supabase.rpc('get_table_columns', {
        table_name: tableName
      });

      if (error) throw error;

      const tableColumns = new Set(columns.map((col: any) => col.column_name));

      // Check if mapped columns exist in the target table
      const invalidColumns: string[] = [];
      
      for (const [key, mapping] of Object.entries(columnMappings)) {
        if (!tableColumns.has(mapping.supabase_column_name)) {
          invalidColumns.push(`${mapping.supabase_column_name} (mapped from ${mapping.glide_column_name})`);
        }
      }

      if (invalidColumns.length > 0) {
        return {
          isValid: false,
          message: `The following columns do not exist in the target table: ${invalidColumns.join(', ')}`
        };
      }

      // Check for $rowID mapping
      const rowIdMapping = Object.entries(columnMappings).find(
        ([id]) => id === '$rowID'
      );

      if (!rowIdMapping) {
        return {
          isValid: false,
          message: 'Row ID mapping ($rowID to glide_row_id) is required for Glide synchronization'
        };
      }

      return { isValid: true, message: 'Column mappings are valid' };
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
      const { data: columns, error } = await supabase.rpc('get_table_columns', {
        table_name: tableName
      });

      if (error) throw error;

      const suggestedMappings: Record<string, GlColumnMapping> = {
        '$rowID': {
          glide_column_name: '$rowID',
          supabase_column_name: 'glide_row_id',
          data_type: 'string'
        }
      };

      const tableColumns = columns.map((col: any) => col.column_name);
      
      // Create suggested mappings based on name similarity
      for (const glideCol of glideColumns) {
        if (glideCol.id === '$rowID') continue;
        
        // Try to find a matching column in Supabase
        const supabaseColName = getClosestColumnMatch(glideCol.name, tableColumns);
        
        if (supabaseColName) {
          // Determine data type
          let dataType: 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address' = 'string';
          
          // Try to infer from Glide column type if available
          if (glideCol.type) {
            if (['number', 'integer', 'float'].includes(glideCol.type.toLowerCase())) {
              dataType = 'number';
            } else if (['boolean', 'bool', 'checkbox'].includes(glideCol.type.toLowerCase())) {
              dataType = 'boolean';
            } else if (['date', 'datetime', 'timestamp'].includes(glideCol.type.toLowerCase())) {
              dataType = 'date-time';
            } else if (glideCol.type.toLowerCase().includes('image') || glideCol.type.toLowerCase().includes('photo')) {
              dataType = 'image-uri';
            } else if (glideCol.type.toLowerCase().includes('email')) {
              dataType = 'email-address';
            }
          }
          
          suggestedMappings[glideCol.id] = {
            glide_column_name: glideCol.name,
            supabase_column_name: supabaseColName,
            data_type: dataType
          };
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

  // Utility function to find closest column name match
  const getClosestColumnMatch = (glideName: string, supabaseColumns: string[]): string | null => {
    // Convert to lowercase and remove spaces for comparison
    const normalizedGlideName = glideName.toLowerCase().replace(/\s+/g, '_');
    
    // Try exact match first
    const exactMatch = supabaseColumns.find(
      col => col.toLowerCase() === normalizedGlideName
    );
    
    if (exactMatch) return exactMatch;
    
    // Try contains match
    const containsMatch = supabaseColumns.find(
      col => col.toLowerCase().includes(normalizedGlideName) || 
             normalizedGlideName.includes(col.toLowerCase())
    );
    
    if (containsMatch) return containsMatch;
    
    // If not found, return null
    return null;
  };

  return {
    validateColumnMapping,
    suggestColumnMappings,
    isValidating
  };
}
