// DEPRECATED: This hook is maintained for backward compatibility.
// Please use useGlSyncValidation instead.
import { useGlSyncValidation } from './useGlSyncValidation';
import { MappingValidationResult, MappingToValidate } from '@/types/glsync';

export function useColumnMappingValidation() {
  // Use the enhanced hook
  const { 
    validateMapping, 
    validating: isValidating, 
    validation 
  } = useGlSyncValidation();
  
  // Adapt the validation result to match the old API
  const validationResult = validation ? {
    is_valid: validation.isValid,
    validation_message: validation.message
  } : {
    is_valid: true,
    validation_message: ''
  };

  // Return the object with the same structure as the original hook
  return {
    validateMapping,
    isValidating,
    validationResult
  };
}
