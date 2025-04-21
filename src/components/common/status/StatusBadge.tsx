
import { Badge } from '@/components/ui/badge';
import { EntityStatus, PaymentStatus } from '@/types/base';

interface StatusBadgeProps {
  status: EntityStatus | PaymentStatus;
  size?: 'sm' | 'default' | 'lg';
}

export function StatusBadge({ status, size = 'default' }: StatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case 'paid':
      case 'complete':
      case 'active':
        return 'success';
      case 'partial':
      case 'pending':
        return 'warning';
      case 'unpaid':
      case 'overdue':
      case 'rejected':
      case 'inactive':
        return 'destructive';
      case 'draft':
      case 'archived':
        return 'secondary';
      case 'converted':
      case 'credit':
        return 'default';
      default:
        return 'outline';
    }
  };

  const sizeClasses = {
    sm: 'text-xs py-0 px-2',
    default: 'text-sm py-1 px-2',
    lg: 'text-base py-1 px-3'
  };

  return (
    <Badge 
      variant={getVariant()}
      className={sizeClasses[size]}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
