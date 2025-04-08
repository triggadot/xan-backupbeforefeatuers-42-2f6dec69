/**
 * Estimates hooks index file
 * Exports all estimate-related hooks for easy importing
 * 
 * Following Feature-Based Architecture pattern, this organizes hooks by domain
 * rather than by technical role to enhance maintainability and clarity.
 */

// Primary hooks (preferred for new components)
export { useEstimates } from './useEstimates.ts';
export { useEstimateDetail } from './useEstimateDetail.ts';

// Estimate line items and credits
export { useEstimateLines } from './useEstimateLines.ts';
export { useEstimateCredits } from './useEstimateCredits.ts';

// Backward compatibility exports
export { useEstimates as useFetchEstimates } from './useEstimates.ts';
