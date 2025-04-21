import { Card, CardContent } from "@/components/ui/card";
import { useBreakpoint } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import React from 'react';

interface BusinessMetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changePeriod?: string;
  icon?: React.ReactNode;
  className?: string;
  valueClassName?: string;
  formatter?: (value: string | number) => string;
  secondaryText?: string;
}

export default function BusinessMetricsCard({
  title,
  value,
  change,
  changePeriod = "vs last month",
  icon,
  className,
  valueClassName,
  formatter = (val) => String(val),
  secondaryText,
}: BusinessMetricsCardProps) {
  const isMobile = useBreakpoint('sm');
  const formattedValue = formatter(value);
  
  const isPositiveChange = change && change > 0;
  const isNegativeChange = change && change < 0;
  
  const changeTextColor = isPositiveChange 
    ? 'text-green-600 dark:text-green-500' 
    : isNegativeChange 
      ? 'text-red-600 dark:text-red-500' 
      : 'text-muted-foreground';
  
  const changeIcon = isPositiveChange 
    ? <ArrowUpIcon className="h-3 w-3" /> 
    : isNegativeChange 
      ? <ArrowDownIcon className="h-3 w-3" /> 
      : null;
  
  const changePercentage = change ? Math.abs(change).toFixed(2) + '%' : null;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        
        <div className={cn(
          "mt-2 font-semibold tracking-tight",
          isMobile ? "text-2xl" : "text-3xl",
          valueClassName
        )}>
          {formattedValue}
        </div>
        
        {change !== undefined && (
          <div className={cn(
            "mt-1 flex items-center text-xs",
            changeTextColor
          )}>
            {changeIcon}
            <span className="ml-1">
              {isPositiveChange && "+"}{changePercentage} {changePeriod}
            </span>
          </div>
        )}
        
        {secondaryText && (
          <div className="mt-1 text-xs text-muted-foreground">
            {secondaryText}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
