import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

export function getStatusBadge(status: string | null) {
  if (!status) return <Badge variant="outline">Unknown</Badge>;
  
  switch (status.toLowerCase()) {
    case 'completed':
      return <Badge className="bg-green-500">Completed</Badge>;
    case 'processing':
      return <Badge className="bg-blue-500">Processing</Badge>;
    case 'failed':
      return <Badge className="bg-red-500">Failed</Badge>;
    case 'started':
      return <Badge className="bg-yellow-500">Started</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function getStatusIcon(status: string | null) {
  if (!status) return <Clock className="h-5 w-5 text-gray-400" />;
  
  switch (status.toLowerCase()) {
    case 'completed':
      return <Check className="h-5 w-5 text-green-500" />;
    case 'processing':
      return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
    case 'failed':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'started':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-400" />;
  }
}

export const statusColors = {
  completed: 'green',
  processing: 'blue',
  failed: 'red',
  started: 'yellow',
  unknown: 'gray'
};

export function getStatusColor(status: string | null): string {
  if (!status) return statusColors.unknown;
  
  const normalizedStatus = status.toLowerCase();
  return statusColors[normalizedStatus as keyof typeof statusColors] || statusColors.unknown;
} 