
import { BaseService } from './base-service';
import { Account, AccountRow } from '@/types/accounts';
import { supabase } from '@/integrations/supabase/client';

// Simple mapper functions
const mapRowToAccount = (row: AccountRow): Account => ({
  id: row.id,
  glideRowId: row.glide_row_id,
  name: row.account_name || '',
  type: (row.client_type as 'Customer' | 'Vendor' | 'Customer & Vendor') || 'Customer',
  status: 'active',
  photoUrl: row.photo,
  customerBalance: row.customer_balance || 0,
  vendorBalance: row.vendor_balance || 0,
  totalBalance: row.balance || 0,
  uid: row.accounts_uid,
  dateAdded: row.date_added_client,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapAccountToRow = (account: Account): Partial<AccountRow> => ({
  id: account.id,
  glide_row_id: account.glideRowId,
  account_name: account.name,
  client_type: account.type,
  photo: account.photoUrl,
  customer_balance: account.customerBalance,
  vendor_balance: account.vendorBalance,
  balance: account.totalBalance,
  accounts_uid: account.uid,
  date_added_client: account.dateAdded,
  created_at: account.createdAt,
  updated_at: account.updatedAt
});

export class AccountService extends BaseService<AccountRow, Account> {
  constructor() {
    super('gl_accounts', mapRowToAccount, mapAccountToRow);
  }

  async getWithBalances(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('gl_accounts')
      .select('*')
      .order('account_name', { ascending: true });
      
    if (error) throw error;
    
    return (data as AccountRow[]).map(mapRowToAccount);
  }
}

// Export a singleton instance
export const accountService = new AccountService();
