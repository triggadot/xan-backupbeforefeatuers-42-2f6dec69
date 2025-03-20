
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressIndicatorProps {
  current: number | null;
  total: number | null;
}

export function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  // Handle null or undefined values safely
  const currentValue = current || 0;
  const totalValue = total || 0;
  
  // Calculate percentage, avoiding division by zero
  const percentage = totalValue > 0 ? Math.min(100, (currentValue / totalValue) * 100) : 0;
  
  // Only show progress if we have valid numbers
  if (totalValue === 0) {
    return null;
  }
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Progress</span>
        <span>{currentValue} / {totalValue} records ({Math.round(percentage)}%)</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
