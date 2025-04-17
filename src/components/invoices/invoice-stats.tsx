
import { Card, Grid, Metric, Text, AreaChart, DonutChart } from '@tremor/react';
import { formatCurrency } from '@/lib/utils';
import { InvoiceWithAccount } from '@/types/invoice';
import { useMemo } from 'react';

interface InvoiceStatsProps {
  invoices: InvoiceWithAccount[];
}

const InvoiceStats: React.FC<InvoiceStatsProps> = ({ invoices }) => {
  // Calculate metrics based on invoice balance
  const metrics = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
    
    const paidInvoices = invoices.filter(invoice => (invoice.balance || 0) <= 0 && (invoice.total_amount || 0) > 0);
    const totalPaid = paidInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
    
    const pendingInvoices = invoices.filter(invoice => (invoice.balance || 0) > 0);
    const totalPending = pendingInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
    
    const overdueInvoices = invoices.filter(invoice => 
      (invoice.balance || 0) > 0
    );
    const totalOverdue = overdueInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);

    // Calculate percentages for the donut chart
    const paidPercentage = Math.round((paidInvoices.length / (invoices.length || 1)) * 100);
    const pendingPercentage = Math.round((pendingInvoices.length / (invoices.length || 1)) * 100);
    const overduePercentage = Math.round((overdueInvoices.length / (invoices.length || 1)) * 100);

    return {
      totalInvoiced,
      totalPaid,
      totalPending,
      totalOverdue,
      statusData: [
        { name: 'Paid', value: paidPercentage, color: 'emerald' },
        { name: 'Pending', value: pendingPercentage, color: 'amber' },
        { name: 'Overdue', value: overduePercentage, color: 'rose' },
      ]
    };
  }, [invoices]);

  // Group invoices by month for the area chart
  const chartData = useMemo(() => {
    const monthlyData = new Map();
    const today = new Date();
    
    // Create entries for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      monthlyData.set(monthKey, { month: monthKey, Paid: 0, Pending: 0, Overdue: 0 });
    }
    
    // Populate with actual invoice data
    invoices.forEach(invoice => {
      if (!invoice.created_at) return;
      
      const invoiceDate = new Date(invoice.created_at);
      const monthKey = invoiceDate.toLocaleString('default', { month: 'short' });
      
      // Only include invoices from the last 6 months
      if (monthlyData.has(monthKey)) {
        const monthData = monthlyData.get(monthKey);
        
        if ((invoice.balance || 0) <= 0 && (invoice.total_amount || 0) > 0) {
          monthData.Paid += (invoice.total_amount || 0);
        } else if ((invoice.balance || 0) > 0) {
          // Check if invoice is overdue (already past payment date)
          monthData.Pending += (invoice.total_amount || 0);
        }
      }
    });
    
    return Array.from(monthlyData.values());
  }, [invoices]);

  return (
    <div className="space-y-6">
      <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
        <Card decoration="top" decorationColor="emerald">
          <Text>Total Invoiced</Text>
          <Metric>{formatCurrency(metrics.totalInvoiced)}</Metric>
        </Card>
        <Card decoration="top" decorationColor="emerald">
          <Text>Total Paid</Text>
          <Metric>{formatCurrency(metrics.totalPaid)}</Metric>
        </Card>
        <Card decoration="top" decorationColor="amber">
          <Text>Pending</Text>
          <Metric>{formatCurrency(metrics.totalPending)}</Metric>
        </Card>
        <Card decoration="top" decorationColor="rose">
          <Text>Overdue</Text>
          <Metric>{formatCurrency(metrics.totalOverdue)}</Metric>
        </Card>
      </Grid>

      <Grid numItemsMd={2} className="gap-6">
        <Card>
          <Text className="mb-4">Invoice Trends (Last 6 Months)</Text>
          <AreaChart
            className="h-72"
            data={chartData}
            index="month"
            categories={["Paid", "Pending", "Overdue"]}
            colors={["emerald", "amber", "rose"]}
            valueFormatter={value => formatCurrency(value)}
            showLegend
            showAnimation
          />
        </Card>
        <Card>
          <Text className="mb-4">Invoice Status Distribution</Text>
          <DonutChart
            className="h-72"
            data={metrics.statusData}
            category="value"
            index="name"
            colors={["emerald", "amber", "rose"]}
            valueFormatter={(value) => `${value}%`}
            showLabel
            showAnimation
          />
        </Card>
      </Grid>
    </div>
  );
};

export default InvoiceStats;
