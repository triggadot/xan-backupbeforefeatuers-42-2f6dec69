
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { validateMapping } from '@/utils/gl-mapping-validator';

export function useGlSyncValidation() {
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);
  const { toast } = useToast();

  const validateMappingConfig = async (mappingId: string) => {
    setValidating(true);
    try {
      const result = await validateMapping(mappingId);
      setValidation({
        isValid: result.is_valid,
        message: result.validation_message
      });
      
      if (result.is_valid) {
        toast({
          title: 'Validation successful',
          description: result.validation_message,
        });
      } else {
        toast({
          title: 'Validation failed',
          description: result.validation_message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Validation error',
        description: `Could not validate mapping: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
      setValidation({
        isValid: false,
        message: `Error during validation: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setValidating(false);
    }
  };

  return {
    validating,
    validation,
    validateMappingConfig
  };
}
