
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ValidationResult } from '@/types/syncLog';

export function useGlSyncValidation() {
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const { toast } = useToast();

  const validateMappingConfig = useCallback(async (mappingId: string) => {
    setValidating(true);
    try {
      const { data, error } = await supabase
        .rpc('gl_validate_column_mapping', { p_mapping_id: mappingId });
        
      if (error) {
        setValidation({
          isValid: false,
          message: `Validation error: ${error.message}`
        });
        return false;
      }
      
      if (!data || !data[0]) {
        setValidation({
          isValid: false,
          message: 'No validation result returned'
        });
        return false;
      }
      
      // Access the first element of the array since RPC returns an array
      const result = data[0];
      
      setValidation({
        isValid: result.is_valid,
        message: result.validation_message
      });
      
      if (result.is_valid) {
        toast({
          title: 'Validation Successful',
          description: 'The mapping configuration is valid.',
        });
      } else {
        toast({
          title: 'Validation Issues',
          description: result.validation_message,
          variant: 'destructive',
        });
      }
      
      return result.is_valid;
    } catch (error) {
      console.error('Error validating mapping:', error);
      setValidation({
        isValid: false,
        message: `Unexpected error during validation: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      toast({
        title: 'Validation Error',
        description: 'Failed to validate mapping configuration',
        variant: 'destructive',
      });
      return false;
    } finally {
      setValidating(false);
    }
  }, [toast]);

  return {
    validating,
    validation,
    validateMappingConfig,
    resetValidation: () => setValidation(null)
  };
}
