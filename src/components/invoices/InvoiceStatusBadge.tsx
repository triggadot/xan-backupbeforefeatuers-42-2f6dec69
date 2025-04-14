
import { Badge } from '@/components/ui/badge';

type PaymentStatus = 'paid' | 'partial' | 'unpaid' | 'draft' | 'credit';
type BadgeVariant = 'default' | 'success' | 'warning' | 'info' | 'destructive' | 'secondary' | 'outline';

interface InvoiceStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function InvoiceStatusBadge({ status, size = 'default', className = '' }: InvoiceStatusBadgeProps) {
  // Determine variant based on status
  const getVariant = (): BadgeVariant => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'credit':
        return 'default'; // Changed from info to default since info isn't in the Badge component
      case 'unpaid':
        return 'destructive';
      case 'draft':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Format status for display
  const getStatusText = () => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'partial':
        return 'Partially Paid';
      case 'credit':
        return 'Credit Applied';
      case 'unpaid':
        return 'Unpaid';
      case 'draft':
        return 'Draft';
      default:
        return 'Unknown';
    }
  };

  // Adjust size
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'text-xs py-0 px-2';
      case 'lg':
        return 'text-base py-1 px-3';
      default:
        return '';
    }
  };

  return (
    <Badge 
      variant={getVariant() as any} 
      className={`${getSizeClass()} ${className}`}
    >
      {getStatusText()}
    </Badge>
  );
} 
