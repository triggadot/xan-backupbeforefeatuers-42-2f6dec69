
/**
 * Type definitions for expenses based on Supabase gl_expenses table
 */

// Database record type with Gl prefix (matches exact database structure)
export interface GlExpenseRecord {
  id: string;
  glide_row_id: string;
  notes?: string;
  amount?: number;
  date?: string;
  category?: string;
  expense_receipt_image?: string;
  expense_supplier_name?: string;
  expense_total?: string;
  expense_tax?: string;
  expense_cash?: string;
  expense_change?: string;
  processing?: boolean;
  created_at?: string;
  updated_at?: string;
  submitted_by?: string;
}

// Database insert operation type
export interface GlExpenseInsert {
  glide_row_id: string;
  notes?: string;
  amount?: number;
  date?: string;
  category?: string;
  expense_receipt_image?: string;
  expense_supplier_name?: string;
  expense_total?: string;
  expense_tax?: string;
  expense_cash?: string;
  expense_change?: string;
  processing?: boolean;
  submitted_by?: string;
}

// Database update operation type (all fields optional)
export interface GlExpenseUpdate {
  glide_row_id?: string;
  notes?: string;
  amount?: number;
  date?: string;
  category?: string;
  expense_receipt_image?: string;
  expense_supplier_name?: string;
  expense_total?: string;
  expense_tax?: string;
  expense_cash?: string;
  expense_change?: string;
  processing?: boolean;
  submitted_by?: string;
}

// Frontend model with camelCase properties
export interface Expense extends GlExpenseRecord {
  formattedAmount?: string;
  formattedDate?: string;
}

// Form data for creating/editing expenses
export interface ExpenseFormData {
  id?: string;
  notes: string;
  amount: number;
  category: string;
  date: string;
  supplier_name?: string;
  receipt_image?: string;
}

// Filter options for expense queries
export interface ExpenseFilters {
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

// Expense category options
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

// Expense status enum
export enum ExpenseStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSED = 'processed'
}

// Summary data for expenses
export interface ExpenseSummaryData {
  totalAmount: number;
  categoryBreakdown: Record<string, number>;
  thisMonth: number;
  lastMonth: number;
  monthlyChange: number;
  monthlyChangePercent: number;
}
