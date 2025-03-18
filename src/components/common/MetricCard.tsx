
import React from 'react';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: number;
  changeText?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  formatValue?: (value: string | number) => string;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  change,
  changeText,
  changeType = 'neutral',
  formatValue = (v) => String(v),
  className,
}) => {
  const formattedValue = formatValue(value);
  
  return (
    <div className={cn(
      'bg-card rounded-lg border p-6 shadow-subtle hover-lift transition-all duration-300 ease-smooth',
      className
    )}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      
      <div className="mt-2">
        <span className="text-2xl font-bold tracking-tight">{formattedValue}</span>
      </div>
      
      {(change !== undefined || changeText) && (
        <div className="mt-2 flex items-center text-xs">
          {change !== undefined && (
            <span
              className={cn(
                'mr-1 flex items-center gap-0.5',
                changeType === 'increase' && 'text-green-600',
                changeType === 'decrease' && 'text-red-600',
                changeType === 'neutral' && 'text-muted-foreground'
              )}
            >
              {changeType === 'increase' && <ArrowUpIcon className="h-3 w-3" />}
              {changeType === 'decrease' && <ArrowDownIcon className="h-3 w-3" />}
              {Math.abs(change)}%
            </span>
          )}
          <span className="text-muted-foreground">
            {changeText || (changeType === 'increase' ? 'from last period' : 'from last period')}
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
