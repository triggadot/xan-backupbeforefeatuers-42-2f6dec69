import { supabase } from '@/integrations/supabase/client';

/**
 * Type definitions for gl_accounts table
 */

// Database schema type matching Supabase gl_accounts table
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

// Type for database insert/update operations
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

// Frontend filter interface
export interface AccountFilters {
  clientType?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Form data for creating/updating accounts
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

// Account model for frontend use
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

/**
 * Accounts service for Supabase operations
 * Handles CRUD operations for gl_accounts table
 */
export const glAccountsService = {
  /**
   * Get all accounts with optional filtering
   */
  async getAccounts(filters: AccountFilters = {}): Promise<Account[]> {
    let query = supabase
      .from('gl_accounts')
      .select('*');

    // Apply filters
    if (filters.clientType) {
      query = query.eq('client_type', filters.clientType);
    }
    if (filters.dateFrom) {
      query = query.gte('date_added_client', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      query = query.lte('date_added_client', filters.dateTo.toISOString());
    }
    if (filters.search) {
      query = query.or(
        `account_name.ilike.%${filters.search}%,accounts_uid.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching accounts:', error);
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }

    return (data as GlAccountRecord[]).map(item => {
      const account: Account = {
        id: item.id,
        glide_row_id: item.glide_row_id,
        account_name: item.account_name,
        client_type: item.client_type,
        accounts_uid: item.accounts_uid,
        date_added_client: item.date_added_client,
        email_of_who_added: item.email_of_who_added,
        photo: item.photo,
        balance: item.balance,
        customer_balance: item.customer_balance,
        vendor_balance: item.vendor_balance,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
      return account;
    });
  },

  /**
   * Get a single account by ID
   */
  async getAccountById(id: string): Promise<Account> {
    const { data, error } = await supabase
      .from('gl_accounts')
      .select('*')
      .eq('glide_row_id', id)
      .single();

    if (error) {
      console.error('Error fetching account:', error);
      throw new Error(`Failed to fetch account: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Account with ID ${id} not found`);
    }

    const item = data as GlAccountRecord;
    const account: Account = {
      id: item.id,
      glide_row_id: item.glide_row_id,
      account_name: item.account_name,
      client_type: item.client_type,
      accounts_uid: item.accounts_uid,
      date_added_client: item.date_added_client,
      email_of_who_added: item.email_of_who_added,
      photo: item.photo,
      balance: item.balance,
      customer_balance: item.customer_balance,
      vendor_balance: item.vendor_balance,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };

    return account;
  },

  /**
   * Create a new account
   */
  async createAccount(accountData: AccountForm): Promise<Account> {
    const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const dbAccount: GlAccountInsert = {
      glide_row_id: uuid,
      account_name: accountData.accountName,
      client_type: accountData.clientType,
      accounts_uid: accountData.accountsUid,
      date_added_client: accountData.dateAddedClient?.toISOString(),
      email_of_who_added: accountData.emailOfWhoAdded,
      photo: accountData.photo,
      balance: accountData.balance,
      customer_balance: accountData.customerBalance,
      vendor_balance: accountData.vendorBalance,
    };

    const { data, error } = await supabase
      .from('gl_accounts')
      .insert(dbAccount)
      .select()
      .single();

    if (error) {
      console.error('Error creating account:', error);
      throw new Error(`Failed to create account: ${error.message}`);
    }

    return this.getAccountById(data.glide_row_id);
  },

  /**
   * Update an existing account
   */
  async updateAccount(id: string, accountData: Partial<AccountForm>): Promise<Account> {
    const dbAccount: Partial<GlAccountInsert> = {};

    if (accountData.accountName !== undefined) dbAccount.account_name = accountData.accountName;
    if (accountData.clientType !== undefined) dbAccount.client_type = accountData.clientType;
    if (accountData.accountsUid !== undefined) dbAccount.accounts_uid = accountData.accountsUid;
    if (accountData.dateAddedClient !== undefined) dbAccount.date_added_client = accountData.dateAddedClient?.toISOString();
    if (accountData.emailOfWhoAdded !== undefined) dbAccount.email_of_who_added = accountData.emailOfWhoAdded;
    if (accountData.photo !== undefined) dbAccount.photo = accountData.photo;
    if (accountData.balance !== undefined) dbAccount.balance = accountData.balance;
    if (accountData.customerBalance !== undefined) dbAccount.customer_balance = accountData.customerBalance;
    if (accountData.vendorBalance !== undefined) dbAccount.vendor_balance = accountData.vendorBalance;

    const { error } = await supabase
      .from('gl_accounts')
      .update(dbAccount)
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error updating account:', error);
      throw new Error(`Failed to update account: ${error.message}`);
    }

    return this.getAccountById(id);
  },

  /**
   * Delete an account
   */
  async deleteAccount(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_accounts')
      .delete()
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error deleting account:', error);
      throw new Error(`Failed to delete account: ${error.message}`);
    }
  },

  /**
   * Subscribe to account changes
   */
  subscribeToAccountChanges(callback: (payload: any) => void) {
    return supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gl_accounts' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }
};

