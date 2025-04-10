import { SplitButtonDropdown } from '@/components/custom/SplitButtonDropdown';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface FinancialMetric {
  label: string;
  value: number;
  color: string;
  textColor: string;
  bgColor: string;
  secondaryValue?: number;
  secondaryLabel?: string;
  tertiaryValue?: number;
  tertiaryLabel?: string;
}

interface FinancialSummaryCardProps {
  title?: string;
  metrics: FinancialMetric[];
  className?: string;
  timeOptions?: Array<{ label: string; value: string; }>;
  onTimeChange?: (value: string) => void;
  selectedTime?: string;
  isLoading?: boolean;
}

export default function FinancialSummaryCard({
  title = "Financial Reports Summary",
  metrics,
  className,
  timeOptions = [
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: 'This Year', value: 'ytd' },
    { label: 'Last Year', value: 'ly' },
  ],
  onTimeChange,
  selectedTime = '30d',
  isLoading = false,
}: FinancialSummaryCardProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {timeOptions && onTimeChange && (
            <SplitButtonDropdown
              options={timeOptions}
              initialSelectedValue={selectedTime}
              onSelectionChange={(value) => onTimeChange(value)}
              size="sm"
              compactOnMobile={true}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between items-center p-3 rounded-md bg-muted/50">
                  <Skeleton className="h-7 w-32" />
                  <Skeleton className="w-24 h-2 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div 
                    className={cn(
                      "h-3 w-3 rounded-full",
                      metric.color
                    )} 
                  />
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <div className={cn(
                  "flex flex-col p-3 rounded-md",
                  metric.bgColor
                )}>
                  <div className="flex justify-between items-center">
                    <div className={cn(
                      "text-xl font-semibold",
                      metric.textColor
                    )}>
                      {formatCurrency(metric.value)}
                    </div>
                    <div className="w-24 h-2 bg-background/50 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full", 
                          metric.color
                        )} 
                        style={{ 
                          width: `${Math.min(100, Math.max(0, (metric.value / (metrics[0]?.value || 1)) * 100))}%` 
                        }} 
                      />
                    </div>
                  </div>
                  
                  {/* Secondary and tertiary values */}
                  {(metric.secondaryValue !== undefined || metric.tertiaryValue !== undefined) && (
                    <div className="mt-2 flex flex-col text-xs">
                      {metric.secondaryValue !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">{metric.secondaryLabel || 'Details'}:</span>
                          <span className={metric.textColor}>{formatCurrency(metric.secondaryValue)}</span>
                        </div>
                      )}
                      {metric.tertiaryValue !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">{metric.tertiaryLabel || 'Additional'}:</span>
                          <span className={metric.textColor}>{formatCurrency(metric.tertiaryValue)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 