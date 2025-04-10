import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBreakpoint } from '@/hooks/use-mobile';
import { AreaChart, Card as TremorCard } from '@tremor/react';
import { useTheme } from 'next-themes';

interface DataPoint {
  date: string;
  Income?: number;
  Expense?: number;
}

interface TransactionChartProps {
  title?: string;
  data: DataPoint[];
  className?: string;
  valueFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
  colors?: string[];
  showLegend?: boolean;
  height?: string;
}

export default function TransactionChart({
  title = "Transaction Volume",
  data,
  className,
  valueFormatter = (value) => `$${value.toLocaleString()}`,
  tooltipFormatter = (value) => `$${value.toLocaleString()}`,
  colors = ["emerald", "violet"],
  showLegend = true,
  height = "h-72",
}: TransactionChartProps) {
  const isMobile = useBreakpoint('md');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  // Define chart colors based on theme
  const chartColors = isDark 
    ? { Income: 'emerald', Expense: 'violet' }
    : { Income: 'emerald', Expense: 'violet' };

  return (
    <Card className={className}>
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <TremorCard className="bg-transparent border-0 shadow-none">
          <AreaChart
            className={height}
            data={data}
            index="date"
            categories={["Income", "Expense"]}
            colors={colors}
            valueFormatter={valueFormatter}
            showLegend={showLegend}
            showGridLines={!isMobile}
            showXAxis={true}
            showYAxis={!isMobile}
            curveType="monotone"
            allowDecimals={false}
            showAnimation={true}
            autoMinValue={true}
            minValue={0}
            yAxisWidth={isMobile ? 40 : 50}
            customTooltip={(props) => (
              <div className="bg-background border px-4 py-2 shadow-md rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">{props.payload?.[0]?.payload.date}</div>
                {props.payload?.map((category) => (
                  <div key={category.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}:</span>
                    <span>{tooltipFormatter(Number(category.value))}</span>
                  </div>
                ))}
              </div>
            )}
          />
        </TremorCard>
      </CardContent>
    </Card>
  );
} 