
export interface BaseRow {
  id: string;
  glide_row_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface BaseDocumentRow extends BaseRow {
  supabase_pdf_url?: string;
  rowid_accounts?: string;
  notes?: string;
}

export interface BaseEntity {
  id: string;
  glideRowId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BaseDocument extends BaseEntity {
  pdfUrl?: string;
  accountId?: string;
  notes?: string;
}

export type EntityStatus = 
  | 'active' 
  | 'inactive'
  | 'draft'
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'archived';

export type PaymentStatus = 
  | 'paid' 
  | 'partial' 
  | 'unpaid' 
  | 'overdue'
  | 'rejected'
  | 'draft'
  | 'credit'
  | 'converted'
  | 'complete';

export type AccountType = 'Customer' | 'Vendor' | 'Customer & Vendor';

export interface ColumnDef<T = any> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  enableSorting?: boolean;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOption {
  field: string;
  value: string | number | boolean | string[];
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}
