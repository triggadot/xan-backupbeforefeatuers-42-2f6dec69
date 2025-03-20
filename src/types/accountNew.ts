
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
  is_customer: boolean;
  is_vendor: boolean;
  // Additional fields from materialized view
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
