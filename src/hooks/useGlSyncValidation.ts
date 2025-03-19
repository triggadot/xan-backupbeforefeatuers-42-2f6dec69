
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MappingValidationResult } from '@/types/glsync';

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
      const result = data[0];
      
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

  return {
    validateMappingConfig,
    validating,
    validation
  };
}
