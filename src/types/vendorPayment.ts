import { EntityBase } from './common';

export interface VendorPayment extends EntityBase {
  amount: number;
  payment_date: string | Date;
  payment_method?: string;
  payment_notes?: string;
  rowid_purchase_orders?: string;
  rowid_products?: string;
  rowid_accounts?: string;
  
  // UI helper fields
  vendorName?: string;
  purchaseOrderNumber?: string;
  productName?: string;
}
