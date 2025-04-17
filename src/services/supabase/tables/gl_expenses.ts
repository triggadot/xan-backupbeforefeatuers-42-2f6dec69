import { supabase } from '@/integrations/supabase/client';

/**
 * Type definitions for gl_expenses table
 */

// Database schema type matching Supabase gl_expenses table
export interface GlExpenseRecord {
  id: string;
  glide_row_id: string;
  submitted_by?: string;
  notes?: string;
  amount?: number;
  category?: string;
  date_of_expense?: string;
  expense_text_to_json?: string;
  expense_list_of_items?: string;
  expense_receipt_image?: string;
  expense_address?: string;
  expense_supplier_name?: string;
  expense_total?: string;
  expense_tax?: string;
  expense_cash?: string;
  expense_change?: string;
  is_processing?: boolean;
  created_at: string;
  updated_at: string;
}

// Type for database insert/update operations
export interface GlExpenseInsert {
  glide_row_id: string;
  submitted_by?: string;
  notes?: string;
  amount?: number;
  category?: string;
  date_of_expense?: string;
  expense_text_to_json?: string;
  expense_list_of_items?: string;
  expense_receipt_image?: string;
  expense_address?: string;
  expense_supplier_name?: string;
  expense_total?: string;
  expense_tax?: string;
  expense_cash?: string;
  expense_change?: string;
  is_processing?: boolean;
}

// Frontend filter interface
export interface ExpenseFilters {
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Form data for creating/updating expenses
export interface ExpenseForm {
  submittedBy?: string;
  notes?: string;
  amount?: number;
  category?: string;
  dateOfExpense?: Date;
  expenseTextToJson?: string;
  expenseListOfItems?: string;
  expenseReceiptImage?: string;
  expenseAddress?: string;
  expenseSupplierName?: string;
  expenseTotal?: string;
  expenseTax?: string;
  expenseCash?: string;
  expenseChange?: string;
  isProcessing?: boolean;
}

// Expense model for frontend use
export interface Expense {
  id: string;
  glide_row_id: string;
  submitted_by?: string;
  notes?: string;
  amount?: number;
  category?: string;
  date_of_expense?: string;
  expense_text_to_json?: string;
  expense_list_of_items?: string;
  expense_receipt_image?: string;
  expense_address?: string;
  expense_supplier_name?: string;
  expense_total?: string;
  expense_tax?: string;
  expense_cash?: string;
  expense_change?: string;
  is_processing?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Expenses service for Supabase operations
 * Handles CRUD operations for gl_expenses table
 */
export const glExpensesService = {
  /**
   * Get all expenses with optional filtering
   */
  async getExpenses(filters: ExpenseFilters = {}): Promise<Expense[]> {
    let query = supabase
      .from('gl_expenses')
      .select('*');

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.dateFrom) {
      query = query.gte('date_of_expense', filters.dateFrom.toISOString());
    }
    if (filters.dateTo) {
      query = query.lte('date_of_expense', filters.dateTo.toISOString());
    }
    if (filters.search) {
      query = query.or(
        `submitted_by.ilike.%${filters.search}%,notes.ilike.%${filters.search}%,expense_supplier_name.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      throw new Error(`Failed to fetch expenses: ${error.message}`);
    }

    return (data as unknown as GlExpenseRecord[]).map(item => {
      const expense: Expense = {
        id: item.id,
        glide_row_id: item.glide_row_id,
        submitted_by: item.submitted_by,
        notes: item.notes,
        amount: item.amount,
        category: item.category,
        date_of_expense: item.date_of_expense,
        expense_text_to_json: item.expense_text_to_json,
        expense_list_of_items: item.expense_list_of_items,
        expense_receipt_image: item.expense_receipt_image,
        expense_address: item.expense_address,
        expense_supplier_name: item.expense_supplier_name,
        expense_total: item.expense_total,
        expense_tax: item.expense_tax,
        expense_cash: item.expense_cash,
        expense_change: item.expense_change,
        is_processing: item.is_processing,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };
      return expense;
    });
  },

  /**
   * Get a single expense by ID
   */
  async getExpenseById(id: string): Promise<Expense> {
    const { data, error } = await supabase
      .from('gl_expenses')
      .select('*')
      .eq('glide_row_id', id)
      .single();

    if (error) {
      console.error('Error fetching expense:', error);
      throw new Error(`Failed to fetch expense: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Expense with ID ${id} not found`);
    }

    const item = data as unknown as GlExpenseRecord;
    const expense: Expense = {
      id: item.id,
      glide_row_id: item.glide_row_id,
      submitted_by: item.submitted_by,
      notes: item.notes,
      amount: item.amount,
      category: item.category,
      date_of_expense: item.date_of_expense,
      expense_text_to_json: item.expense_text_to_json,
      expense_list_of_items: item.expense_list_of_items,
      expense_receipt_image: item.expense_receipt_image,
      expense_address: item.expense_address,
      expense_supplier_name: item.expense_supplier_name,
      expense_total: item.expense_total,
      expense_tax: item.expense_tax,
      expense_cash: item.expense_cash,
      expense_change: item.expense_change,
      is_processing: item.is_processing,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };

    return expense;
  },

  /**
   * Create a new expense
   */
  async createExpense(expenseData: ExpenseForm): Promise<Expense> {
    const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const dbExpense: GlExpenseInsert = {
      glide_row_id: uuid,
      submitted_by: expenseData.submittedBy,
      notes: expenseData.notes,
      amount: expenseData.amount,
      category: expenseData.category,
      date_of_expense: expenseData.dateOfExpense?.toISOString(),
      expense_text_to_json: expenseData.expenseTextToJson,
      expense_list_of_items: expenseData.expenseListOfItems,
      expense_receipt_image: expenseData.expenseReceiptImage,
      expense_address: expenseData.expenseAddress,
      expense_supplier_name: expenseData.expenseSupplierName,
      expense_total: expenseData.expenseTotal,
      expense_tax: expenseData.expenseTax,
      expense_cash: expenseData.expenseCash,
      expense_change: expenseData.expenseChange,
      is_processing: expenseData.isProcessing,
    };

    const { data, error } = await supabase
      .from('gl_expenses')
      .insert(dbExpense)
      .select()
      .single();

    if (error) {
      console.error('Error creating expense:', error);
      throw new Error(`Failed to create expense: ${error.message}`);
    }

    return this.getExpenseById(data.glide_row_id);
  },

  /**
   * Update an existing expense
   */
  async updateExpense(id: string, expenseData: Partial<ExpenseForm>): Promise<Expense> {
    const dbExpense: Partial<GlExpenseInsert> = {};

    if (expenseData.submittedBy !== undefined) dbExpense.submitted_by = expenseData.submittedBy;
    if (expenseData.notes !== undefined) dbExpense.notes = expenseData.notes;
    if (expenseData.amount !== undefined) dbExpense.amount = expenseData.amount;
    if (expenseData.category !== undefined) dbExpense.category = expenseData.category;
    if (expenseData.dateOfExpense !== undefined) dbExpense.date_of_expense = expenseData.dateOfExpense?.toISOString();
    if (expenseData.expenseTextToJson !== undefined) dbExpense.expense_text_to_json = expenseData.expenseTextToJson;
    if (expenseData.expenseListOfItems !== undefined) dbExpense.expense_list_of_items = expenseData.expenseListOfItems;
    if (expenseData.expenseReceiptImage !== undefined) dbExpense.expense_receipt_image = expenseData.expenseReceiptImage;
    if (expenseData.expenseAddress !== undefined) dbExpense.expense_address = expenseData.expenseAddress;
    if (expenseData.expenseSupplierName !== undefined) dbExpense.expense_supplier_name = expenseData.expenseSupplierName;
    if (expenseData.expenseTotal !== undefined) dbExpense.expense_total = expenseData.expenseTotal;
    if (expenseData.expenseTax !== undefined) dbExpense.expense_tax = expenseData.expenseTax;
    if (expenseData.expenseCash !== undefined) dbExpense.expense_cash = expenseData.expenseCash;
    if (expenseData.expenseChange !== undefined) dbExpense.expense_change = expenseData.expenseChange;
    if (expenseData.isProcessing !== undefined) dbExpense.is_processing = expenseData.isProcessing;

    const { error } = await supabase
      .from('gl_expenses')
      .update(dbExpense)
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error updating expense:', error);
      throw new Error(`Failed to update expense: ${error.message}`);
    }

    return this.getExpenseById(id);
  },

  /**
   * Delete an expense
   */
  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from('gl_expenses')
      .delete()
      .eq('glide_row_id', id);

    if (error) {
      console.error('Error deleting expense:', error);
      throw new Error(`Failed to delete expense: ${error.message}`);
    }
  },

  /**
   * Subscribe to expense changes
   */
  subscribeToExpenseChanges(callback: (payload: any) => void) {
    return supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gl_expenses' },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }
};
