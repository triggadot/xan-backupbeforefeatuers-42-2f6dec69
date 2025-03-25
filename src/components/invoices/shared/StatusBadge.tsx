
import React from 'react';
import { Badge } from '@/components/ui/badge';

type StatusType = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue';

interface StatusBadgeProps {
  status: StatusType | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'overdue':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Badge variant={getStatusVariant(status) as any} className="capitalize">
      {status}
    </Badge>
  );
};

export default StatusBadge;
