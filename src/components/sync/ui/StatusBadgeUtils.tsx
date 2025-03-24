
import React from 'react';
import { CheckCircle, AlertTriangle, Loader2, Clock, ArrowUp, ArrowDown, ArrowRightLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function getStatusColor(status: string | null): string {
  switch (status) {
    case 'completed':
      return 'text-green-500';
    case 'failed':
      return 'text-red-500';
    case 'processing':
    case 'started':
      return 'text-blue-500';
    default:
      return 'text-gray-400';
  }
}

export function getStatusIcon(status: string | null) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'processing':
    case 'started':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
}

export function getStatusBadge(status: string | null) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-500">Completed</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    case 'processing':
    case 'started':
      return <Badge className="bg-blue-500">In Progress</Badge>;
    default:
      return <Badge variant="outline">Not Synced</Badge>;
  }
}

export function getSyncDirectionIcon(direction: string | null) {
  switch (direction) {
    case 'to_supabase':
      return <ArrowDown className="h-4 w-4" />;
    case 'to_glide':
      return <ArrowUp className="h-4 w-4" />;
    case 'both':
      return <ArrowRightLeft className="h-4 w-4" />;
    default:
      return null;
  }
}

export function getSyncDirectionLabel(direction: string | null): string {
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
