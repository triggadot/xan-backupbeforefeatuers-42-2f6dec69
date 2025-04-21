import React, { useState, useMemo, useCallback } from 'react';
import { useProducts } from '@/hooks/products';
import { Card, Title, Text, Grid, Col, LineChart, BarChart, DonutChart, DateRangePicker } from '@tremor/react';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency, formatDate } from '@/utils/format';
import { DateRange } from 'react-day-picker';

/**
 * ProductAnalytics component
 * 
 * Provides advanced analytics and insights for products
 * Shows trends, comparisons, and key metrics
 * 
 * @returns React component
 */
export const ProductAnalytics: React.FC = () => {
  const { data: products, isLoading, error } = useProducts();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Filter products by date range if selected
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter(product => {
      if (!dateRange?.from || !product.product_purchase_date) return true;
      
      const purchaseDate = new Date(product.product_purchase_date);
      if (dateRange.to) {
        return purchaseDate >= dateRange.from && purchaseDate <= dateRange.to;
      }
      return purchaseDate >= dateRange.from;
    });
  }, [products, dateRange]);

  // Calculate monthly purchase trends
  const purchaseTrends = useMemo(() => {
    const monthlyData: Record<string, { count: number; value: number }> = {};
    
    filteredProducts.forEach(product => {
      if (product.product_purchase_date) {
        const date = new Date(product.product_purchase_date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const value = (product.cost || 0) * (product.total_qty_purchased || 0);
        
        if (monthlyData[monthYear]) {
          monthlyData[monthYear].count += 1;
          monthlyData[monthYear].value += value;
        } else {
          monthlyData[monthYear] = { count: 1, value };
        }
      }
    });
    
    // Convert to array and sort by date
    return Object.entries(monthlyData)
      .map(([date, data]) => ({
        date,
        "Product Count": data.count,
        "Total Value": data.value,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredProducts]);

  // Calculate product type distribution
  const productTypeDistribution = useMemo(() => {
    const counts = {
      regular: 0,
      samples: 0,
      fronted: 0,
      miscellaneous: 0,
    };
    
    filteredProducts.forEach(product => {
      if (product.samples) {
        counts.samples += 1;
      } else if (product.fronted) {
        counts.fronted += 1;
      } else if (product.miscellaneous_items) {
        counts.miscellaneous += 1;
      } else {
        counts.regular += 1;
      }
    });
    
    return [
      { name: 'Regular Products', value: counts.regular },
      { name: 'Sample Products', value: counts.samples },
      { name: 'Fronted Products', value: counts.fronted },
      { name: 'Miscellaneous Items', value: counts.miscellaneous },
    ].filter(item => item.value > 0);
  }, [filteredProducts]);

  // Calculate price range distribution
  const priceRangeDistribution = useMemo(() => {
    const ranges = {
      'Under $10': 0,
      '$10 - $50': 0,
      '$50 - $100': 0,
      '$100 - $500': 0,
      'Over $500': 0,
    };
    
    filteredProducts.forEach(product => {
      const cost = product.cost || 0;
      
      if (cost < 10) {
        ranges['Under $10'] += 1;
      } else if (cost < 50) {
        ranges['$10 - $50'] += 1;
      } else if (cost < 100) {
        ranges['$50 - $100'] += 1;
      } else if (cost < 500) {
        ranges['$100 - $500'] += 1;
      } else {
        ranges['Over $500'] += 1;
      }
    });
    
    return Object.entries(ranges)
      .map(([range, count]) => ({ name: range, count }))
      .filter(item => item.count > 0);
  }, [filteredProducts]);

  // Calculate category value comparison
  const categoryValueComparison = useMemo(() => {
    const categoryData: Record<string, { count: number; value: number }> = {};
    
    filteredProducts.forEach(product => {
      const category = product.category || 'Uncategorized';
      const value = (product.cost || 0) * (product.total_qty_purchased || 0);
      
      if (categoryData[category]) {
        categoryData[category].count += 1;
        categoryData[category].value += value;
      } else {
        categoryData[category] = { count: 1, value };
      }
    });
    
    return Object.entries(categoryData)
      .map(([category, data]) => ({
        category,
        "Total Value": data.value,
        "Average Value": data.value / data.count,
      }))
      .sort((a, b) => b["Total Value"] - a["Total Value"])
      .slice(0, 10); // Top 10 categories
  }, [filteredProducts]);

  // Format date for display
  const formatMonthYear = useCallback((dateStr: string) => {
    const [year, month] = dateStr.split('-');
    return `${new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' })} ${year}`;
  }, []);

  // Calculate purchase trend analysis
  const purchaseTrendAnalysis = useMemo(() => {
    if (purchaseTrends.length < 2) {
      return 'Insufficient data to analyze purchase trends.';
    }
    
    const lastMonth = purchaseTrends[purchaseTrends.length - 1];
    const previousMonth = purchaseTrends[purchaseTrends.length - 2];
    
    const countChange = lastMonth["Product Count"] - previousMonth["Product Count"];
    const valueChange = lastMonth["Total Value"] - previousMonth["Total Value"];
    
    const countPercent = (countChange / previousMonth["Product Count"] * 100).toFixed(1);
    const valuePercent = (valueChange / previousMonth["Total Value"] * 100).toFixed(1);
    
    return `Product purchases ${countChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(countChange)} (${Math.abs(parseFloat(countPercent))}%) and total value ${valueChange > 0 ? 'increased' : 'decreased'} by ${formatCurrency(Math.abs(valueChange))} (${Math.abs(parseFloat(valuePercent))}%) compared to the previous month.`;
  }, [purchaseTrends]);

  // Calculate inventory composition analysis
  const inventoryCompositionAnalysis = useMemo(() => {
    const total = filteredProducts.length;
    if (total === 0) return 'No products in inventory.';
    
    const regularCount = productTypeDistribution.find(item => item.name === 'Regular Products')?.value || 0;
    const sampleCount = productTypeDistribution.find(item => item.name === 'Sample Products')?.value || 0;
    const frontedCount = productTypeDistribution.find(item => item.name === 'Fronted Products')?.value || 0;
    
    const regularPercent = (regularCount / total * 100).toFixed(1);
    const samplePercent = (sampleCount / total * 100).toFixed(1);
    const frontedPercent = (frontedCount / total * 100).toFixed(1);
    
    return `Your inventory consists of ${regularPercent}% regular products, ${samplePercent}% sample products, and ${frontedPercent}% fronted products.`;
  }, [filteredProducts, productTypeDistribution]);

  // Calculate price distribution analysis
  const priceDistributionAnalysis = useMemo(() => {
    if (priceRangeDistribution.length === 0) return 'No price data available.';
    
    const sortedRanges = [...priceRangeDistribution].sort((a, b) => b.count - a.count);
    const mostCommonRange = sortedRanges[0];
    const highValueCount = priceRangeDistribution.find(item => item.name === 'Over $500')?.count || 0;
    const lowValueCount = priceRangeDistribution.find(item => item.name === 'Under $10')?.count || 0;
    
    return `The most common price range is ${mostCommonRange?.name} with ${mostCommonRange?.count} products. You have ${highValueCount} high-value products (over $500) and ${lowValueCount} low-value products (under $10).`;
  }, [priceRangeDistribution]);

  // Calculate category analysis
  const categoryAnalysis = useMemo(() => {
    if (categoryValueComparison.length === 0) return '';
    
    const topCategory = categoryValueComparison[0];
    const totalValue = filteredProducts.reduce((sum, product) => sum + (product.cost || 0) * (product.total_qty_purchased || 0), 0);
    const topCategoryPercent = (topCategory["Total Value"] / totalValue * 100).toFixed(1);
    
    return `Your top category "${topCategory.category}" represents ${topCategoryPercent}% of your total inventory value (${formatCurrency(topCategory["Total Value"])}).`;
  }, [categoryValueComparison, filteredProducts]);

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
        <p>Error loading product analytics: {error instanceof Error ? error.message : 'Unknown error'}</p>
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

  return (
    <div>
      <div className="mb-6">
        <Title>Product Analytics</Title>
        <Text>Advanced insights into your product inventory</Text>
      </div>

      <div className="mb-6">
        <DateRangePicker
          className="max-w-md"
          value={dateRange}
          onValueChange={setDateRange}
          placeholder="Filter by purchase date"
          selectPlaceholder="Select"
          color="blue"
        />
      </div>

      <Grid numItemsMd={2} className="gap-6 mb-6">
        <Card>
          <Title>Monthly Purchase Trends</Title>
          <Text>Product count and total value by month</Text>
          <LineChart
            className="mt-6 h-80"
            data={purchaseTrends}
            index="date"
            categories={["Product Count", "Total Value"]}
            colors={["blue", "emerald"]}
            valueFormatter={(value, category) => 
              category === "Total Value" 
                ? formatCurrency(value) 
                : value.toString()
            }
            yAxisWidth={60}
            customTooltip={(props) => (
              <div className="p-2 bg-white shadow-lg rounded-lg border">
                <div className="font-medium">{formatMonthYear(props.payload.date)}</div>
                <div className="text-sm text-gray-500">
                  <div>Products: {props.payload["Product Count"]}</div>
                  <div>Value: {formatCurrency(props.payload["Total Value"])}</div>
                </div>
              </div>
            )}
          />
        </Card>

        <Card>
          <Title>Product Type Distribution</Title>
          <Text>Breakdown of product types in inventory</Text>
          <DonutChart
            className="mt-6 h-80"
            data={productTypeDistribution}
            category="value"
            index="name"
            valueFormatter={(value) => `${value} products`}
            colors={["slate", "violet", "indigo", "gray"]}
          />
        </Card>
      </Grid>

      <Grid numItemsMd={2} className="gap-6 mb-6">
        <Card>
          <Title>Price Range Distribution</Title>
          <Text>Number of products in each price range</Text>
          <BarChart
            className="mt-6 h-80"
            data={priceRangeDistribution}
            index="name"
            categories={["count"]}
            colors={["blue"]}
            valueFormatter={(value) => `${value} products`}
            yAxisWidth={48}
          />
        </Card>

        <Card>
          <Title>Category Value Comparison</Title>
          <Text>Total and average value by category</Text>
          <BarChart
            className="mt-6 h-80"
            data={categoryValueComparison}
            index="category"
            categories={["Total Value", "Average Value"]}
            colors={["emerald", "amber"]}
            valueFormatter={(value) => formatCurrency(value)}
            yAxisWidth={80}
            layout="vertical"
          />
        </Card>
      </Grid>

      <Card>
        <Title>Key Insights</Title>
        <div className="mt-4 space-y-4">
          {purchaseTrends.length > 1 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <Text className="font-medium text-blue-700">Purchase Trend Analysis</Text>
              <Text className="text-blue-600">
                {purchaseTrendAnalysis}
              </Text>
            </div>
          )}

          <div className="p-4 bg-emerald-50 rounded-lg">
            <Text className="font-medium text-emerald-700">Inventory Composition</Text>
            <Text className="text-emerald-600">
              {inventoryCompositionAnalysis}
            </Text>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg">
            <Text className="font-medium text-amber-700">Price Distribution</Text>
            <Text className="text-amber-600">
              {priceDistributionAnalysis}
            </Text>
          </div>

          {categoryValueComparison.length > 0 && (
            <div className="p-4 bg-violet-50 rounded-lg">
              <Text className="font-medium text-violet-700">Category Analysis</Text>
              <Text className="text-violet-600">
                {categoryAnalysis}
              </Text>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProductAnalytics;
