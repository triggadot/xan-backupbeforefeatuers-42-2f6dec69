import React, { useState, useMemo } from 'react';
import { useInventoryReport } from '@/hooks/products/useInventoryReport';
import { Card, CardContent, Title, Text, Grid, Col, BarList, DonutChart, DateRangePicker, Badge, BadgeDelta, ProgressBar, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@tremor/react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/utils/format';
import { DateRange } from 'react-day-picker';
import { Search, AlertTriangle, CheckCircle2, Package, ArrowUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';

/**
 * ProductInventoryReport component
 * 
 * Displays comprehensive inventory reports and analytics for products
 * Includes real-time stock levels calculated from invoices and sample estimates
 * Allows filtering by date range, category, stock status, and text search
 * 
 * @returns React component
 */
export const ProductInventoryReport: React.FC = () => {
  const { data: inventoryItems, isLoading, error } = useInventoryReport();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  if (!inventoryItems || inventoryItems.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        <p>No products found</p>
      </div>
    );
  }

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = new Set(inventoryItems.map(item => item.category).filter(Boolean));
    return ['All', ...Array.from(uniqueCategories)];
  }, [inventoryItems]);

  // Apply filters
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      // Filter by search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesName = item.display_name?.toLowerCase().includes(searchLower);
        const matchesCategory = item.category?.toLowerCase().includes(searchLower);
        const matchesVendor = item.vendor_name?.toLowerCase().includes(searchLower);
        
        if (!matchesName && !matchesCategory && !matchesVendor) {
          return false;
        }
      }
      
      // Filter by date range
      if (dateRange?.from && item.product_purchase_date) {
        const purchaseDate = new Date(item.product_purchase_date);
        if (dateRange.to) {
          if (!(purchaseDate >= dateRange.from && purchaseDate <= dateRange.to)) {
            return false;
          }
        } else if (!(purchaseDate >= dateRange.from)) {
          return false;
        }
      }
      
      // Filter by category
      if (selectedCategory && selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      
      // Filter by stock status
      if (stockFilter !== 'all') {
        switch (stockFilter) {
          case 'out':
            return item.currentStock <= 0;
          case 'low':
            return item.currentStock > 0 && item.currentStock < item.initialStock * 0.2;
          case 'in':
            return item.currentStock >= item.initialStock * 0.2;
          default:
            return true;
        }
      }
      
      return true;
    });
  }, [inventoryItems, searchQuery, dateRange, selectedCategory, stockFilter]);

  // Calculate inventory statistics
  const totalProducts = filteredItems.length;
  
  // Calculate current inventory values
  const totalInitialStock = filteredItems.reduce((sum, item) => sum + item.initialStock, 0);
  const totalCurrentStock = filteredItems.reduce((sum, item) => sum + item.currentStock, 0);
  const totalStockValue = filteredItems.reduce((sum, item) => sum + item.stockValue, 0);
  const totalUsedStock = filteredItems.reduce((sum, item) => sum + (item.invoicedQuantity + item.sampledQuantity), 0);
  
  // Calculate percentage of stock still available
  const stockPercentage = totalInitialStock > 0 ? (totalCurrentStock / totalInitialStock) * 100 : 0;
  
  // Count products by stock status
  const outOfStockCount = filteredItems.filter(item => item.currentStock <= 0).length;
  const lowStockCount = filteredItems.filter(item => item.currentStock > 0 && item.currentStock < item.initialStock * 0.2).length;
  const inStockCount = filteredItems.filter(item => item.currentStock >= item.initialStock * 0.2).length;

  // Calculate category distribution
  const categoryData = filteredItems.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    const value = item.stockValue;
    
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

  // Top products by current stock value
  const topProducts = [...filteredItems]
    .sort((a, b) => b.stockValue - a.stockValue)
    .slice(0, 5)
    .map(item => ({
      name: item.display_name,
      value: item.stockValue,
      stock: item.currentStock,
      totalStock: item.initialStock
    }));
    
  // Stock status distribution for pie chart
  const stockStatusData = [
    { name: 'In Stock', value: inStockCount },
    { name: 'Low Stock', value: lowStockCount },
    { name: 'Out of Stock', value: outOfStockCount }
  ];

  return (
    <div>
      <div className="mb-6">
        <Title>Inventory Report</Title>
        <Text>Comprehensive stock analysis with real-time inventory levels</Text>
      </div>

      {/* Filters Section */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Category Filter */}
            <Select
              value={selectedCategory || 'All'}
              onValueChange={(value) => setSelectedCategory(value === 'All' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category, index) => (
                  <SelectItem key={index} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Stock Status Filter */}
            <Select
              value={stockFilter}
              onValueChange={setStockFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <DateRangePicker
              value={dateRange}
              onValueChange={setDateRange}
              placeholder="Purchase date range"
              selectPlaceholder="Select"
              color="blue"
            />
          </div>

          {/* Current Filter Indicators */}
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <Badge variant="outline" className="flex items-center gap-1">
                Search: {searchQuery}
                <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-gray-700">
                  ×
                </button>
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="outline" className="flex items-center gap-1">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory(null)} className="ml-1 hover:text-gray-700">
                  ×
                </button>
              </Badge>
            )}
            {stockFilter !== 'all' && (
              <Badge variant="outline" className="flex items-center gap-1">
                Status: {stockFilter === 'in' ? 'In Stock' : stockFilter === 'low' ? 'Low Stock' : 'Out of Stock'}
                <button onClick={() => setStockFilter('all')} className="ml-1 hover:text-gray-700">
                  ×
                </button>
              </Badge>
            )}
            {dateRange?.from && (
              <Badge variant="outline" className="flex items-center gap-1">
                Date: {formatDate(dateRange.from)} {dateRange.to ? `to ${formatDate(dateRange.to)}` : ''}
                <button onClick={() => setDateRange(undefined)} className="ml-1 hover:text-gray-700">
                  ×
                </button>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Grid numItemsMd={2} numItemsLg={4} className="gap-6 mb-6">
        <Card decoration="top" decorationColor="blue">
          <div className="flex items-start justify-between">
            <div>
              <Text>Current Stock Value</Text>
              <Text className="mt-1 text-2xl font-semibold">{formatCurrency(totalStockValue)}</Text>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-4">
            <Text className="text-sm text-gray-500">Total Products: {totalProducts}</Text>
          </div>
        </Card>
        
        <Card decoration="top" decorationColor="green">
          <div className="flex items-start justify-between">
            <div>
              <Text>Current Stock Levels</Text>
              <Text className="mt-1 text-2xl font-semibold">
                {totalCurrentStock.toLocaleString()} / {totalInitialStock.toLocaleString()}
              </Text>
            </div>
            <BadgeDelta 
              deltaType={stockPercentage >= 70 ? "increase" : stockPercentage >= 30 ? "moderateIncrease" : "decrease"} 
              size="lg"
            />
          </div>
          <div className="mt-2">
            <ProgressBar value={stockPercentage} color="emerald" className="mt-2" />
            <Text className="text-sm text-gray-500 mt-1">{stockPercentage.toFixed(1)}% of stock remaining</Text>
          </div>
        </Card>
        
        <Card decoration="top" decorationColor="amber">
          <div className="flex items-start justify-between">
            <div>
              <Text>Stock Status</Text>
              <div className="flex gap-2 mt-1">
                <div className="text-lg font-semibold flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                  {inStockCount}
                </div>
                <div className="text-lg font-semibold flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-1"></span>
                  {lowStockCount}
                </div>
                <div className="text-lg font-semibold flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
                  {outOfStockCount}
                </div>
              </div>
            </div>
            {outOfStockCount > 0 && <AlertTriangle className="h-8 w-8 text-amber-500" />}
            {outOfStockCount === 0 && <CheckCircle2 className="h-8 w-8 text-green-500" />}
          </div>
          <div className="mt-2">
            <Text className="text-sm text-gray-500">
              {outOfStockCount} out of stock • {lowStockCount} low stock
            </Text>
          </div>
        </Card>
        
        <Card decoration="top" decorationColor="indigo">
          <div className="flex items-start justify-between">
            <div>
              <Text>Total Used Stock</Text>
              <Text className="mt-1 text-2xl font-semibold">{totalUsedStock.toLocaleString()}</Text>
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-500">
            <span>Invoiced: {filteredItems.reduce((sum, item) => sum + item.invoicedQuantity, 0)}</span>
            <span>Sampled: {filteredItems.reduce((sum, item) => sum + item.sampledQuantity, 0)}</span>
          </div>
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
          <Title>Stock Status Distribution</Title>
          <DonutChart
            className="mt-4 h-60"
            data={stockStatusData}
            category="value"
            index="name"
            colors={["emerald", "amber", "rose"]}
          />
        </Card>
      </Grid>
      
      <Grid numItemsMd={2} className="gap-6 mb-6">
        <Card>
          <Title>Top Products by Current Stock Value</Title>
          <div className="mt-4">
            {topProducts.map((product, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <div className="flex justify-between items-center">
                  <Text>{product.name}</Text>
                  <Text>{formatCurrency(product.value)}</Text>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <ProgressBar 
                    value={(product.stock / product.totalStock) * 100} 
                    color={product.stock <= 0 ? "rose" : product.stock < product.totalStock * 0.2 ? "amber" : "emerald"} 
                    className="flex-1" 
                  />
                  <Text className="text-xs whitespace-nowrap">
                    {product.stock} / {product.totalStock}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        <Card>
          <Title>Stock Alerts</Title>
          <div className="mt-4">
            {outOfStockCount === 0 && lowStockCount === 0 ? (
              <div className="flex items-center justify-center flex-col p-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <Text>All products have sufficient stock levels</Text>
              </div>
            ) : (
              <div className="space-y-4">
                {outOfStockCount > 0 && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 text-red-800 font-medium mb-1">
                      <AlertTriangle size={16} />
                      <span>{outOfStockCount} Products Out of Stock</span>
                    </div>
                    <Text className="text-sm text-red-700">
                      {filteredItems.filter(item => item.currentStock <= 0)
                        .map(item => item.display_name)
                        .slice(0, 3)
                        .join(', ')}
                      {filteredItems.filter(item => item.currentStock <= 0).length > 3 &&
                        ` and ${filteredItems.filter(item => item.currentStock <= 0).length - 3} more`}
                    </Text>
                  </div>
                )}
                
                {lowStockCount > 0 && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-800 font-medium mb-1">
                      <AlertTriangle size={16} />
                      <span>{lowStockCount} Products Low Stock</span>
                    </div>
                    <Text className="text-sm text-amber-700">
                      {filteredItems.filter(item => item.currentStock > 0 && item.currentStock < item.initialStock * 0.2)
                        .map(item => item.display_name)
                        .slice(0, 3)
                        .join(', ')}
                      {filteredItems.filter(item => item.currentStock > 0 && item.currentStock < item.initialStock * 0.2).length > 3 &&
                        ` and ${filteredItems.filter(item => item.currentStock > 0 && item.currentStock < item.initialStock * 0.2).length - 3} more`}
                    </Text>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </Grid>
      
      <Card className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <Title>Product Inventory Details</Title>
          <Text className="text-gray-500">
            Showing {filteredItems.length} of {inventoryItems?.length || 0} products
            {dateRange?.from && ` from ${formatDate(dateRange.from)} ${dateRange.to ? `to ${formatDate(dateRange.to)}` : ''}`}
          </Text>
        </div>
        
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Product</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell>Vendor</TableHeaderCell>
              <TableHeaderCell>Initial Stock</TableHeaderCell>
              <TableHeaderCell>Current Stock</TableHeaderCell>
              <TableHeaderCell>Stock Status</TableHeaderCell>
              <TableHeaderCell>Value</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No products matching your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Link to={`/new/products/${item.id}`} className="text-blue-600 hover:underline flex items-center gap-2">
                      {item.product_image1 && (
                        <img src={item.product_image1} alt={item.display_name} className="h-8 w-8 object-cover rounded" />
                      )}
                      <span>{item.display_name}</span>
                    </Link>
                  </TableCell>
                  <TableCell>{item.category || 'Uncategorized'}</TableCell>
                  <TableCell>{item.vendor_name || '-'}</TableCell>
                  <TableCell>{item.initialStock.toLocaleString()}</TableCell>
                  <TableCell>{item.currentStock.toLocaleString()}</TableCell>
                  <TableCell>
                    {item.currentStock <= 0 ? (
                      <Badge color="red">Out of Stock</Badge>
                    ) : item.currentStock < item.initialStock * 0.2 ? (
                      <Badge color="amber">Low Stock</Badge>
                    ) : (
                      <Badge color="emerald">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(item.stockValue)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
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
