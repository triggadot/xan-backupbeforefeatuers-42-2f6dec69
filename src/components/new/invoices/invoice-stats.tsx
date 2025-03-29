import { Card, Grid, Metric, Text, AreaChart, DonutChart } from '@tremor/react';
import { InvoiceStatus } from '@/types/Invoice';
import { formatCurrency } from '@/lib/utils';

// Sample data - replace with actual data from your API
const invoiceData = [
  {
    month: 'Jan',
    Paid: 4500,
    Pending: 1500,
    Overdue: 500,
  },
  {
    month: 'Feb',
    Paid: 5500,
    Pending: 1800,
    Overdue: 300,
  },
  {
    month: 'Mar',
    Paid: 6000,
    Pending: 2200,
    Overdue: 800,
  },
  {
    month: 'Apr',
    Paid: 7200,
    Pending: 1400,
    Overdue: 600,
  },
  {
    month: 'May',
    Paid: 8100,
    Pending: 1900,
    Overdue: 400,
  },
  {
    month: 'Jun',
    Paid: 9000,
    Pending: 2100,
    Overdue: 300,
  },
];

const statusData = [
  { name: 'Paid', value: 65, color: 'emerald' },
  { name: 'Pending', value: 25, color: 'amber' },
  { name: 'Overdue', value: 10, color: 'rose' },
];

const InvoiceStats = () => {
  // In a real app, you would fetch this data from your API
  const totalInvoiced = 42500;
  const totalPaid = 32000;
  const totalPending = 8500;
  const totalOverdue = 2000;

  return (
    <div className="space-y-6">
      <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
        <Card decoration="top" decorationColor="emerald">
          <Text>Total Invoiced</Text>
          <Metric>{formatCurrency(totalInvoiced)}</Metric>
        </Card>
        <Card decoration="top" decorationColor="emerald">
          <Text>Total Paid</Text>
          <Metric>{formatCurrency(totalPaid)}</Metric>
        </Card>
        <Card decoration="top" decorationColor="amber">
          <Text>Pending</Text>
          <Metric>{formatCurrency(totalPending)}</Metric>
        </Card>
        <Card decoration="top" decorationColor="rose">
          <Text>Overdue</Text>
          <Metric>{formatCurrency(totalOverdue)}</Metric>
        </Card>
      </Grid>

      <Grid numItemsMd={2} className="gap-6">
        <Card>
          <Text className="mb-4">Invoice Trends (Last 6 Months)</Text>
          <AreaChart
            className="h-72"
            data={invoiceData}
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
            data={statusData}
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
