
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MappingValidationResult, MappingToValidate } from '@/types/glsync';
import { useToast } from '@/hooks/use-toast';

export function useColumnMappingValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<MappingValidationResult>({
    isValid: true,
    message: ''
  });
  const { toast } = useToast();

  const validateMapping = async (mapping: MappingToValidate): Promise<MappingValidationResult> => {
    if (!mapping.supabase_table || !mapping.column_mappings) {
      return {
        isValid: false,
        message: 'Invalid mapping data: missing table or column mappings'
      };
    }

    setIsValidating(true);
    try {
      // Call the database function to validate the mapping
      // Convert the mapping to a plain object that can be serialized as JSON
      const { data, error } = await supabase
        .rpc('gl_validate_mapping_data', { 
          p_mapping: mapping as any // Use type assertion to bypass TypeScript's type checking
        });
      
      if (error) {
        throw error;
      }
      
      const result: MappingValidationResult = {
        isValid: data?.[0]?.is_valid ?? false,
        message: data?.[0]?.validation_message ?? 'Validation failed'
      };
      
      setValidationResult(result);
      return result;
    } catch (error) {
      console.error('Error validating mapping:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred during validation';
        
      const result: MappingValidationResult = {
        isValid: false,
        message: errorMessage
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
