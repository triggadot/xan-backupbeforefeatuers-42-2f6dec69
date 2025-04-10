/**
 * Type definitions for the expenses module
 */

/**
 * Represents an expense record from the database
 */
export interface GlExpense {
  id: string;
  glide_row_id: string;
  submitted_by?: string;
  notes?: string;
  amount?: number;
  category?: string;
  date?: string;
  expense_receipt_image?: string;
  expense_supplier_name?: string;
  expense_total?: string;
  expense_tax?: string;
  expense_cash?: string;
  expense_change?: string;
  processing?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Form data structure for creating or updating expenses
 */
export interface ExpenseFormData {
  notes: string;
  amount: number;
  category: string;
  date: string;
  supplier_name?: string;
  receipt_image?: string;
}

/**
 * Filter options for expense queries
 */
export interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

/**
 * Expense with calculated or derived fields
 */
export interface Expense extends GlExpense {
  formattedAmount?: string;
  formattedDate?: string;
}

/**
 * Expense category options
 */
export const EXPENSE_CATEGORIES = [
  'Travel',
  'Meals',
  'Office Supplies',
  'Equipment',
  'Software',
  'Marketing',
  'Utilities',
  'Rent',
  'Other'
];
