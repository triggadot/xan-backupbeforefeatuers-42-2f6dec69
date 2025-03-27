
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

export const getStatusBadge = (status: string | null | undefined) => {
  if (!status) {
    return (
      <Badge variant="outline" className="text-xs flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Unknown
      </Badge>
    );
  }

  switch (status.toLowerCase()) {
    case 'completed':
      return (
        <Badge variant="default" className="bg-green-500 text-xs flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>
      );
    case 'processing':
    case 'started':
      return (
        <Badge variant="default" className="bg-blue-500 text-xs flex items-center gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          {status === 'processing' ? 'Processing' : 'Started'}
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive" className="text-xs flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Failed
        </Badge>
      );
    case 'idle':
      return (
        <Badge variant="outline" className="text-xs flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Idle
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs flex items-center gap-1">
          {status}
        </Badge>
      );
  }
};
