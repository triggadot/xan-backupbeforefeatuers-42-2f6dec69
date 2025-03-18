
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusMetrics } from '@/hooks/useBusinessMetrics';
import {
  BarChart,
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { FileText, ClipboardList, Truck } from 'lucide-react';

interface StatusMetricsCardProps {
  statusMetrics: StatusMetrics[];
  isLoading: boolean;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'invoices':
      return <FileText className="h-5 w-5" />;
    case 'estimates':
      return <ClipboardList className="h-5 w-5" />;
    case 'purchase_orders':
      return <Truck className="h-5 w-5" />;
    default:
      return null;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'invoices':
      return 'Invoices';
    case 'estimates':
      return 'Estimates';
    case 'purchase_orders':
      return 'Purchase Orders';
    default:
      return category;
  }
};

const StatusMetricsCard = ({ statusMetrics, isLoading }: StatusMetricsCardProps) => {
  // Prepare chart data
  const chartData = statusMetrics.map(metric => ({
    name: getCategoryLabel(metric.category),
    paid: metric.paid_count,
    unpaid: metric.unpaid_count,
    draft: metric.draft_count
  }));
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-[300px] w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="paid" stackId="a" fill="#4ade80" name="Paid/Converted" />
              <Bar dataKey="unpaid" stackId="a" fill="#f97316" name="Unpaid/Pending" />
              <Bar dataKey="draft" stackId="a" fill="#94a3b8" name="Draft" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statusMetrics.map((metric) => (
            <Card key={metric.category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  {getCategoryIcon(metric.category)}
                  <span className="ml-2">{getCategoryLabel(metric.category)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-medium">{metric.total_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-medium">
                      ${metric.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Outstanding</span>
                    <span className="font-medium">
                      ${metric.balance_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusMetricsCard;
