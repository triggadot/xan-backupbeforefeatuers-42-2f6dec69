
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

interface SyncStatusBadgeProps {
  status: string;
  className?: string;
}

export function SyncStatusBadge({ status, className }: SyncStatusBadgeProps) {
  switch (status.toLowerCase()) {
    case 'completed':
      return (
        <Badge className="bg-green-500 flex items-center gap-1">
          <Check className="h-3 w-3" />
          Completed
        </Badge>
      );
    case 'processing':
      return (
        <Badge className="bg-blue-500 flex items-center gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Processing
        </Badge>
      );
    case 'failed':
    case 'error':
      return (
        <Badge className="bg-red-500 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Failed
        </Badge>
      );
    case 'started':
      return (
        <Badge className="bg-yellow-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Started
        </Badge>
      );
    case 'idle':
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Idle
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      );
  }
}
