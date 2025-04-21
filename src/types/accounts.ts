
import { AccountType, BaseEntity, BaseRow, EntityStatus } from './base';

export interface AccountRow extends BaseRow {
  account_name?: string;
  client_type?: string;
  photo?: string;
  email_of_who_added?: string;
  customer_balance?: number;
  vendor_balance?: number;
  balance?: number;
  accounts_uid?: string;
  date_added_client?: string;
}

export interface Account extends BaseEntity {
  name: string;
  type: AccountType;
  status: EntityStatus;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
  photoUrl?: string;
  customerBalance?: number;
  vendorBalance?: number;
  totalBalance?: number;
  uid?: string;
  dateAdded?: string;
}

export interface AccountFormData {
  name: string;
  type: AccountType;
  status: 'active' | 'inactive';
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
}

export interface AccountWithBalance extends Account {
  recentInvoices?: any[];
  recentPayments?: any[];
  unpaidInvoices?: any[];
}
