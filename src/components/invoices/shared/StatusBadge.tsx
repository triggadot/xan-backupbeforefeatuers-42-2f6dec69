
import { Invoice } from '@/types';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'draft' | 'sent' | 'overdue' | 'paid' | 'partial';
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | "success" | "warning" => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'overdue':
        return 'destructive';
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Badge 
      variant={getStatusVariant(status)}
      className={`capitalize ${className || ''}`}
    >
      {status}
    </Badge>
  );
};
