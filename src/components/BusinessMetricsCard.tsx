import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface MetricData {
  title: string;
  value: string | number;
  changePercentage?: number;
  period?: string;
}

interface BusinessMetricsCardProps {
  metrics: MetricData[];
  className?: string;
}

export default function BusinessMetricsCard({ metrics, className }: BusinessMetricsCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold">Business Metrics</h3>
      </CardHeader>
      <CardContent className="grid gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="flex flex-col">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
              {metric.changePercentage !== undefined && (
                <Badge variant={getBadgeVariant(metric.changePercentage)} className="flex items-center gap-1">
                  {getChangeIcon(metric.changePercentage)}
                  {Math.abs(metric.changePercentage).toFixed(1)}%
                </Badge>
              )}
            </div>
            <div className="mt-1">
              <p className="text-2xl font-bold">{metric.value}</p>
              {metric.period && (
                <p className="text-xs text-muted-foreground mt-1">{metric.period}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function getBadgeVariant(changePercentage: number) {
  if (changePercentage > 0) return "success";
  if (changePercentage < 0) return "destructive";
  return "secondary";
}

function getChangeIcon(changePercentage: number) {
  if (changePercentage > 0) return <ArrowUpIcon className="h-3 w-3" />;
  if (changePercentage < 0) return <ArrowDownIcon className="h-3 w-3" />;
  return null;
} 