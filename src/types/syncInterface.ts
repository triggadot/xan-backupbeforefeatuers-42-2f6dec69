
import { 
  GlSyncStatus, 
  GlRecentLog, 
  GlSyncStats, 
  GlMapping, 
  GlSyncRecord, 
  MappingValidationResult
} from './glsync';

// Recent syncs card props
export interface RecentSyncsCardProps {
  recentLogs?: GlRecentLog[];
  isLoading?: boolean;
}

// Sync stats props
export interface SyncStatsProps {
  totalMappings: number;
  activeMappings: number;
  errorMappings: number;
  successMappings: number;
  isLoading: boolean;
}

// Sync metrics card props
export interface SyncMetricsCardProps {
  stats: GlSyncStats;
  isLoading?: boolean;
}

// Sync status display props
export interface SyncStatusDisplayProps {
  status: GlSyncStatus | null;
  isLoading?: boolean;
}

// Sync control panel props
export interface SyncControlPanelProps {
  isRunning: boolean;
  isValid: boolean;
}

// Mapping details card props
export interface MappingDetailsCardProps {
  mapping: GlMapping;
  onEdit: () => void;
  onDelete: () => void;
  onToggleEnabled: () => void;
}

// Edit table dialog props
export interface EditTableDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (updates: any) => Promise<boolean>;
}

// Mapping delete dialog props
export interface MappingDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  mappingName: string;
}

// Sync errors view props
export interface SyncErrorsViewProps {
  errors: GlSyncRecord[];
  isLoading: boolean;
  onRefresh: () => void;
}

// Active mapping card props
export interface ActiveMappingCardProps {
  statuses: GlSyncStatus[];
  isLoading: boolean;
}

// Validation display props
export interface ValidationDisplayProps {
  validation: MappingValidationResult | null;
  mapping?: GlMapping;
}

// Sync progress indicator props
export interface SyncProgressIndicatorProps {
  progress: number;
}
