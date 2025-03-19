
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MappingValidationResult } from '@/types/glsync';
import { validateMapping } from '@/utils/gl-mapping-validator';

export function useGlSyncValidation() {
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<MappingValidationResult | null>(null);
  const { toast } = useToast();

  const validateMappingConfig = useCallback(async (mappingId: string) => {
    setValidating(true);
    setValidation(null);

    try {
      const result = await validateMapping(mappingId);
      
      setValidation({
        isValid: result.isValid,
        message: result.message
      });

      if (!result.isValid) {
        toast({
          title: 'Validation Error',
          description: result.message,
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during validation';
      
      setValidation({
        isValid: false,
        message
      });
      
      toast({
        title: 'Validation Error',
        description: message,
        variant: 'destructive',
      });
      
      return { isValid: false, message };
    } finally {
      setValidating(false);
    }
  }, [toast]);

  return {
    validating,
    validation,
    validateMappingConfig
  };
}
