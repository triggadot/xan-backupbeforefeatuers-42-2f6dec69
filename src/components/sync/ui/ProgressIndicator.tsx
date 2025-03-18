import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressIndicatorProps {
  current: number | null | undefined;
  total: number | null | undefined;
  showText?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressIndicator({
  current,
  total,
  showText = true,
  showPercentage = true,
  size = 'md',
  className = ''
}: ProgressIndicatorProps) {
  // Calculate progress percentage, but handle null/undefined values
  const calculateProgress = (): number => {
    if (!current || !total || total === 0) return 0;
    return Math.min(Math.round((current / total) * 100), 100);
  };

  const progress = calculateProgress();
  
  // Determine height based on size
  const heightClass = size === 'sm' 
    ? 'h-1.5' 
    : size === 'lg' 
      ? 'h-3' 
      : 'h-2';
  
  return (
    <div className={`w-full space-y-1 ${className}`}>
      {showText && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>
            {current ?? 0} / {total ?? '?'} 
            {showPercentage && ` (${progress}%)`}
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-100 rounded-full ${heightClass}`}>
        <div 
          className={`bg-blue-500 rounded-full ${heightClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
} 