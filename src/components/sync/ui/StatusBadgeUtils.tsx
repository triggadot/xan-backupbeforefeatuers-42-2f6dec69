
import { 
  CheckCircle2, 
  AlertCircle, 
  CircleSlash, 
  Clock, 
  ArrowRightLeft, 
  Loader2 
} from 'lucide-react';
import { ReactNode } from 'react';

export const getStatusIcon = (status: string): ReactNode => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'success':
    case 'active':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'failed':
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'disabled':
    case 'inactive':
      return <CircleSlash className="h-4 w-4 text-slate-400" />;
    case 'pending':
    case 'waiting':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'processing':
    case 'started':
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'completed_with_errors':
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case 'bidirectional':
      return <ArrowRightLeft className="h-4 w-4 text-purple-500" />;
    default:
      return <Clock className="h-4 w-4 text-slate-400" />;
  }
};

export const getStatusVariant = (status: string): 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'success':
    case 'active':
      return 'default';
    case 'failed':
    case 'error':
      return 'destructive';
    case 'disabled':
    case 'inactive':
      return 'outline';
    case 'pending':
    case 'waiting':
    case 'processing':
    case 'started':
      return 'secondary';
    default:
      return 'ghost';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'success':
    case 'active':
      return 'text-green-500';
    case 'failed':
    case 'error':
      return 'text-red-500';
    case 'disabled':
    case 'inactive':
      return 'text-slate-400';
    case 'pending':
    case 'waiting':
      return 'text-amber-500';
    case 'processing':
    case 'started':
      return 'text-blue-500';
    case 'completed_with_errors':
      return 'text-amber-500';
    default:
      return 'text-slate-500';
  }
};

// Add the missing getStatusBadge function
export const getStatusBadge = (status: string) => {
  const statusLower = status?.toLowerCase();
  let variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' = 'ghost';
  
  switch (statusLower) {
    case 'completed':
    case 'success':
    case 'active':
      variant = 'default';
      break;
    case 'failed':
    case 'error':
      variant = 'destructive';
      break;
    case 'disabled':
    case 'inactive':
      variant = 'outline';
      break;
    case 'pending':
    case 'waiting':
    case 'processing':
    case 'started':
      variant = 'secondary';
      break;
  }
  
  return {
    variant,
    icon: getStatusIcon(status)
  };
};
