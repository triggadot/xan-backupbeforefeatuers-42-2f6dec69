
import { EntityBase } from './common/common';

/**
 * Represents a payment made to a vendor for a purchase order
 */
export interface VendorPayment extends EntityBase {
  /** Payment amount */
  amount: number;
  
  /** Date the payment was made */
  payment_date: string | Date;
  
  /** Method of payment (e.g., 'Check', 'Credit Card', 'Bank Transfer') */
  payment_method?: string;
  
  /** Additional notes about the payment */
  payment_notes?: string;
  
  /** Related purchase order ID */
  rowid_purchase_orders?: string;
  
  /** Related product ID if payment is for a specific product */
  rowid_products?: string;
  
  /** Related vendor account ID */
  rowid_accounts?: string;
  
  /** UI helper field for vendor name */
  vendorName?: string;
  
  /** UI helper field for purchase order number */
  purchaseOrderNumber?: string;
  
  /** UI helper field for product name */
  productName?: string;
}
