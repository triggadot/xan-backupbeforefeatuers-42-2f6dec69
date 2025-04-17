import { supabase } from '@/integrations/supabase/client';
import { GlExpenseRecord, Expense } from '@/types/expenses';

export const glExpensesService = {
  /**
   * Get a list of expenses with optional filters
   */
  async getExpenses(params: { 
    userId?: string,
    startDate?: string,
    endDate?: string,
    limit?: number,
    offset?: number
  } = {}) {
    const { userId, startDate, endDate, limit = 100, offset = 0 } = params;
    
    // Use type casting to avoid the deep type instantiation issue
    // This is a temporary solution until we can refactor with a better typing approach
    const baseQuery = supabase
      .from('gl_expenses')
      .select('*')
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);
      
    // Build the query manually
    let query: any = baseQuery;
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (startDate) {
      query = query.gte('date', startDate);
    }
    
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Error fetching expenses: ${error.message}`);
    }
    
    return data.map((expense: GlExpenseRecord) => ({
      ...expense,
      formattedAmount: expense.amount ? 
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(expense.amount)) 
        : '$0.00',
      formattedDate: expense.date ? 
        new Date(expense.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) 
        : ''
    }));
  },
  
  /**
   * Get a single expense by ID
   */
  async getExpense(id: string): Promise<Expense | null> {
    if (!id) return null;
    
    const { data, error } = await supabase
      .from('gl_expenses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(`Error fetching expense detail: ${error.message}`);
    }
    
    if (!data) return null;
    
    // Process the data
    const expenseData = data as GlExpenseRecord;
    return {
      ...expenseData,
      formattedAmount: expenseData.amount ? 
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(expenseData.amount)) 
        : '$0.00',
      formattedDate: expenseData.date ? 
        new Date(expenseData.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) 
        : ''
    };
  },
  
  /**
   * Create a new expense
   */
  async createExpense(expense: Omit<GlExpenseRecord, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('gl_expenses')
      .insert(expense)
      .select()
      .single();
      
    if (error) {
      throw new Error(`Error creating expense: ${error.message}`);
    }
    
    return data;
  },
  
  /**
   * Update an existing expense
   */
  async updateExpense(id: string, expense: Partial<GlExpenseRecord>) {
    const { data, error } = await supabase
      .from('gl_expenses')
      .update(expense)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      throw new Error(`Error updating expense: ${error.message}`);
    }
    
    return data;
  },
  
  /**
   * Delete an expense by ID
   */
  async deleteExpense(id: string) {
    const { error } = await supabase
      .from('gl_expenses')
      .delete()
      .eq('id', id);
      
    if (error) {
      throw new Error(`Error deleting expense: ${error.message}`);
    }
    
    return true;
  },
  
  /**
   * Subscribe to changes in the expenses table
   */
  subscribeToExpensesChanges(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('gl_expenses_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'gl_expenses'
      }, callback)
      .subscribe();
      
    return subscription;
  }
};

export default glExpensesService; 