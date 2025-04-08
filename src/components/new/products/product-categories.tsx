import React, { useState } from 'react';
import { useProducts } from '@/hooks/products';
import { Card, Title, Text, Grid, Col, Badge, BarChart } from '@tremor/react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/format';

/**
 * ProductCategories component
 * 
 * Displays a list of product categories with counts and values
 * Allows filtering and managing product categories
 * 
 * @returns React component
 */
export const ProductCategories: React.FC = () => {
  const { data: products, isLoading, error } = useProducts();
  const [newCategory, setNewCategory] = useState('');
  const [filter, setFilter] = useState('');

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
        <p>Error loading product categories: {error instanceof Error ? error.message : 'Unknown error'}</p>
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

  // Calculate category statistics
  const categoriesMap = new Map();
  products.forEach(product => {
    const category = product.category || 'Uncategorized';
    const value = (product.cost || 0) * (product.total_qty_purchased || 0);
    
    if (categoriesMap.has(category)) {
      const existing = categoriesMap.get(category);
      categoriesMap.set(category, {
        count: existing.count + 1,
        value: existing.value + value,
        products: [...existing.products, product]
      });
    } else {
      categoriesMap.set(category, { 
        count: 1, 
        value, 
        products: [product] 
      });
    }
  });

  // Convert to array and sort by count
  const categoryStats = Array.from(categoriesMap.entries())
    .map(([category, stats]) => ({
      category,
      count: stats.count,
      value: stats.value,
      products: stats.products
    }))
    .sort((a, b) => b.count - a.count);

  // Filter categories based on search term
  const filteredCategories = filter
    ? categoryStats.filter(cat => 
        cat.category.toLowerCase().includes(filter.toLowerCase())
      )
    : categoryStats;

  // Prepare chart data
  const chartData = filteredCategories
    .slice(0, 10) // Top 10 categories
    .map(cat => ({
      name: cat.category,
      'Product Count': cat.count,
      'Total Value': cat.value,
    }));

  return (
    <div>
      <div className="mb-6">
        <Title>Product Categories</Title>
        <Text>Manage and analyze your product categories</Text>
      </div>

      <div className="mb-6">
        <div className="flex gap-2">
          <Input
            placeholder="Search categories..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      <Grid numItemsMd={2} className="gap-6 mb-6">
        <Card>
          <Title>Categories by Product Count</Title>
          <BarChart
            className="mt-4 h-80"
            data={chartData}
            index="name"
            categories={['Product Count']}
            colors={['blue']}
            valueFormatter={(value) => `${value} products`}
            yAxisWidth={48}
          />
        </Card>

        <Card>
          <Title>Categories by Value</Title>
          <BarChart
            className="mt-4 h-80"
            data={chartData}
            index="name"
            categories={['Total Value']}
            colors={['emerald']}
            valueFormatter={(value) => formatCurrency(value)}
            yAxisWidth={80}
          />
        </Card>
      </Grid>

      <Card>
        <Title>All Categories</Title>
        <Text className="mb-4">
          {filteredCategories.length} categories found
        </Text>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Product Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map((category, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Badge color={category.category === 'Uncategorized' ? 'gray' : 'blue'}>
                        {category.category}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(category.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(category.value / category.count)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ProductCategories;
