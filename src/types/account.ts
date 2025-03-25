
import { EntityBase } from './common';

export interface GlAccount extends EntityBase {
  account_name: string;
  client_type?: string;
  email_of_who_added?: string;
  date_added_client?: string;
  photo?: string;
  balance?: number;
  
  // UI helper fields
  isCustomer?: boolean;
  isVendor?: boolean;
  type?: 'customer' | 'vendor' | 'both';
}

export interface AccountFilters {
  type?: 'customer' | 'vendor' | 'both';
  search?: string;
  hasBalance?: boolean;
}
