import React from 'react';
import { Progress } from '@/components/ui/progress';

interface SyncProgressIndicatorProps {
  progress: number;
}

<<<<<<< Updated upstream
export const SyncProgressIndicator: React.FC<SyncProgressIndicatorProps> = ({ progress }) => {
=======
export const SyncProgressIndicator: React.FC<SyncProgressIndicatorProps> = ({ 
  mapping,
  status: initialStatus 
}) => {
  // Use the provided status instead of fetching it again
  const status = initialStatus;
  
  const calculateProgress = () => {
    if (!status) return 0;
    
    if (status.records_processed === null || 
        status.total_records === null || 
        status.total_records === 0) {
      return 0;
    }
    
    return Math.min(100, Math.round((status.records_processed / status.total_records) * 100));
  };

>>>>>>> Stashed changes
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
