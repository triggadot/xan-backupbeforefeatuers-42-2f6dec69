
// Base interface representing a row from the materialized view mv_account_details
export interface AccountFromView {
  account_id: string;
  account_name: string;
  glide_row_id: string;
  accounts_uid?: string;
  client_type?: string;
  created_at: string;
  updated_at: string;
  invoice_count: number;
  total_invoiced: number;
  total_paid: number;
  balance: number;
  last_invoice_date?: string;
  last_payment_date?: string;
  is_customer: boolean;
  is_vendor: boolean;
  photo?: string;
}

// Account type that aligns with the materialized view structure
export interface Account {
  id: string;
  name: string;
  type: 'Customer' | 'Vendor' | 'Customer & Vendor';
  glide_row_id: string;
  accounts_uid?: string;
  status: 'active' | 'inactive';
  balance: number;
  created_at?: string;
  updated_at?: string;
  // Properties from materialized view
  is_customer: boolean;
  is_vendor: boolean;
  invoice_count?: number;
  total_invoiced?: number;
  total_paid?: number;
  last_invoice_date?: string;
  last_payment_date?: string;
  photo?: string;
  // These fields might not be in the view but are used in the UI
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
}

// For use with the Account Details page
export interface AccountDetails extends Account {
  // These are already in the base Account type from materialized view
}

// Interface for account balance information
export interface AccountBalance {
  id: string;
  balance: number;
  is_customer: boolean;
  is_vendor: boolean;
}
