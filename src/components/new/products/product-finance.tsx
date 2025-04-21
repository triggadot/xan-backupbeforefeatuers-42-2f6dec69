import React from 'react';
import { useProductDetail } from '@/hooks/products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ValueFormatter, AreaChart, BarChart, DonutChart, Tab, TabGroup, TabList, TabPanel, TabPanels, Text, Title } from '@tremor/react';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency, formatDate } from '@/utils/format';
import { useProductStock } from '@/hooks/products/useProductStock';

interface ProductFinanceProps {
  productId: string;
}

/**
 * ProductFinance component
 * 
 * Displays financial information about a product including:
 * - Revenue generated from invoices
 * - Profit analysis
 * - Vendor payments
 * - Financial timeline
 * 
 * @returns React component
 */
export const ProductFinance: React.FC<ProductFinanceProps> = ({ productId }) => {
  const { data: product, isLoading: productLoading, error: productError } = useProductDetail(productId);
  const { data: stockData, isLoading: stockLoading, error: stockError } = useProductStock(productId);
  
  const isLoading = productLoading || stockLoading;
  const error = productError || stockError;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>Error loading financial data: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  if (!product || !stockData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        <p>No financial data available</p>
      </div>
    );
  }

  // Calculate financial metrics
  const unitCost = product.cost || 0;
  const initialStock = stockData.initialStock;
  const totalCost = unitCost * initialStock;
  
  // Process invoice lines to calculate revenue
  const invoiceLines = product.invoiceLines || [];
  const totalRevenue = invoiceLines.reduce((sum, line) => sum + (line.total || 0), 0);
  const totalUnitsSold = invoiceLines.reduce((sum, line) => sum + (line.quantity || 0), 0);
  const averageSellingPrice = totalUnitsSold > 0 ? totalRevenue / totalUnitsSold : 0;
  const grossProfit = totalRevenue - (unitCost * totalUnitsSold);
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Prepare revenue by month chart data
  const invoicesByMonth: Record<string, { revenue: number, profit: number, units: number }> = {};
  
  invoiceLines.forEach(line => {
    if (line.invoice?.invoice_date) {
      const date = new Date(line.invoice.invoice_date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      const lineTotal = line.total || 0;
      const lineQuantity = line.quantity || 0;
      const lineCost = unitCost * lineQuantity;
      const lineProfit = lineTotal - lineCost;
      
      if (!invoicesByMonth[monthKey]) {
        invoicesByMonth[monthKey] = { 
          revenue: 0, 
          profit: 0,
          units: 0
        };
      }
      
      invoicesByMonth[monthKey].revenue += lineTotal;
      invoicesByMonth[monthKey].profit += lineProfit;
      invoicesByMonth[monthKey].units += lineQuantity;
    }
  });
  
  const revenueChartData = Object.entries(invoicesByMonth)
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-');
      return {
        month: `${new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short', year: '2-digit' })}`,
        Revenue: data.revenue,
        Profit: data.profit,
        Units: data.units
      };
    })
    .sort((a, b) => {
      const aDate = new Date(a.month);
      const bDate = new Date(b.month);
      return aDate.getTime() - bDate.getTime();
    });

  // Prepare profit analysis chart data
  const profitAnalysisData = [
    { name: 'COGS', value: unitCost * totalUnitsSold },
    { name: 'Gross Profit', value: grossProfit }
  ];

  // Format values for charts
  const currencyFormatter: ValueFormatter = (value) => formatCurrency(value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <Text>Total Cost</Text>
            <div className="text-2xl font-semibold mt-1">{formatCurrency(totalCost)}</div>
            <Text className="text-xs text-gray-500">Unit Cost: {formatCurrency(unitCost)}</Text>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <Text>Total Revenue</Text>
            <div className="text-2xl font-semibold mt-1">{formatCurrency(totalRevenue)}</div>
            <Text className="text-xs text-gray-500">Avg. Selling Price: {formatCurrency(averageSellingPrice)}</Text>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <Text>Gross Profit</Text>
            <div className="text-2xl font-semibold mt-1">{formatCurrency(grossProfit)}</div>
            <Text className="text-xs text-gray-500">Margin: {grossMargin.toFixed(2)}%</Text>
          </div>
        </div>

        <TabGroup>
          <TabList className="mb-4">
            <Tab>Revenue</Tab>
            <Tab>Profit Analysis</Tab>
            <Tab>Customer Analysis</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <div className="mb-4">
                <Title>Revenue & Profit by Month</Title>
              </div>
              {revenueChartData.length > 0 ? (
                <AreaChart
                  className="h-72"
                  data={revenueChartData}
                  index="month"
                  categories={["Revenue", "Profit"]}
                  colors={["blue", "green"]}
                  valueFormatter={currencyFormatter}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No revenue data available
                </div>
              )}
            </TabPanel>
            
            <TabPanel>
              <div className="mb-4">
                <Title>Profit Breakdown</Title>
              </div>
              {totalRevenue > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DonutChart
                    className="h-60"
                    data={profitAnalysisData}
                    category="value"
                    index="name"
                    valueFormatter={currencyFormatter}
                    colors={["slate", "green"]}
                  />
                  
                  <div className="flex flex-col justify-center">
                    <div className="mb-2">
                      <Text className="font-medium">Total Revenue</Text>
                      <div className="text-xl font-semibold">{formatCurrency(totalRevenue)}</div>
                    </div>
                    <div className="mb-2">
                      <Text className="font-medium">Cost of Goods Sold</Text>
                      <div className="text-xl font-semibold text-slate-700">{formatCurrency(unitCost * totalUnitsSold)}</div>
                    </div>
                    <div>
                      <Text className="font-medium">Gross Profit</Text>
                      <div className="text-xl font-semibold text-green-600">{formatCurrency(grossProfit)}</div>
                    </div>
                    <div className="mt-auto">
                      <Text className="font-medium">Gross Margin</Text>
                      <div className="text-xl font-semibold">{grossMargin.toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No revenue data available for profit analysis
                </div>
              )}
            </TabPanel>
            
            <TabPanel>
              <div className="mb-4">
                <Title>Revenue by Customer</Title>
              </div>
              {invoiceLines.length > 0 ? (
                <div>
                  {/* Group invoice lines by customer */}
                  {(() => {
                    const customerRevenue: Record<string, { revenue: number, units: number }> = {};
                    
                    invoiceLines.forEach(line => {
                      if (line.invoice?.gl_accounts?.account_name) {
                        const customerName = line.invoice.gl_accounts.account_name;
                        
                        if (!customerRevenue[customerName]) {
                          customerRevenue[customerName] = { revenue: 0, units: 0 };
                        }
                        
                        customerRevenue[customerName].revenue += line.total || 0;
                        customerRevenue[customerName].units += line.quantity || 0;
                      }
                    });
                    
                    const customerData = Object.entries(customerRevenue)
                      .map(([customer, data]) => ({
                        customer,
                        value: data.revenue,
                        units: data.units
                      }))
                      .sort((a, b) => b.value - a.value);
                    
                    return (
                      <BarChart
                        className="h-72"
                        data={customerData}
                        index="customer"
                        categories={["value"]}
                        colors={["blue"]}
                        valueFormatter={currencyFormatter}
                        yAxisWidth={80}
                      />
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No customer revenue data available
                </div>
              )}
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </CardContent>
    </Card>
  );
};

export default ProductFinance;
