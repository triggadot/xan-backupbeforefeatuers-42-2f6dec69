
import React from 'react';
import { Badge, BadgeProps } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

export function getStatusBadge(status: string | null): React.ReactNode {
  if (!status) return <Badge variant="outline">Not synced</Badge>;
  
  switch (status.toLowerCase()) {
    case 'completed':
      return <Badge className="bg-green-500">Completed</Badge>;
    case 'processing':
      return <Badge className="bg-blue-500">Processing</Badge>;
    case 'started':
      return <Badge className="bg-blue-500">Started</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function getStatusIcon(status: string | null): React.ReactNode {
  if (!status) return <Clock className="h-5 w-5 text-gray-400" />;
  
  switch (status.toLowerCase()) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'processing':
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    case 'started':
      return <Clock className="h-5 w-5 text-blue-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  }
}
