
import React from 'react';
import { Card, Grid, Metric, Text, AreaChart, DonutChart } from '@tremor/react';
import { formatCurrency } from '@/lib/utils';
import { EstimateWithDetails } from '@/types/estimate';

interface EstimateStatsProps {
  estimates: EstimateWithDetails[];
}

export const EstimateStats: React.FC<EstimateStatsProps> = ({ estimates }) => {
  // Calculate totals
  const totalEstimated = estimates.reduce((total, est) => total + (est.total_amount || 0), 0);
  const pendingTotal = estimates
    .filter(est => est.status === 'pending')
    .reduce((total, est) => total + (est.total_amount || 0), 0);
  const draftTotal = estimates
    .filter(est => est.status === 'draft' || !est.status)
    .reduce((total, est) => total + (est.total_amount || 0), 0);
  const convertedTotal = estimates
    .filter(est => est.status === 'converted')
    .reduce((total, est) => total + (est.total_amount || 0), 0);
  
  // Count by status
  const pendingCount = estimates.filter(est => est.status === 'pending').length;
  const draftCount = estimates.filter(est => est.status === 'draft' || !est.status).length;
  const convertedCount = estimates.filter(est => est.status === 'converted').length;
  
  // For donut chart
  const statusDistribution = [
    { name: 'Draft', value: draftCount, color: 'slate' },
    { name: 'Pending', value: pendingCount, color: 'amber' },
    { name: 'Converted', value: convertedCount, color: 'emerald' },
  ];

  // For area chart - group by month
  const monthlyData = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = month.toLocaleString('default', { month: 'short' });
    
    const monthlyEstimates = estimates.filter(est => {
      if (!est.created_at) return false;
      const estDate = new Date(est.created_at);
      return estDate.getMonth() === month.getMonth() && 
             estDate.getFullYear() === month.getFullYear();
    });
    
    const monthlyDraft = monthlyEstimates
      .filter(est => est.status === 'draft' || !est.status)
      .reduce((total, est) => total + (est.total_amount || 0), 0);
      
    const monthlyPending = monthlyEstimates
      .filter(est => est.status === 'pending')
      .reduce((total, est) => total + (est.total_amount || 0), 0);
      
    const monthlyConverted = monthlyEstimates
      .filter(est => est.status === 'converted')
      .reduce((total, est) => total + (est.total_amount || 0), 0);
    
    monthlyData.push({
      month: monthName,
      Draft: monthlyDraft,
      Pending: monthlyPending,
      Converted: monthlyConverted,
    });
  }

  return (
    <div className="space-y-6">
      <Grid numItemsMd={2} numItemsLg={4} className="gap-6">
        <Card decoration="top" decorationColor="indigo">
          <Text>Total Estimates</Text>
          <Metric>{formatCurrency(totalEstimated)}</Metric>
          <Text className="text-xs text-gray-500 mt-1">{estimates.length} estimates</Text>
        </Card>
        <Card decoration="top" decorationColor="emerald">
          <Text>Converted to Invoices</Text>
          <Metric>{formatCurrency(convertedTotal)}</Metric>
          <Text className="text-xs text-gray-500 mt-1">{convertedCount} estimates</Text>
        </Card>
        <Card decoration="top" decorationColor="amber">
          <Text>Pending</Text>
          <Metric>{formatCurrency(pendingTotal)}</Metric>
          <Text className="text-xs text-gray-500 mt-1">{pendingCount} estimates</Text>
        </Card>
        <Card decoration="top" decorationColor="slate">
          <Text>Draft</Text>
          <Metric>{formatCurrency(draftTotal)}</Metric>
          <Text className="text-xs text-gray-500 mt-1">{draftCount} estimates</Text>
        </Card>
      </Grid>

      <Grid numItemsMd={2} className="gap-6">
        <Card>
          <Text className="mb-4">Estimate Trends (Last 6 Months)</Text>
          <AreaChart
            className="h-72"
            data={monthlyData}
            index="month"
            categories={["Draft", "Pending", "Converted"]}
            colors={["slate", "amber", "emerald"]}
            valueFormatter={value => formatCurrency(value)}
            showLegend
            showAnimation
          />
        </Card>
        <Card>
          <Text className="mb-4">Estimate Status Distribution</Text>
          <DonutChart
            className="h-72"
            data={statusDistribution}
            category="value"
            index="name"
            valueFormatter={value => `${value} estimates`}
            colors={["slate", "amber", "emerald"]}
            showLabel
            showAnimation
          />
        </Card>
      </Grid>
    </div>
  );
};
