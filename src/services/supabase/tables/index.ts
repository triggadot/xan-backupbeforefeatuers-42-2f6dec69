/**
 * Barrel file for Supabase table services
 * Import services from this file rather than directly from individual files
 * 
 * Note: The codebase currently has both kebab-case and snake_case files for the same services.
 * This barrel file exports from the kebab-case versions when available, falling back to snake_case.
 * Future updates should standardize on kebab-case naming for consistency.
 */

// Custom expenses service
export { glExpensesService } from './gl-expenses.service';

// Table services using kebab-case files when available
export * from './gl-expenses';             // Prefer kebab-case
export * from './gl-invoices';             // Prefer kebab-case
export * from './gl-invoice-lines';        // Prefer kebab-case
export * from './gl-invoice-payments';     // Prefer kebab-case
export * from './gl-products';             // Prefer kebab-case
export * from './gl-purchase-orders';      // Prefer kebab-case
export * from './gl-shipping-records';     // Prefer kebab-case
export * from './gl-estimates';            // Prefer kebab-case
export * from './gl-estimate-lines';       // Prefer kebab-case
export * from './gl-accounts';             // Prefer kebab-case
export * from './gl-customer-credits';     // Prefer kebab-case
export * from './gl-customer-payments';    // Prefer kebab-case
export * from './gl-vendor-payments';      // Prefer kebab-case

// Other services
export * from './gl_mappings';             // Only available in snake_case
export * from './messages';                // Utility service
export * from './pdf-operations';          // Utility service
export * from './gl_inventory_view';       // Only available in snake_case 