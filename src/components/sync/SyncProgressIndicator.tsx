
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface SyncProgressIndicatorProps {
  progress: number;
}

export const SyncProgressIndicator: React.FC<SyncProgressIndicatorProps> = ({ progress }) => {
  return (
    <div className="w-full space-y-2">
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{progress}% Complete</span>
        <span>{progress === 100 ? 'Done' : 'In progress'}</span>
      </div>
    </div>
  );
};
