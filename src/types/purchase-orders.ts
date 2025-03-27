
// Import the existing PurchaseOrder interface from purchaseOrder.ts
import {
  PurchaseOrder as BasePurchaseOrder,
  PurchaseOrderLineItem,
  VendorPayment,
  PurchaseOrderWithVendor,
  PurchaseOrderFilters
} from './purchaseOrder';

// Re-export all the types
export type {
  BasePurchaseOrder as PurchaseOrder,
  PurchaseOrderLineItem,
  VendorPayment,
  PurchaseOrderWithVendor,
  PurchaseOrderFilters
};

// Add any additional types specific to the purchase-orders module if needed
