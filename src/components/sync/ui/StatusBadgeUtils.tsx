
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, RefreshCw, AlertTriangle, ArrowUp, ArrowDown, ArrowRightLeft } from 'lucide-react';

// Status badge component
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

// Status icon component
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

// Status color mapping
export const statusColors = {
  completed: 'green',
  processing: 'blue',
  failed: 'red',
  started: 'yellow',
  unknown: 'gray'
};

// Get status color function
export function getStatusColor(status: string | null): string {
  if (!status) return statusColors.unknown;
  
  const normalizedStatus = status.toLowerCase();
  return statusColors[normalizedStatus as keyof typeof statusColors] || statusColors.unknown;
}

// Get sync direction icon
export function getSyncDirectionIcon(direction: string | null | undefined) {
  switch (direction) {
    case 'to_supabase':
      return <ArrowDown className="h-4 w-4 mr-1" />;
    case 'to_glide':
      return <ArrowUp className="h-4 w-4 mr-1" />;
    case 'both':
      return <ArrowRightLeft className="h-4 w-4 mr-1" />;
    default:
      return null;
  }
}

// Get sync direction label
export function getSyncDirectionLabel(direction: string | null | undefined) {
  switch (direction) {
    case 'to_supabase':
      return 'Glide → Supabase';
    case 'to_glide':
      return 'Supabase → Glide';
    case 'both':
      return 'Bidirectional';
    default:
      return 'Unknown';
  }
}
