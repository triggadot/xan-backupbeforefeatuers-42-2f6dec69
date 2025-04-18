
import { User } from '@supabase/supabase-js';

// Database record type with Gl prefix (matches exact database structure)
export interface GlExpenseRecord {
  id: string;
  glide_row_id: string;
  submitted_by: string;
  notes?: string;
  amount: number;
  category?: string;
  date: string;
  expense_receipt_image?: string;
  expense_supplier_name?: string;
  status: string;
  expense_type?: string;
  created_at: string;
  updated_at: string;
  last_modified_by?: string;
}

// Frontend model type without prefix
export interface Expense {
  id: string;
  glideRowId: string;
  submittedBy: string;
  notes?: string;
  amount: number;
  category?: string;
  date: Date;
  receiptImage?: string;
  supplierName?: string;
  status: string;
  type?: string;
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy?: string;
  // Computed properties
  formattedAmount?: string;
  formattedDate?: string;
}

// Form data type for creating/editing expenses
export interface ExpenseForm {
  notes?: string;
  amount: number;
  category?: string;
  date: Date;
  supplierName?: string;
  receiptImage?: string;
  type?: string;
}

// Filter options type
export interface ExpenseFilters {
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

export const EXPENSE_CATEGORIES = [
  'Office',
  'Travel',
  'Equipment',
  'Software',
  'Marketing',
  'Utilities',
  'Supplies',
  'Other'
] as const;

export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
