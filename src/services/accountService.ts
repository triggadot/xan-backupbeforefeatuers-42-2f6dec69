import { supabase } from '@/integrations/supabase/client';
import { mapViewAccountToAccount } from '@/utils/accountMapper';

export async function fetchAccountById(id: string) {
  try {
    const { data, error } = await supabase
      .from('gl_accounts')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching account:', error);
    throw new Error('Failed to fetch account');
  }
}

export async function fetchAccounts(filters?: any) {
  try {
    let query = supabase
      .from('gl_accounts')
      .select('*');
    
    // Apply filters if any (to be implemented later)
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data.map((account: any) => mapViewAccountToAccount(account));
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw new Error('Failed to fetch accounts');
  }
}
