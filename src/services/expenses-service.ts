
import { supabase } from '@/integrations/supabase/client';
import { GlExpenseRecord, Expense, ExpenseForm, ExpenseFilters } from '@/types/expenses';

const convertToFrontend = (record: GlExpenseRecord): Expense => ({
  id: record.id,
  glideRowId: record.glide_row_id,
  submittedBy: record.submitted_by,
  notes: record.notes,
  amount: record.amount,
  category: record.category,
  date: new Date(record.date),
  receiptImage: record.expense_receipt_image,
  supplierName: record.expense_supplier_name,
  status: record.status,
  type: record.expense_type,
  createdAt: new Date(record.created_at),
  updatedAt: new Date(record.updated_at),
  lastModifiedBy: record.last_modified_by,
  formattedAmount: new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  }).format(record.amount),
  formattedDate: new Date(record.date).toLocaleDateString()
});

export const expensesService = {
  async getExpenses(filters: ExpenseFilters = {}): Promise<Expense[]> {
    let query = supabase
      .from('gl_expenses')
      .select('*');

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.dateFrom) {
      query = query.gte('date', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      query = query.lte('date', filters.dateTo.toISOString());
    }
    if (filters.minAmount) {
      query = query.gte('amount', filters.minAmount);
    }
    if (filters.maxAmount) {
      query = query.lte('amount', filters.maxAmount);
    }
    if (filters.searchTerm) {
      query = query.or(`notes.ilike.%${filters.searchTerm}%,expense_supplier_name.ilike.%${filters.searchTerm}%`);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return (data as GlExpenseRecord[]).map(convertToFrontend);
  },

  async getExpense(id: string): Promise<Expense | null> {
    const { data, error } = await supabase
      .from('gl_expenses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? convertToFrontend(data as GlExpenseRecord) : null;
  },

  async createExpense(expense: ExpenseForm): Promise<Expense> {
    const { data: userResponse } = await supabase.auth.getUser();
    if (!userResponse.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('gl_expenses')
      .insert({
        submitted_by: userResponse.user.id,
        notes: expense.notes,
        amount: expense.amount,
        category: expense.category,
        date: expense.date.toISOString(),
        expense_supplier_name: expense.supplierName,
        expense_receipt_image: expense.receiptImage,
        expense_type: expense.type,
        status: 'draft',
        last_modified_by: userResponse.user.id
      })
      .select()
      .single();

    if (error) throw error;
    return convertToFrontend(data as GlExpenseRecord);
  },

  async updateExpense(id: string, expense: Partial<ExpenseForm>): Promise<Expense> {
    const { data: userResponse } = await supabase.auth.getUser();
    if (!userResponse.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('gl_expenses')
      .update({
        notes: expense.notes,
        amount: expense.amount,
        category: expense.category,
        date: expense.date?.toISOString(),
        expense_supplier_name: expense.supplierName,
        expense_receipt_image: expense.receiptImage,
        expense_type: expense.type,
        last_modified_by: userResponse.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return convertToFrontend(data as GlExpenseRecord);
  },

  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
