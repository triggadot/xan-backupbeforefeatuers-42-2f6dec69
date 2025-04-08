/**
 * Main hooks index file
 * Exports all hooks from their respective directories for easy importing
 */

// Feature-based hooks
export * from './accounts';
export * from './products';
export * from './purchase-orders';
export * from './invoices';
export * from './estimates';
export * from './dashboard';
export * from './auth';
export * from './gl-sync';

// Utility hooks
export { useToast } from './use-toast';
export { useLocalStorage } from './useLocalStorage';
export { useMediaQuery } from './useMediaQuery';
export { useMounted } from './useMounted';
export { useDebounce } from './useDebounce';
export { useOnClickOutside } from './useOnClickOutside';
export { useWindowSize } from './useWindowSize';
