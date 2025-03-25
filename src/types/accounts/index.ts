
/**
 * Account type definitions
 * Consolidated from previous account.ts and accountNew.ts files
 */
import { EntityBase, EntityStatus, EntityWithName } from '../common';

/**
 * Account type represents the primary interface for client/vendor entities
 * Extends EntityBase to inherit common fields like id, created_at, etc.
 */
export interface Account extends Omit<EntityWithName, 'glide_row_id'> {
  // Business identification
  accounts_uid?: string;  
  glide_row_id?: string;
  
  // Classification
  type: 'Customer' | 'Vendor' | 'Customer & Vendor';
  is_customer: boolean;
  is_vendor: boolean;
  
  // Contact information
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  
  // Profile
  photo?: string;
  notes?: string;
  
  // Status
  status: EntityStatus;
  
  // Financial information
  balance: number;
}

/**
 * GlAccount represents the raw database record from gl_accounts table
 */
export interface GlAccount {
  id: string;
  glide_row_id?: string;
  accounts_uid?: string;
  account_name?: string;
  client_type?: string;
  email_of_who_added?: string;
  date_added_client?: string;
  created_at?: string;
  updated_at?: string;
  photo?: string;
  balance?: number;
}

/**
 * AccountFormData represents the data structure used in the account creation/edit form
 */
export interface AccountFormData {
  name: string;
  type: 'Customer' | 'Vendor' | 'Customer & Vendor';
  status: EntityStatus;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
}

/**
 * AccountFilters represents the available filtering options for accounts
 */
export interface AccountFilters {
  type?: 'customer' | 'vendor' | 'both';
  search?: string;
  status?: EntityStatus;
  hasBalance?: boolean;
}

/**
 * AccountRelatedData represents data linked to an account
 */
export interface AccountRelatedData {
  invoices?: any[];
  purchaseOrders?: any[];
  products?: any[];
  payments?: any[];
  estimates?: any[];
  shipping?: any[];
}
