
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, XCircle, Clock, RefreshCw, ArrowUpDown } from 'lucide-react';

type StatusVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'success' | 'warning';

interface StatusBadge {
  variant: StatusVariant;
  icon: React.ReactNode;
  label: string;
}

export function getStatusBadge(status: string): StatusBadge {
  const lowercaseStatus = (status || '').toLowerCase();
  
  // For sync status
  if (lowercaseStatus === 'completed' || lowercaseStatus === 'success') {
    return {
      variant: 'success',
      icon: <Check className="h-3 w-3 mr-1" />,
      label: 'Completed'
    };
  }
  
  if (lowercaseStatus === 'failed' || lowercaseStatus === 'error') {
    return {
      variant: 'destructive',
      icon: <XCircle className="h-3 w-3 mr-1" />,
      label: 'Failed'
    };
  }
  
  if (lowercaseStatus === 'pending') {
    return {
      variant: 'outline',
      icon: <Clock className="h-3 w-3 mr-1" />,
      label: 'Pending'
    };
  }
  
  if (lowercaseStatus === 'processing' || lowercaseStatus === 'syncing') {
    return {
      variant: 'secondary',
      icon: <RefreshCw className="h-3 w-3 mr-1 animate-spin" />,
      label: 'Processing'
    };
  }
  
  // For payment status
  if (lowercaseStatus === 'paid') {
    return {
      variant: 'success',
      icon: <Check className="h-3 w-3 mr-1" />,
      label: 'Paid'
    };
  }
  
  if (lowercaseStatus === 'unpaid') {
    return {
      variant: 'warning',
      icon: <AlertTriangle className="h-3 w-3 mr-1" />,
      label: 'Unpaid'
    };
  }
  
  if (lowercaseStatus === 'draft') {
    return {
      variant: 'outline',
      icon: <Clock className="h-3 w-3 mr-1" />,
      label: 'Draft'
    };
  }
  
  if (lowercaseStatus === 'partial') {
    return {
      variant: 'secondary',
      icon: <ArrowUpDown className="h-3 w-3 mr-1" />,
      label: 'Partial'
    };
  }
  
  // Default case
  return {
    variant: 'default',
    icon: <Clock className="h-3 w-3 mr-1" />,
    label: status || 'Unknown'
  };
}

// Add the getStatusIcon export function
export function getStatusIcon(status: string | null): React.ReactNode {
  if (!status) return <Clock className="h-4 w-4 text-gray-400" />;
  
  const lowercaseStatus = status.toLowerCase();
  
  if (lowercaseStatus === 'completed' || lowercaseStatus === 'success') {
    return <Check className="h-4 w-4 text-green-500" />;
  }
  
  if (lowercaseStatus === 'failed' || lowercaseStatus === 'error') {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }
  
  if (lowercaseStatus === 'processing' || lowercaseStatus === 'syncing') {
    return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
  }
  
  if (lowercaseStatus === 'pending') {
    return <Clock className="h-4 w-4 text-yellow-500" />;
  }
  
  return <Clock className="h-4 w-4 text-gray-400" />;
}

export function StatusBadge({ status }: { status: string }): React.ReactElement {
  const statusBadge = getStatusBadge(status);
  
  return (
    <Badge variant={statusBadge.variant} className="flex items-center">
      {statusBadge.icon}
      {statusBadge.label}
    </Badge>
  );
}
