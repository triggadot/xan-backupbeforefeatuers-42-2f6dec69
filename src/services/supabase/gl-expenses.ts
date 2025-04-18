// src/services/supabase/gl-expenses.ts
import { supabase } from '@/integrations/supabase/client';
import {
  GlExpenseRecord,
  GlExpenseInsert,
  GlExpenseUpdate,
  Expense,
  ExpenseForm,
  ExpenseFilters,
  ExpenseKPIs,
} from '@/types/expenses/expense-types';

export const glExpensesService = {
  async getExpenses(filters: ExpenseFilters = {}): Promise<Expense[]> {
    let query = supabase.from('gl_expenses').select('*');
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.dateFrom) query = query.gte('date_of_expense', filters.dateFrom.toISOString());
    if (filters.dateTo) query = query.lte('date_of_expense', filters.dateTo.toISOString());
    if (filters.search) {
      query = query.or(
        `notes.ilike.%${filters.search}%,expense_supplier_name.ilike.%${filters.search}%`
      );
    }
    const { data, error } = await query.order('date_of_expense', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as GlExpenseRecord[]).map(convertDbToFrontend);
  },
  async getExpenseById(id: string): Promise<Expense> {
    const { data, error } = await supabase.from('gl_expenses').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return convertDbToFrontend(data as GlExpenseRecord);
  },
  async createExpense(form: ExpenseForm): Promise<Expense> {
    const dbExpense: GlExpenseInsert = convertFormToDb(form);
    const { data, error } = await supabase.from('gl_expenses').insert(dbExpense).select().single();
    if (error) throw new Error(error.message);
    return convertDbToFrontend(data as GlExpenseRecord);
  },
  async updateExpense(id: string, form: Partial<ExpenseForm>): Promise<Expense> {
    const dbExpense: Partial<GlExpenseUpdate> = convertFormToDb(form);
    const { data, error } = await supabase.from('gl_expenses').update(dbExpense).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return convertDbToFrontend(data as GlExpenseRecord);
  },
  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase.from('gl_expenses').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
  async getKPIs(filters: ExpenseFilters = {}): Promise<ExpenseKPIs> {
    // Example: total, by category, by month
    let where = '1=1';
    if (filters.dateFrom) where += ` AND date_of_expense >= '${filters.dateFrom.toISOString()}'`;
    if (filters.dateTo) where += ` AND date_of_expense <= '${filters.dateTo.toISOString()}'`;
    // Total
    const totalSql = `SELECT COALESCE(SUM(amount),0) as total FROM gl_expenses WHERE ${where}`;
    // By category
    const byCatSql = `SELECT category, COALESCE(SUM(amount),0) as total FROM gl_expenses WHERE ${where} GROUP BY category`;
    // By month
    const byMonthSql = `SELECT DATE_TRUNC('month', date_of_expense) as month, COALESCE(SUM(amount),0) as total FROM gl_expenses WHERE ${where} GROUP BY month ORDER BY month DESC`;
    const [totalRes, byCatRes, byMonthRes] = await Promise.all([
      supabase.rpc('run_sql', { sql: totalSql }),
      supabase.rpc('run_sql', { sql: byCatSql }),
      supabase.rpc('run_sql', { sql: byMonthSql })
    ]);
    return {
      total: parseFloat(totalRes.data?.[0]?.total || 0),
      byCategory: byCatRes.data || [],
      byMonth: byMonthRes.data || [],
    };
  },
  async exportExpensesToPdf(filters: ExpenseFilters): Promise<Blob> {
    const expenses = await this.getExpenses(filters);
    // Assume usePDF is a utility hook/service
    const { generateExpensePdf } = await import('@/hooks/usePDF');
    return generateExpensePdf(expenses);
  },
};

function convertDbToFrontend(record: GlExpenseRecord): Expense {
  return {
    id: record.id,
    glideRowId: record.glide_row_id,
    notes: record.notes,
    amount: record.amount,
    category: record.category,
    dateOfExpense: record.date_of_expense,
    expenseSupplierName: record.expense_supplier_name,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}
function convertFormToDb(form: Partial<ExpenseForm>): Partial<GlExpenseInsert> {
  return {
    notes: form.notes,
    amount: form.amount,
    category: form.category,
    date_of_expense: form.dateOfExpense,
    expense_supplier_name: form.expenseSupplierName,
  };
}
