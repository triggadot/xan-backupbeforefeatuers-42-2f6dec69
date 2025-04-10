/**
 * Invoice hooks index file
 * Exports all invoice-related hooks for easy importing
 * 
 * Following Feature-Based Architecture pattern, this organizes hooks by domain
 * rather than by technical role to enhance maintainability and clarity.
 */

// Primary hooks (preferred for new components)
export { useInvoiceDetail } from './useInvoiceDetail.ts';
export { useInvoices } from './useInvoices.ts';

// Supporting hooks
export { useInvoiceLineItems } from './useInvoiceLineItems.ts';
export { useInvoiceMutation } from './useInvoiceMutation.ts';
export { useInvoicePayments } from './useInvoicePayments.ts';

// Backward compatibility exports
export { useInvoiceDetail as useInvoiceDetailNew } from './useInvoiceDetail.ts';
export { useInvoices as useFetchInvoices } from './useInvoices.ts';

