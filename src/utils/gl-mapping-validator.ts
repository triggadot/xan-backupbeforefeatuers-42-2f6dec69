
import { supabase } from '@/integrations/supabase/client';
import { MappingValidationResult } from '@/types/glsync';

export async function validateMapping(mappingId: string): Promise<MappingValidationResult> {
  try {
    const { data, error } = await supabase
      .rpc('gl_validate_column_mapping', { p_mapping_id: mappingId });
      
    if (error) {
      return {
        isValid: false,
        message: `Validation error: ${error.message}`
      };
    }
    
    if (!data || !data[0]) {
      return {
        isValid: false,
        message: 'No validation result returned'
      };
    }
    
    // Access the first element of the array since RPC returns an array
    const result = data[0];
    return {
      isValid: result.is_valid,
      message: result.validation_message
    };
  } catch (error) {
    return {
      isValid: false,
      message: `Unexpected error during validation: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export function getDefaultColumnMappings(): Record<string, any> {
  return {
    "$rowID": {
      "glide_column_name": "$rowID",
      "supabase_column_name": "glide_row_id",
      "data_type": "string"
    }
  };
}
