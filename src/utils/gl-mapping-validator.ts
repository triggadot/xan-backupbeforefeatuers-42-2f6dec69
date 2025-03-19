
import { supabase } from '@/integrations/supabase/client';
import { MappingValidationResult } from '@/types/glsync';

export const validateMapping = async (mappingId: string): Promise<MappingValidationResult> => {
  try {
    const { data, error } = await supabase
      .rpc('gl_validate_column_mapping', { p_mapping_id: mappingId });
      
    if (error) throw error;
    
    return {
      isValid: data[0].is_valid,
      message: data[0].validation_message
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to validate mapping';
    return {
      isValid: false,
      message: errorMessage
    };
  }
};
