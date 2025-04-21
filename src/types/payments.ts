
import { EntityBase } from './base';

export interface CustomerPayment extends EntityBase {
  rowid_invoices?: string;
  rowid_accounts?: string;
  payment_amount: number;
  date_of_payment: string;
  payment_type?: string;
  payment_note?: string;
  email_of_user?: string;
}

export interface VendorPayment extends EntityBase {
  rowid_purchase_orders?: string;
  rowid_accounts?: string;
  rowid_products?: string;
  payment_amount: number;
  date_of_payment: string;
  vendor_note?: string;
  date_of_purchase_order?: string;
}

export interface CustomerCredit extends EntityBase {
  rowid_invoices?: string;
  rowid_estimates?: string;
  rowid_accounts?: string;
  payment_amount: number;
  payment_note?: string;
  payment_type?: string;
  date_of_payment?: string;
}
