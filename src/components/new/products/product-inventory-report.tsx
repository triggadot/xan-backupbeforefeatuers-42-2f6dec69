import React, { useState } from 'react';
import { useProducts } from '@/hooks/products';
import { Card, Title, Text, Grid, Col, BarList, DonutChart, DateRangePicker } from '@tremor/react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/utils/format';
import { DateRange } from 'react-day-picker';

/**
 * ProductInventoryReport component
 * 
 * Displays inventory reports and analytics for products
 * Allows filtering by date range and category
 * 
 * @returns React component
 */
export const ProductInventoryReport: React.FC = () => {
  const { data: products, isLoading, error } = useProducts();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
        <p>Error loading product inventory: {error instanceof Error ? error.message : 'Unknown error'}</p>
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

  // Filter products by date range if selected
  const filteredProducts = products.filter(product => {
    // Filter by date range if selected
    if (dateRange?.from && product.product_purchase_date) {
      const purchaseDate = new Date(product.product_purchase_date);
      if (dateRange.to) {
        return purchaseDate >= dateRange.from && purchaseDate <= dateRange.to;
      }
      return purchaseDate >= dateRange.from;
    }
    
    // Filter by category if selected
    if (selectedCategory && selectedCategory !== 'All') {
      return product.category === selectedCategory;
    }
    
    return true;
  });

  // Calculate inventory statistics
  const totalProducts = filteredProducts.length;
  const totalValue = filteredProducts.reduce((sum, product) => {
    return sum + (product.cost || 0) * (product.total_qty_purchased || 0);
  }, 0);
  const totalQuantity = filteredProducts.reduce((sum, product) => {
    return sum + (product.total_qty_purchased || 0);
  }, 0);
  const averageCost = totalProducts > 0 ? totalValue / totalQuantity : 0;

  // Get unique categories
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Calculate category distribution
  const categoryData = filteredProducts.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    const value = (product.cost || 0) * (product.total_qty_purchased || 0);
    
    if (acc[category]) {
      acc[category] += value;
    } else {
      acc[category] = value;
    }
    
    return acc;
  }, {} as Record<string, number>);

  // Prepare data for charts
  const categoryChartData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Top products by value
  const topProducts = [...filteredProducts]
    .sort((a, b) => {
      const aValue = (a.cost || 0) * (a.total_qty_purchased || 0);
      const bValue = (b.cost || 0) * (b.total_qty_purchased || 0);
      return bValue - aValue;
    })
    .slice(0, 5)
    .map(product => ({
      name: product.display_name || 'Unnamed Product',
      value: (product.cost || 0) * (product.total_qty_purchased || 0),
    }));

  return (
    <div>
      <div className="mb-6">
        <Title>Inventory Report</Title>
        <Text>Analyze your product inventory</Text>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <DateRangePicker
          className="max-w-md"
          value={dateRange}
          onValueChange={setDateRange}
          placeholder="Select date range"
          selectPlaceholder="Select"
          color="blue"
        />
        
        <div className="flex gap-2 flex-wrap">
          {categories.map((category, index) => (
            <Button
              key={index}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category === 'All' ? null : category)}
              size="sm"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mb-6">
        <Card decoration="top" decorationColor="blue">
          <Text>Total Products</Text>
          <Text className="mt-1 text-2xl font-semibold">{totalProducts}</Text>
        </Card>
        
        <Card decoration="top" decorationColor="green">
          <Text>Total Inventory Value</Text>
          <Text className="mt-1 text-2xl font-semibold">{formatCurrency(totalValue)}</Text>
        </Card>
        
        <Card decoration="top" decorationColor="amber">
          <Text>Total Quantity</Text>
          <Text className="mt-1 text-2xl font-semibold">{totalQuantity.toLocaleString()}</Text>
        </Card>
        
        <Card decoration="top" decorationColor="indigo">
          <Text>Average Cost per Unit</Text>
          <Text className="mt-1 text-2xl font-semibold">{formatCurrency(averageCost)}</Text>
        </Card>
      </Grid>
      
      <Grid numItemsMd={2} className="gap-6 mb-6">
        <Card>
          <Title>Inventory Value by Category</Title>
          <DonutChart
            className="mt-4 h-60"
            data={categoryChartData}
            category="value"
            index="name"
            valueFormatter={value => formatCurrency(value)}
            colors={["blue", "cyan", "indigo", "violet", "fuchsia", "sky", "emerald"]}
          />
        </Card>
        
        <Card>
          <Title>Top Products by Value</Title>
          <BarList
            className="mt-4"
            data={topProducts}
            valueFormatter={value => formatCurrency(value)}
          />
        </Card>
      </Grid>
      
      <Card>
        <Title>Inventory Details</Title>
        <Text className="mb-4">
          {filteredProducts.length} products found
          {dateRange?.from && ` from ${formatDate(dateRange.from)} to ${dateRange.to ? formatDate(dateRange.to) : 'now'}`}
          {selectedCategory && selectedCategory !== 'All' && ` in ${selectedCategory}`}
        </Text>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.slice(0, 20).map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.display_name || 'Unnamed Product'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.vendor_product_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category || 'Uncategorized'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.total_qty_purchased?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(product.cost || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency((product.cost || 0) * (product.total_qty_purchased || 0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.product_purchase_date ? formatDate(product.product_purchase_date) : 'N/A'}
                  </td>
                </tr>
              ))}
              {filteredProducts.length > 20 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Showing 20 of {filteredProducts.length} products. Export or refine filters to see more.
                  </td>
                </tr>
              )}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No products match the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button variant="outline">
            Export Report
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProductInventoryReport;
