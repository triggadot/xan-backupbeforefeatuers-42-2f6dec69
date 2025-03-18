
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface SyncStatusBadgeProps {
  status: string | null;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({ status }) => {
  if (!status) {
    return <Badge variant="outline">Unknown</Badge>;
  }
  
  switch (status.toLowerCase()) {
    case 'completed':
      return <Badge className="bg-green-500">Completed</Badge>;
    case 'processing':
      return <Badge className="bg-blue-500">Processing</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    case 'started':
      return <Badge className="bg-yellow-500">Started</Badge>;
    case 'completed_with_errors':
      return <Badge className="bg-amber-500">Completed with errors</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
