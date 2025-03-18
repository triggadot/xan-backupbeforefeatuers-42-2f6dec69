
import { supabase } from '@/integrations/supabase/client';
import { MappingValidationResult } from '@/types/glsync';

export async function validateMapping(mappingId: string): Promise<MappingValidationResult> {
  try {
    const { data, error } = await supabase
      .from('gl_validate_column_mapping')
      .select('*')
      .eq('p_mapping_id', mappingId)
      .single();
      
    if (error) {
      return {
        is_valid: false,
        validation_message: `Validation error: ${error.message}`
      };
    }
    
    if (!data) {
      return {
        is_valid: false,
        validation_message: 'No validation result returned'
      };
    }
    
    return data as MappingValidationResult;
  } catch (error) {
    return {
      is_valid: false,
      validation_message: `Unexpected error during validation: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export function getDefaultColumnMappings(): Record<string, any> {
  // Always include the $rowID to glide_row_id mapping
  return {
    "$rowID": {
      "glide_column_name": "$rowID",
      "supabase_column_name": "glide_row_id",
      "data_type": "string"
    }
  };
}
