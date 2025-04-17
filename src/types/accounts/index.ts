
/**
 * Account type definitions
 * Consolidated from previous account.ts and accountNew.ts files
 */
import { EntityBase, EntityStatus, EntityWithName } from '../common';

/**
 * Account type represents the primary interface for client/vendor entities
 * Extends EntityBase to inherit common fields like id, created_at, etc.
 */
/**
 * Account domain type definitions
 * 
 * This module contains all types related to accounts in the system.
 * Accounts represent customers and vendors with whom the business interacts.
 * 
 * @module types/accounts
 */

import { EntityBase, EntityStatus } from '../common';

/**
 * Account type that aligns with the gl_accounts table and materialized view structure
 * Core representation of an account in the system
 */
export interface Account extends EntityBase {
  /** Account name */
  name: string;
  /** Account unique identifier from external system */
  accounts_uid?: string;
  /** Account type: Customer, Vendor, or both */
  type: 'Customer' | 'Vendor' | 'Customer & Vendor';
  /** Current account status */
  status: 'active' | 'inactive';
  /** Current account balance */
  balance: number;
  /** Whether account is a customer */
  is_customer: boolean;
  /** Whether account is a vendor */
  is_vendor: boolean;
  /** Count of invoices associated with account */
  invoice_count?: number;
  /** Total amount invoiced to/from this account */
  total_invoiced?: number;
  /** Total amount paid to/from this account */
  total_paid?: number;
  /** Date of last invoice */
  last_invoice_date?: string;
  /** Date of last payment */
  last_payment_date?: string;
  /** URL to account photo/avatar */
  photo?: string;
  /** Account email address */
  email?: string;
  /** Account phone number */
  phone?: string;
  /** Account physical address */
  address?: string;
  /** Account website */
  website?: string;
  /** Notes about the account */
  notes?: string;
  /** Alternative field name used in some components */
  account_name?: string;
  /** Alternative field name used in some components */
  account_email?: string;
  /** Alternative field name used in some components */
  account_phone?: string;
  /** Alternative field name used in some components */
  account_address?: string;
  /** Email of user who added this account */
  email_of_who_added?: string;
  /** Date the client was added */
  date_added_client?: string;
  /** Client type as used in external system */
  client_type?: string;
}

/**
 * Interface for account balance information
 * Used for quick balance lookups
 */
export interface AccountBalance {
  /** Account ID */
  id: string;
  /** Current balance */
  balance: number;
  /** Whether this is a customer account */
  is_customer: boolean;
  /** Whether this is a vendor account */
  is_vendor: boolean;
}

/**
 * Form data for creating or updating an account
 */
export interface AccountFormData {
  /** Account name */
  name: string;
  /** Account type */
  type: 'Customer' | 'Vendor' | 'Customer & Vendor';
  /** Account email */
  email?: string;
  /** Account phone */
  phone?: string;
  /** Account address */
  address?: string;
  /** Account website */
  website?: string;
  /** Account notes */
  notes?: string;
  /** URL to account photo */
  photo?: string;
}

/**
 * For use with the Account Details page
 * Extends the base Account with additional detail fields
 */
export interface AccountDetails extends Account {
  /** Recent invoices associated with this account */
  recentInvoices?: {
    id: string;
    number: string;
    date: string;
    amount: number;
    status: string;
  }[];
  /** Recent purchase orders associated with this account */
  recentPurchaseOrders?: {
    id: string;
    number: string;
    date: string;
    amount: number;
    status: string;
  }[];
  /** Account statistics */
  stats?: {
    totalInvoiced: number;
    totalPaid: number;
    averageInvoiceAmount: number;
    invoiceCount: number;
    purchaseOrderCount: number;
  };
}

/**
 * Filter options for account queries
 */
export interface AccountFilters {
  /** Filter by account type */
  type?: 'customer' | 'vendor' | 'both';
  /** Text search term */
  search?: string;
  /** Only include accounts with non-zero balance */
  hasBalance?: boolean;
  /** Filter by status */
  status?: string;
}

/**
 * Account overview report data
 */
export interface AccountOverview {
  /** Account ID */
  id: string;
  /** Account name */
  name: string;
  /** Transactions for this account */
  transactions: AccountTransaction[];
  /** Balance summary by period */
  balances: {
    period: string;
    startBalance: number;
    endBalance: number;
    change: number;
  }[];
  /** Overall account statistics */
  stats: {
    totalPurchases: number;
    totalSales: number;
    netBalance: number;
    lastActivity: string;
  };
}

/**
 * Individual account transaction
 */
export interface AccountTransaction {
  /** Transaction ID */
  id: string;
  /** Transaction date */
  date: string;
  /** Transaction type */
  type: 'invoice' | 'payment' | 'purchase' | 'credit';
  /** Reference number */
  reference: string;
  /** Transaction amount */
  amount: number;
  /** Balance after this transaction */
  runningBalance: number;
  /** Transaction description */
  description?: string;
}

/**
 * Type for the materialized view of account details
 */
export interface AccountFromView {
  /** Account ID */
  account_id: string;
  /** Account name */
  account_name: string;
  /** Glide row ID */
  glide_row_id: string;
  /** Account UID from external system */
  accounts_uid?: string;
  /** Client type */
  client_type?: string;
  /** Created timestamp */
  created_at: string;
  /** Updated timestamp */
  updated_at: string;
  /** Count of invoices */
  invoice_count: number;
  /** Total invoiced amount */
  total_invoiced: number;
  /** Total paid amount */
  total_paid: number;
  /** Current balance */
  balance: number;
  /** Date of last invoice */
  last_invoice_date?: string;
  /** Date of last payment */
  last_payment_date?: string;
  /** Is this a customer account */
  is_customer: boolean;
  /** Is this a vendor account */
  is_vendor: boolean;
  /** URL to photo */
  photo?: string;
}
