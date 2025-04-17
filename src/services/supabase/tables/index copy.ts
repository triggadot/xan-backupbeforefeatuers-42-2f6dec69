/**
 * Exports all Supabase table services
 * This makes it easier to import multiple services in components
 */

// Export kebab-case services (new standard)
export * from './gl-products';
export * from './gl-vendor-payments';
export * from './gl-purchase-orders';
export * from './gl-shipping-records';
export * from './gl-invoices';
export * from './gl-expenses';
export * from './gl-invoice-lines';
export * from './gl-estimate-lines';
export * from './gl-estimates';
export * from './gl-customer-credits';
export * from './gl-customer-payments';
export * from './gl-accounts';
export * from './gl-invoice-payments';
export * from './messages';
export * from './pdf-operations';

// Legacy underscore services (will be deprecated)
// Only include services that don't have kebab-case equivalents yet
export * from './gl_mappings';
export * from './gl_inventory_view';

// Once all services are migrated to kebab-case, the legacy services
// should be removed to maintain a clean structure
