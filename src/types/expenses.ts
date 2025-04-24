
/**
 * Type definitions for expenses
 */

export interface Expense {
  id: string;
  glideRowId: string; 
  submittedBy?: string;
  notes?: string;
  amount?: number;
  category?: string;
  date?: string;
  expenseReceiptImage?: string;
  expenseSupplierName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseFormData {
  notes: string;
  amount: number;
  category: string;
  date: string;
  supplierName?: string;
  receiptImage?: string;
}

export interface ExpenseFilters {
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

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
