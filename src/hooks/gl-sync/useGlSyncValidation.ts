import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/utils/use-toast';
import { MappingValidationResult, MappingToValidate } from '@/types/glsync';

export function useGlSyncValidation() {
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const validateMappingConfig = useCallback(async (mappingId: string): Promise<boolean> => {
    setValidating(true);
    try {
      // Call the validate RPC function
      const { data, error } = await supabase.rpc('gl_validate_column_mapping', {
        p_mapping_id: mappingId
      });
      
      if (error) {
        throw new Error(`Validation error: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('No validation result returned');
      }
      
      // Success - get the results from the first row
      const result: MappingValidationResult = data[0];
      
      setValidation({
        isValid: result.is_valid,
        message: result.validation_message
      });
      
      return result.is_valid;
    } catch (error) {
      console.error('Error validating mapping configuration:', error);
      
      setValidation({
        isValid: false,
        message: `Error during validation: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      
      toast({
        title: 'Validation error',
        description: error instanceof Error ? error.message : 'Unknown error occurred during validation',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setValidating(false);
    }
  }, [toast]);

  // New function from useColumnMappingValidation to validate by mapping data
  const validateMapping = useCallback(async (mapping: MappingToValidate): Promise<MappingValidationResult> => {
    if (!mapping.supabase_table || !mapping.column_mappings) {
      const result = {
        is_valid: false,
        validation_message: 'Invalid mapping data: missing table or column mappings'
      };
      
      setValidation({
        isValid: result.is_valid,
        message: result.validation_message
      });
      
      return result;
    }

    setValidating(true);
    try {
      // Call the database function to validate the mapping
      // First convert to JSON string and back to ensure we have a serializable object
      const serializedMapping = JSON.parse(JSON.stringify(mapping));
      
      const { data, error } = await supabase
        .rpc('gl_validate_mapping_data', { 
          p_mapping: serializedMapping
        });
      
      if (error) {
        throw error;
      }
      
      const result: MappingValidationResult = {
        is_valid: data?.[0]?.is_valid ?? false,
        validation_message: data?.[0]?.validation_message ?? 'Validation failed'
      };
      
      setValidation({
        isValid: result.is_valid,
        message: result.validation_message
      });
      
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
      
      setValidation({
        isValid: result.is_valid,
        message: result.validation_message
      });
      
      toast({
        title: 'Validation Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return result;
    } finally {
      setValidating(false);
    }
  }, [toast]);

  return {
    validateMappingConfig,
    validateMapping,
    validating,
    validation
  };
}
