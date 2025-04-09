/**
 * Common entity types used throughout the application
 */
import { LucideIcon } from 'lucide-react';

export type EntityStatus = 
  // Invoice statuses
  | 'draft'
  | 'unpaid'
  | 'paid'
  | 'partial'
  // Purchase order statuses
  | 'pending'
  | 'complete'
  | 'received'
  // Estimate statuses
  | 'converted'
  // Generic statuses
  | 'active'
  | 'inactive'
  | 'archived';

export interface EntityBase {
  id: string;
  glide_row_id: string;
  created_at: string;
  updated_at?: string;
}

export interface EntityWithName extends EntityBase {
  name: string;
}

export interface EntityWithAccount extends EntityBase {
  rowid_accounts?: string;
  accountName?: string;
}

export interface EntityWithStatus extends EntityBase {
  status: EntityStatus | string;
}

export interface EntityWithAmount extends EntityBase {
  total_amount: number;
  balance?: number;
}

export interface GenericEntityListProps<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  onView: (id: string) => void;
  onCreate?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export interface DetailSection {
  title: string;
  content: React.ReactNode;
  icon?: LucideIcon;
  footerActions?: React.ReactNode;
}

export interface ColumnDef {
  id: string;
  header: string;
  accessorKey?: string;
  cell?: (data: any) => React.ReactNode;
  sortable?: boolean;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}
