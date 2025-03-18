
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MappingValidationResult, MappingToValidate } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

export function useColumnMappingValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<MappingValidationResult>({
    is_valid: true,
    validation_message: ''
  });
  const { toast } = useToast();

  const validateMapping = async (mapping: MappingToValidate): Promise<MappingValidationResult> => {
    if (!mapping.supabase_table || !mapping.column_mappings) {
      return {
        is_valid: false,
        validation_message: 'Invalid mapping data: missing table or column mappings'
      };
    }

    setIsValidating(true);
    try {
      // Call the database function to validate the mapping
      const { data, error } = await supabase
        .rpc('gl_validate_mapping_data', { 
          p_mapping_json: JSON.stringify(mapping)
        });
      
      if (error) {
        throw error;
      }
      
      const result: MappingValidationResult = {
        is_valid: data?.[0]?.is_valid ?? false,
        validation_message: data?.[0]?.validation_message ?? 'Validation failed'
      };
      
      setValidationResult(result);
      return result;
    } catch (error) {
      console.error('Error validating mapping:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred during validation';
        
      const result: MappingValidationResult = {
        is_valid: false,
        validation_message: errorMessage
      };
      
      setValidationResult(result);
      
      toast({
        title: 'Validation Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return result;
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
