
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  isValid: boolean;
  message: string;
  details?: Record<string, string[]>;
}

export function useGlSyncValidation() {
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const { toast } = useToast();

  const validateMappingConfig = useCallback(async (mappingId: string) => {
    setValidating(true);
    try {
      // First get the mapping details
      const { data: mappingData, error: mappingError } = await supabase
        .from('gl_mappings')
        .select('*')
        .eq('id', mappingId)
        .single();
      
      if (mappingError) throw mappingError;
      
      // Call the validation function
      const { data: validationResult, error: validationError } = await supabase
        .rpc('gl_validate_column_mapping', { 
          p_supabase_table: mappingData.supabase_table,
          p_column_mappings: mappingData.column_mappings
        });
      
      if (validationError) throw validationError;
      
      // Process the validation result
      const result: ValidationResult = {
        isValid: validationResult.is_valid,
        message: validationResult.validation_message,
        details: {}
      };
      
      // Set validation state and show toast
      setValidation(result);
      
      toast({
        title: result.isValid ? 'Validation Successful' : 'Validation Failed',
        description: result.message,
        variant: result.isValid ? 'default' : 'destructive',
      });
      
      return result;
    } catch (error) {
      console.error('Error validating mapping:', error);
      
      const errorResult: ValidationResult = {
        isValid: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred during validation',
      };
      
      setValidation(errorResult);
      
      toast({
        title: 'Validation Error',
        description: errorResult.message,
        variant: 'destructive',
      });
      
      return errorResult;
    } finally {
      setValidating(false);
    }
  }, [toast]);

  return {
    validating,
    validation,
    validateMappingConfig,
  };
}
