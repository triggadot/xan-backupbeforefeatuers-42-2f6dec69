
// Base interface representing a row from the materialized view mv_account_details
export interface AccountFromView {
  account_id: string;
  account_name: string;
  glide_row_id: string;
  accounts_uid?: string;
  client_type?: string;
  email_of_who_added?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  photo?: string;
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
}

// Account type that aligns with the materialized view structure
export interface Account {
  id: string;
  name: string;
  type: 'customer' | 'vendor' | 'both';
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  status: 'active' | 'inactive';
  balance: number;
  glide_row_id: string;
  accounts_uid?: string;
  photo?: string;
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
}

// For use with the Account Details page
export interface AccountDetails extends Account {
  // These are already in the base Account type from materialized view
}
