/**
 * Type definitions for gl_accounts table
 */

export interface GlAccountRecord {
  id: string;
  glide_row_id: string;
  account_name: string;
  client_type?: string;
  accounts_uid?: string;
  date_added_client?: string;
  email_of_who_added?: string;
  photo?: string;
  balance?: number;
  customer_balance?: number;
  vendor_balance?: number;
  created_at: string;
  updated_at: string;
}

export interface GlAccountInsert {
  glide_row_id: string;
  account_name: string;
  client_type?: string;
  accounts_uid?: string;
  date_added_client?: string;
  email_of_who_added?: string;
  photo?: string;
  balance?: number;
  customer_balance?: number;
  vendor_balance?: number;
}

export interface AccountFilters {
  clientType?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface AccountForm {
  accountName: string;
  clientType?: string;
  accountsUid?: string;
  dateAddedClient?: Date;
  emailOfWhoAdded?: string;
  photo?: string;
  balance?: number;
  customerBalance?: number;
  vendorBalance?: number;
}

export interface Account {
  id: string;
  glide_row_id: string;
  account_name: string;
  client_type?: string;
  accounts_uid?: string;
  date_added_client?: string;
  email_of_who_added?: string;
  photo?: string;
  balance?: number;
  customer_balance?: number;
  vendor_balance?: number;
  created_at: string;
  updated_at: string;
}

