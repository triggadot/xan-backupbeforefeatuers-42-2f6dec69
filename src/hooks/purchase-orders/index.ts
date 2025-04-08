/**
 * Purchase Orders hooks index file
 * Exports all purchase order-related hooks for easy importing
 * 
 * Following Feature-Based Architecture pattern, this organizes hooks by domain
 * rather than by technical role to enhance maintainability and clarity.
 */

// Primary hooks (preferred for new components)
export { usePurchaseOrders } from './usePurchaseOrders.ts';
export { usePurchaseOrderDetail } from './usePurchaseOrderDetail.ts';

// Backward compatibility exports
export { usePurchaseOrders as useFetchPurchaseOrders } from './usePurchaseOrders.ts';
export { usePurchaseOrders as usePurchaseOrdersNew } from './usePurchaseOrders.ts';
export { usePurchaseOrders as usePurchaseOrdersView } from './usePurchaseOrders.ts';
export { usePurchaseOrderDetail as usePurchaseOrderDetailStandardized } from './usePurchaseOrderDetail.ts';
