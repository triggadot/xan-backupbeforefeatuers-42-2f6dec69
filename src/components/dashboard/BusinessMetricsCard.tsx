
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  ShoppingBag, 
  FileText, 
  ClipboardList, 
  Users, 
  Truck,
  DollarSign,
  BarChart2
} from 'lucide-react';
import { BusinessMetrics } from '@/hooks/useBusinessMetrics';

interface BusinessMetricsCardProps {
  metrics: BusinessMetrics | null;
  isLoading: boolean;
}

const MetricItem = ({ 
  icon, 
  label, 
  value, 
  isCurrency = false,
  isCount = true
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number | null; 
  isCurrency?: boolean;
  isCount?: boolean;
}) => (
  <div className="flex items-center space-x-4 p-4 border rounded-lg">
    <div className="p-2 rounded-full bg-primary/10 text-primary">
      {icon}
    </div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <h4 className="text-2xl font-bold">
        {value === null ? "—" : 
          isCurrency ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :
          isCount ? value.toLocaleString() : value
        }
      </h4>
    </div>
  </div>
);

const BusinessMetricsCard = ({ metrics, isLoading }: BusinessMetricsCardProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart2 className="mr-2 h-5 w-5" />
          Business Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricItem 
            icon={<FileText className="h-5 w-5" />}
            label="Total Invoices"
            value={metrics?.total_invoices || 0}
          />
          <MetricItem 
            icon={<ClipboardList className="h-5 w-5" />}
            label="Total Estimates"
            value={metrics?.total_estimates || 0}
          />
          <MetricItem 
            icon={<ShoppingBag className="h-5 w-5" />}
            label="Total Products"
            value={metrics?.total_products || 0}
          />
          <MetricItem 
            icon={<Truck className="h-5 w-5" />}
            label="Purchase Orders"
            value={metrics?.total_purchase_orders || 0}
          />
          <MetricItem 
            icon={<Users className="h-5 w-5" />}
            label="Customers"
            value={metrics?.total_customers || 0}
          />
          <MetricItem 
            icon={<Users className="h-5 w-5" />}
            label="Vendors"
            value={metrics?.total_vendors || 0}
          />
          <MetricItem 
            icon={<DollarSign className="h-5 w-5" />}
            label="Invoice Revenue"
            value={metrics?.total_invoice_amount || 0}
            isCurrency
          />
          <MetricItem 
            icon={<TrendingUp className="h-5 w-5" />}
            label="Outstanding Balance"
            value={metrics?.total_outstanding_balance || 0}
            isCurrency
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessMetricsCard;
