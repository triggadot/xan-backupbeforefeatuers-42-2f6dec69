import { supabase } from '../integrations/supabase/client';
import { GlAccountRecord, GlAccountInsert, AccountFilters, AccountForm, Account } from '../types/gl_accounts';

/**
 * AccountServices - handles CRUD and realtime for gl_accounts table
 */
export const AccountServices = {
  /**
   * Get all accounts with optional filtering
   */
  async getAccounts(filters: AccountFilters = {}): Promise<Account[]> {
    let query = supabase
      .from('gl_accounts')
      .select('*');

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
    const { data, error } = await query;
    if (error) throw error;
    return data as Account[];
  },

  /**
   * Get a single account by ID
   */
  async getAccountById(id: string): Promise<Account> {
    const { data, error } = await supabase
      .from('gl_accounts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Account;
  },

  /**
   * Create a new account
   */
  async createAccount(accountData: AccountForm): Promise<Account> {
    // Convert camelCase to snake_case for DB
    const dbData: GlAccountInsert = {
      glide_row_id: accountData.accountsUid || '',
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
      .insert([dbData])
      .select()
      .single();
    if (error) throw error;
    return data as Account;
  },

  /**
   * Update an existing account
   */
  async updateAccount(id: string, accountData: Partial<AccountForm>): Promise<Account> {
    // Convert camelCase to snake_case for DB
    const dbData: Partial<GlAccountInsert> = {
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
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Account;
  },

  /**
   * Delete an account
   */
  async deleteAccount(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_accounts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /**
   * Subscribe to account changes
   */
  subscribeToAccountChanges(callback: (payload: any) => void) {
    return supabase
      .channel('public:gl_accounts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gl_accounts' }, callback)
      .subscribe();
  },
};
