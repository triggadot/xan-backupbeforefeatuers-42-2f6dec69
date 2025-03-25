
import { supabase } from '@/integrations/supabase/client';
import { Account } from '@/types/accountNew';
import { mapViewAccountToAccount } from '@/utils/accountMapper';
import { GlAccount } from '@/types/account';

/**
 * Fetch a single account by its ID
 */
export async function fetchAccountById(id: string): Promise<Account | null> {
  try {
    const { data, error } = await supabase
      .from('gl_accounts')
      .select(`
        id,
        account_name,
        client_type,
        email_of_who_added,
        date_added_client,
        photo,
        glide_row_id,
        accounts_uid,
        created_at,
        updated_at,
        balance
      `)
      .eq('id', id)
      .maybeSingle();
      
    if (error) throw error;
    if (!data) return null;
    
    // Convert the database record to our frontend Account model
    return mapViewAccountToAccount(data);
  } catch (error) {
    console.error('Error fetching account:', error);
    throw new Error('Failed to fetch account');
  }
}

/**
 * Fetch a list of accounts with optional filters
 */
export async function fetchAccounts(filters?: any): Promise<Account[]> {
  try {
    let query = supabase
      .from('gl_accounts')
      .select(`
        id,
        account_name,
        client_type,
        email_of_who_added,
        date_added_client,
        photo,
        glide_row_id,
        accounts_uid,
        created_at,
        updated_at,
        balance
      `);
    
    // Apply filters if provided
    if (filters?.type) {
      if (filters.type === 'customer') {
        query = query.ilike('client_type', '%customer%');
      } else if (filters.type === 'vendor') {
        query = query.ilike('client_type', '%vendor%');
      } else if (filters.type === 'both') {
        query = query.or('client_type.ilike.%customer%,client_type.ilike.%vendor%');
      }
    }
    
    if (filters?.search) {
      query = query.ilike('account_name', `%${filters.search}%`);
    }
    
    if (filters?.hasBalance === true) {
      query = query.gt('balance', 0);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Convert database records to our frontend Account models
    return (data || []).map((account: GlAccount) => mapViewAccountToAccount(account));
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw new Error('Failed to fetch accounts');
  }
}

/**
 * Fetch related data for an account (invoices, purchase orders, etc.)
 */
export async function fetchAccountRelatedData(id: string) {
  try {
    // Fetch invoices related to this account
    const { data: invoices, error: invoicesError } = await supabase
      .from('gl_invoices')
      .select('id, glide_row_id, created_at, total_amount, total_paid, balance, payment_status')
      .eq('rowid_accounts', id)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (invoicesError) throw invoicesError;
    
    // Fetch purchase orders related to this account
    const { data: purchaseOrders, error: purchaseOrdersError } = await supabase
      .from('gl_purchase_orders')
      .select('id, purchase_order_uid, po_date, total_amount, total_paid, balance, payment_status')
      .eq('rowid_accounts', id)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (purchaseOrdersError) throw purchaseOrdersError;
    
    // Fetch products related to this account (for vendors)
    const { data: products, error: productsError } = await supabase
      .from('gl_products')
      .select('id, display_name, vendor_product_name, cost, total_qty_purchased')
      .eq('rowid_accounts', id)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (productsError) throw productsError;
    
    return {
      invoices,
      purchaseOrders,
      products
    };
  } catch (error) {
    console.error('Error fetching account related data:', error);
    throw new Error('Failed to fetch account related data');
  }
}
