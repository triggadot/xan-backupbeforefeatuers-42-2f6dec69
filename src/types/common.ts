
/**
 * Common entity types used throughout the application
 */
import { LucideIcon } from 'lucide-react';

export type EntityStatus = 
  // Status types shared across entities
  | 'draft'
  | 'active'
  | 'inactive'
  | 'archived'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'complete'  // Added complete to match complete status
  // Invoice specific statuses
  | 'unpaid'
  | 'paid'
  | 'partial'
  | 'credit'
  | 'void'
  // Estimate specific statuses
  | 'sent'
  | 'converted';

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
