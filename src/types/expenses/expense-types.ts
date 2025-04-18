
/**
 * Type definitions for expenses based on gl_expenses table
 */

// Database Types (with Gl prefix)
export interface GlExpenseRecord {
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

// Database insert operation type
export interface GlExpenseInsert extends Omit<GlExpenseRecord, 'id' | 'created_at' | 'updated_at'> {
  glide_row_id: string;
}

// Database update operation type (all fields optional)
export interface GlExpenseUpdate extends Partial<Omit<GlExpenseRecord, 'id' | 'created_at' | 'updated_at'>> {}

// Database export operation type
export interface GlExpenseExport extends GlExpenseRecord {}

// Frontend Types (without Gl prefix)
export interface Expense {
  id: string;
  glideRowId: string;
  submittedBy?: string;
  notes?: string;
  amount?: number;
  category?: string;
  date?: Date;
  receiptImage?: string;
  supplierName?: string;
  total?: string;
  tax?: string;
  cash?: string;
  change?: string;
  processing?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  // Computed properties
  formattedAmount?: string;
  formattedDate?: string;
}

export interface ExpenseKPIs {
  total: number;
  byCategory: Record<string, number>;
  byMonth: Record<string, number>;
}

// Form data for creating/editing expenses
export interface ExpenseForm {
  category: string;
  dateOfExpense: Date;
  amount: number;
  expenseSupplierName?: string;
  notes?: string;
}

// Filter options for expense queries
export interface ExpenseFilters {
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
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
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// Expense summary data type
export interface ExpenseSummaryData {
  totalAmount: number;
  categoryBreakdown: Record<string, number>;
  thisMonth: number;
  lastMonth: number;
  monthlyChange: number;
  monthlyChangePercent: number;
}
