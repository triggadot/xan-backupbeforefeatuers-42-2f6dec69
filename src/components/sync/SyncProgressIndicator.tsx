
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface SyncProgressIndicatorProps {
  progress: number;
  isLoading: boolean;
  total?: number;
  processed?: number;
}

export function SyncProgressIndicator({ 
  progress, 
  isLoading, 
  total, 
  processed 
}: SyncProgressIndicatorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>
            {isLoading ? 'Syncing...' : 'Sync Progress'}
          </span>
        </div>
        {(total !== undefined && processed !== undefined) && (
          <span>{processed} / {total}</span>
        )}
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
