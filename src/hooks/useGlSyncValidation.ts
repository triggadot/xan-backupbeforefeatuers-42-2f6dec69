
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ValidationResult } from '@/types/syncLog';

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
          p_mapping_id: mappingId
        });
      
      if (validationError) throw validationError;
      
      console.log('Validation result:', validationResult);
      
      // Process the validation result
      let result: ValidationResult;
      
      if (Array.isArray(validationResult) && validationResult.length > 0) {
        // Handle array result format
        result = {
          isValid: validationResult[0].is_valid === true,
          message: validationResult[0].validation_message || 'Validation completed',
          details: {}
        };
      } else if (validationResult && typeof validationResult === 'object') {
        // Handle object result format with typed assertion
        const typedResult = validationResult as { is_valid: boolean; validation_message: string };
        result = {
          isValid: typedResult.is_valid === true,
          message: typedResult.validation_message || 'Validation completed',
          details: {}
        };
      } else {
        // Default case for unexpected result format
        result = {
          isValid: false,
          message: 'Unable to validate mapping configuration: unexpected result format',
          details: {}
        };
      }
      
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
