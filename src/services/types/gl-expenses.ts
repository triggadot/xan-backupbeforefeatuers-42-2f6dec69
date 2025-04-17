
import { supabase } from '@/integrations/supabase/client';
import { 
  GlExpenseRecord, 
  GlExpenseInsert, 
  GlExpenseUpdate, 
  Expense, 
  ExpenseFilters 
} from '@/types/expenses/expense-types';

const convertToFrontend = (record: GlExpenseRecord): Expense => ({
  id: record.id,
  glideRowId: record.glide_row_id,
  submittedBy: record.submitted_by,
  notes: record.notes,
  amount: record.amount,
  category: record.category,
  date: record.date ? new Date(record.date) : undefined,
  receiptImage: record.expense_receipt_image,
  supplierName: record.expense_supplier_name,
  total: record.expense_total,
  tax: record.expense_tax,
  cash: record.expense_cash,
  change: record.expense_change,
  processing: record.processing,
  createdAt: record.created_at ? new Date(record.created_at) : undefined,
  updatedAt: record.updated_at ? new Date(record.updated_at) : undefined,
  formattedAmount: record.amount ? 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(record.amount) 
    : undefined,
  formattedDate: record.date ? 
    new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) 
    : undefined
});

export const glExpensesService = {
  async getExpenses(filters: ExpenseFilters = {}): Promise<Expense[]> {
    let query = supabase
      .from('gl_expenses')
      .select('*');

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters.minAmount) {
      query = query.gte('amount', filters.minAmount);
    }
    if (filters.maxAmount) {
      query = query.lte('amount', filters.maxAmount);
    }
    if (filters.searchTerm) {
      query = query.or(
        `notes.ilike.%${filters.searchTerm}%,expense_supplier_name.ilike.%${filters.searchTerm}%`
      );
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) {
      throw new Error(`Error fetching expenses: ${error.message}`);
    }

    return (data as GlExpenseRecord[]).map(convertToFrontend);
  },

  async getExpense(id: string): Promise<Expense | null> {
    const { data, error } = await supabase
      .from('gl_expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching expense: ${error.message}`);
    }

    return data ? convertToFrontend(data as GlExpenseRecord) : null;
  },

  async createExpense(expense: GlExpenseInsert): Promise<Expense> {
    const { data, error } = await supabase
      .from('gl_expenses')
      .insert([expense])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating expense: ${error.message}`);
    }

    return convertToFrontend(data as GlExpenseRecord);
  },

  async updateExpense(id: string, expense: GlExpenseUpdate): Promise<Expense> {
    const { data, error } = await supabase
      .from('gl_expenses')
      .update(expense)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating expense: ${error.message}`);
    }

    return convertToFrontend(data as GlExpenseRecord);
  },

  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting expense: ${error.message}`);
    }
  }
};

export default glExpensesService;
