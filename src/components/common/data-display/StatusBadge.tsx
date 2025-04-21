
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export type StatusType = 
  | 'paid' 
  | 'partial' 
  | 'unpaid' 
  | 'draft' 
  | 'pending' 
  | 'completed' 
  | 'cancelled' 
  | 'active' 
  | 'inactive'
  | 'credit'
  | 'overdue'
  | 'rejected'
  | 'archived'
  | 'converted';

interface StatusBadgeProps {
  status: StatusType | string | null | undefined;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function StatusBadge({ status, className, size = 'default' }: StatusBadgeProps) {
  if (!status) return null;
  
  const statusLower = status.toLowerCase() as StatusType;
  
  const getStatusStyles = (): string => {
    switch (statusLower) {
      case 'paid':
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'partial':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'unpaid':
      case 'cancelled':
      case 'inactive':
      case 'overdue':
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'draft':
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300';
      case 'credit':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'converted':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300';
    }
  };

  const sizeClasses = {
    sm: 'text-xs py-0 px-2',
    default: 'text-sm py-1 px-2',
    lg: 'text-base py-1 px-3'
  };

  return (
    <Badge 
      className={cn(getStatusStyles(), sizeClasses[size], className)}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </Badge>
  );
}
