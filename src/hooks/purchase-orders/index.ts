
/**
 * Purchase Orders hooks index file
 * Exports all purchase order-related hooks for easy importing
 * 
 * Following Feature-Based Architecture pattern, this organizes hooks by domain
 * rather than by technical role to enhance maintainability and clarity.
 */

// Primary hooks (preferred for new components)
export { usePurchaseOrders } from './usePurchaseOrders';
export { usePurchaseOrderDetail } from './usePurchaseOrderDetail';
export { usePurchaseOrderMutation } from './usePurchaseOrderMutation';
export { usePaymentOperations } from './usePaymentOperations';
export { useVendorPayments } from './useVendorPayments';

// Backward compatibility exports
export { usePurchaseOrders as useFetchPurchaseOrders } from './usePurchaseOrders';
export { usePurchaseOrders as usePurchaseOrdersNew } from './usePurchaseOrders';
export { usePurchaseOrders as usePurchaseOrdersView } from './usePurchaseOrders';
export { usePurchaseOrderDetail as usePurchaseOrderDetailStandardized } from './usePurchaseOrderDetail';
