import React, { useMemo } from 'react';
import { UnpaidInventoryItem } from '@/hooks/products/useUnpaidInventory';
import { Grid, ProgressBar, Text, DonutChart } from '@tremor/react';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';

interface UnpaidInventoryStatsProps {
  items: UnpaidInventoryItem[];
}

/**
 * UnpaidInventoryStats component
 * 
 * Displays summary statistics for unpaid inventory items
 * Includes total outstanding amount, payment progress, and category breakdown
 */
export const UnpaidInventoryStats: React.FC<UnpaidInventoryStatsProps> = ({ items }) => {
  const stats = useMemo(() => {
    // Calculate total costs and payments
    const totalCost = items.reduce((sum, item) => sum + item.total_cost, 0);
    const totalPaid = items.reduce((sum, item) => sum + (item.payment_amount || 0), 0);
    const totalOutstanding = totalCost - totalPaid;
    
    // Calculate payment progress percentage
    const paymentProgress = totalCost > 0 ? (totalPaid / totalCost) * 100 : 0;
    
    // Count items by payment status
    const unpaidCount = items.filter(item => item.payment_status === 'unpaid').length;
    const partialCount = items.filter(item => item.payment_status === 'partial').length;
    
    // Group by category for chart
    const categoryData = items.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      const value = item.remaining_balance;
      
      if (acc[category]) {
        acc[category] += value;
      } else {
        acc[category] = value;
      }
      
      return acc;
    }, {} as Record<string, number>);
    
    // Format data for chart
    const chartData = Object.entries(categoryData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    return {
      totalCost,
      totalPaid,
      totalOutstanding,
      paymentProgress,
      unpaidCount,
      partialCount,
      chartData,
      itemCount: items.length
    };
  }, [items]);
  
  return (
    <div className="mt-4">
      <Grid numItemsMd={2} className="gap-4 mb-6">
        <div>
          <Text className="text-sm text-gray-500">Total Outstanding</Text>
          <Text className="text-2xl font-semibold">{formatCurrency(stats.totalOutstanding)}</Text>
          <Text className="text-sm text-gray-500 mt-2">
            {stats.itemCount} items ({stats.unpaidCount} unpaid, {stats.partialCount} partial)
          </Text>
        </div>
        
        <div>
          <Text className="text-sm text-gray-500">Payment Progress</Text>
          <Text className="text-2xl font-semibold">
            {formatCurrency(stats.totalPaid)} / {formatCurrency(stats.totalCost)}
          </Text>
          <ProgressBar 
            value={stats.paymentProgress} 
            color={stats.paymentProgress < 25 ? "rose" : stats.paymentProgress < 75 ? "amber" : "emerald"} 
            className="mt-2" 
          />
          <Text className="text-sm text-gray-500 mt-1">
            {stats.paymentProgress.toFixed(1)}% paid
          </Text>
        </div>
      </Grid>
      
      {stats.chartData.length > 0 && (
        <div className="mt-6">
          <Text className="text-sm text-gray-500 mb-2">Outstanding Amount by Category</Text>
          <DonutChart
            className="h-40"
            data={stats.chartData}
            category="value"
            index="name"
            valueFormatter={value => formatCurrency(value)}
            colors={["blue", "cyan", "indigo", "violet", "fuchsia", "sky", "emerald"]}
          />
        </div>
      )}
    </div>
  );
};
