
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GlColumnMapping, MappingValidationResult } from '@/types/glsync';

interface MappingToValidate {
  supabase_table: string;
  column_mappings: Record<string, GlColumnMapping>;
}

export function useColumnMappingValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<MappingValidationResult | null>(null);

  const validateMapping = async (mapping: MappingToValidate): Promise<MappingValidationResult> => {
    setIsValidating(true);
    setValidationResult(null);
    
    try {
      // Convert the mapping to a format we can send to the server
      const mappingToValidate = {
        supabase_table: mapping.supabase_table,
        column_mappings: mapping.column_mappings
      };

      const { data, error } = await supabase
        .rpc('gl_validate_mapping_data', { 
          p_mapping: mappingToValidate as any,
          p_editing: false 
        });
        
      if (error) throw error;
      
      const result: MappingValidationResult = {
        is_valid: data.is_valid || false,
        validation_message: data.validation_message || 'Validation failed'
      };
      
      setValidationResult(result);
      return result;
    } catch (error) {
      console.error('Error validating mapping:', error);
      const errorResult: MappingValidationResult = {
        is_valid: false,
        validation_message: error instanceof Error ? error.message : 'Unknown error validating mapping'
      };
      setValidationResult(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateMapping,
    isValidating,
    validationResult
  };
}
