import React from 'react';
import { useProducts } from '@/hooks/products';
import { Card, Title, Text, Grid, Col, Metric, BarChart, DonutChart } from '@tremor/react';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency } from '@/utils/format';

export const ProductStats: React.FC = () => {
  const { data: products, isLoading, error } = useProducts();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>Error loading product statistics: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        <p>No products found</p>
      </div>
    );
  }

  // Calculate summary statistics
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => {
    return sum + (product.cost || 0) * (product.total_qty_purchased || 0);
  }, 0);
  const sampleCount = products.filter(p => p.samples).length;
  const frontedCount = products.filter(p => p.fronted).length;
  const miscCount = products.filter(p => p.miscellaneous_items).length;

  // Calculate category statistics
  const categoriesMap = new Map();
  products.forEach(product => {
    const category = product.category || 'Uncategorized';
    const value = (product.cost || 0) * (product.total_qty_purchased || 0);
    
    if (categoriesMap.has(category)) {
      const existing = categoriesMap.get(category);
      categoriesMap.set(category, {
        count: existing.count + 1,
        value: existing.value + value
      });
    } else {
      categoriesMap.set(category, { count: 1, value });
    }
  });

  const categoryStats = Array.from(categoriesMap.entries()).map(([category, stats]) => ({
    category,
    count: stats.count,
    value: stats.value
  }));

  // Calculate vendor statistics
  const vendorsMap = new Map();
  products.forEach(product => {
    if (product.account) {
      const vendorId = product.account.glide_row_id;
      const vendorName = product.account.account_name;
      const value = (product.cost || 0) * (product.total_qty_purchased || 0);
      
      if (vendorsMap.has(vendorId)) {
        const existing = vendorsMap.get(vendorId);
        vendorsMap.set(vendorId, {
          name: vendorName,
          count: existing.count + 1,
          value: existing.value + value
        });
      } else {
        vendorsMap.set(vendorId, { name: vendorName, count: 1, value });
      }
    }
  });

  const vendorStats = Array.from(vendorsMap.entries())
    .map(([vendorId, stats]) => ({
      vendor: stats.name || 'Unknown Vendor',
      count: stats.count,
      value: stats.value
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 vendors by value

  // Prepare chart data
  const categoryChartData = categoryStats
    .sort((a, b) => b.value - a.value)
    .map(stat => ({
      name: stat.category,
      'Total Value': stat.value,
    }));

  const statusChartData = [
    { name: 'Regular', value: totalProducts - sampleCount - frontedCount - miscCount },
    { name: 'Samples', value: sampleCount },
    { name: 'Fronted', value: frontedCount },
    { name: 'Miscellaneous', value: miscCount },
  ].filter(item => item.value > 0);

  return (
    <div>
      <Title className="mb-4">Product Statistics</Title>
      
      <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mb-6">
        <Card decoration="top" decorationColor="blue">
          <Text>Total Products</Text>
          <Metric className="mt-1">{totalProducts}</Metric>
        </Card>
        
        <Card decoration="top" decorationColor="green">
          <Text>Total Inventory Value</Text>
          <Metric className="mt-1">{formatCurrency(totalValue)}</Metric>
        </Card>
        
        <Card decoration="top" decorationColor="amber">
          <Text>Average Product Value</Text>
          <Metric className="mt-1">
            {formatCurrency(totalProducts > 0 ? totalValue / totalProducts : 0)}
          </Metric>
        </Card>
        
        <Card decoration="top" decorationColor="indigo">
          <Text>Categories</Text>
          <Metric className="mt-1">{categoriesMap.size}</Metric>
        </Card>
      </Grid>
      
      <Grid numItemsMd={2} className="gap-6 mb-6">
        <Card>
          <Title>Products by Category</Title>
          <BarChart
            className="mt-4 h-72"
            data={categoryChartData}
            index="name"
            categories={['Total Value']}
            colors={['blue']}
            valueFormatter={value => formatCurrency(value)}
            yAxisWidth={80}
          />
        </Card>
        
        <Card>
          <Title>Product Status Distribution</Title>
          <DonutChart
            className="mt-4 h-72"
            data={statusChartData}
            category="value"
            index="name"
            valueFormatter={value => `${value} products`}
            colors={['slate', 'violet', 'indigo', 'gray']}
          />
        </Card>
      </Grid>
      
      <Card>
        <Title>Top Vendors by Inventory Value</Title>
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% of Inventory</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendorStats.map((vendor, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vendor.vendor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vendor.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(vendor.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {totalValue > 0 ? `${((vendor.value / totalValue) * 100).toFixed(1)}%` : '0%'}
                  </td>
                </tr>
              ))}
              {vendorStats.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No vendor data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ProductStats;
