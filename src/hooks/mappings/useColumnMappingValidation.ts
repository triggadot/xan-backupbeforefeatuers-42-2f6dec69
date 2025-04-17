/**
 * Hook for validating column mappings between Glide and Supabase tables
 * 
 * @deprecated This hook is maintained for backward compatibility.
 * Please use useGlSyncValidation instead.
 */

import { useGlSyncValidation } from '@/hooks/gl-sync/useGlSyncValidation';
import { MappingValidationResult, MappingToValidate } from '@/types/glide-sync/glsync';

/**
 * Hook that provides validation functionality for column mappings
 * 
 * @returns {Object} Object containing validation functions and state
 * @returns {Function} validateMapping - Function to validate a mapping
 * @returns {boolean} isValidating - State indicating if validation is in progress
 * @returns {MappingValidationResult} validationResult - Result of the validation
 * 
 * @example
 * ```tsx
 * const { validateMapping, isValidating, validationResult } = useColumnMappingValidation();
 * 
 * const handleValidate = async () => {
 *   await validateMapping(mappingToValidate);
 *   if (validationResult.is_valid) {
 *     // Proceed with valid mapping
 *   }
 * };
 * ```
 */
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
