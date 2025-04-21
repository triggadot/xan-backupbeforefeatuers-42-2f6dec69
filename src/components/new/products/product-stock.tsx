import React from 'react';
import { useProductStock } from '@/hooks/products/useProductStock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Metric, Text, Title } from '@tremor/react';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/utils/format';
import { BadgeDelta } from '@tremor/react';

interface ProductStockProps {
  productId: string;
}

/**
 * ProductStock component
 * 
 * Displays detailed stock/inventory information for a product:
 * - Current stock level
 * - Stock movement history (invoices and sample estimates)
 * - Stock level visualization
 * 
 * @returns React component
 */
export const ProductStock: React.FC<ProductStockProps> = ({ productId }) => {
  const { data: stockData, isLoading, error } = useProductStock(productId);

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
        <p>Error loading stock data: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        <p>No stock data available</p>
      </div>
    );
  }

  // Determine stock status for visual indicators
  const stockStatus = stockData.currentStock <= 0 
    ? 'decrease' 
    : stockData.currentStock < stockData.initialStock * 0.2 
      ? 'moderateDecrease' 
      : 'unchanged';

  // Prepare chart data for stock movement history
  const stockMovementData = [
    ...(stockData.invoiceLines || []).map(line => ({
      date: line.date,
      name: `Invoice ${line.invoiceUid || line.invoiceId}`,
      quantity: -line.quantity, // Negative for outgoing
      type: 'Invoice',
      customer: line.customerName,
    })),
    ...(stockData.sampleEstimateLines || []).map(line => ({
      date: line.date,
      name: `Sample Estimate ${line.estimateUid || line.estimateId}`,
      quantity: -line.quantity, // Negative for outgoing
      type: 'Sample',
      customer: line.customerName,
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock & Inventory</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <Text>Initial Stock</Text>
            <Metric>{stockData.initialStock}</Metric>
            <Text className="text-xs text-gray-500">Total quantity purchased</Text>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <Text>Used Stock</Text>
            <Metric>{stockData.invoicedQuantity + stockData.sampledQuantity}</Metric>
            <div className="flex text-xs text-gray-500 justify-between">
              <span>Invoiced: {stockData.invoicedQuantity}</span>
              <span>Sampled: {stockData.sampledQuantity}</span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <Text>Current Stock</Text>
            <div className="flex items-center gap-2">
              <Metric>{stockData.currentStock}</Metric>
              <BadgeDelta deltaType={stockStatus} />
            </div>
            <Text className="text-xs text-gray-500">
              {stockData.currentStock <= 0 
                ? 'Out of stock' 
                : stockData.currentStock < stockData.initialStock * 0.2 
                  ? 'Low stock' 
                  : 'In stock'}
            </Text>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Movements</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="samples">Samples</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="mb-4">
              <Title>Stock Movement History</Title>
            </div>
            {stockMovementData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Reference</th>
                      <th className="px-4 py-2 text-left">Customer</th>
                      <th className="px-4 py-2 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockMovementData.map((movement, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{formatDate(movement.date)}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            movement.type === 'Invoice' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {movement.type}
                          </span>
                        </td>
                        <td className="px-4 py-2">{movement.name}</td>
                        <td className="px-4 py-2">{movement.customer || 'N/A'}</td>
                        <td className="px-4 py-2 text-right font-medium text-red-600">{movement.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No stock movements recorded
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoices">
            <div className="mb-4">
              <Title>Invoiced Stock</Title>
            </div>
            {stockData.invoiceLines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Invoice</th>
                      <th className="px-4 py-2 text-left">Customer</th>
                      <th className="px-4 py-2 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockData.invoiceLines.map((line, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{formatDate(line.date)}</td>
                        <td className="px-4 py-2">{line.invoiceUid || line.invoiceId}</td>
                        <td className="px-4 py-2">{line.customerName || 'N/A'}</td>
                        <td className="px-4 py-2 text-right font-medium text-red-600">{line.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No invoiced stock
              </div>
            )}
          </TabsContent>

          <TabsContent value="samples">
            <div className="mb-4">
              <Title>Sampled Stock</Title>
            </div>
            {stockData.sampleEstimateLines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Estimate</th>
                      <th className="px-4 py-2 text-left">Customer</th>
                      <th className="px-4 py-2 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockData.sampleEstimateLines.map((line, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{formatDate(line.date)}</td>
                        <td className="px-4 py-2">{line.estimateUid || line.estimateId}</td>
                        <td className="px-4 py-2">{line.customerName || 'N/A'}</td>
                        <td className="px-4 py-2 text-right font-medium text-red-600">{line.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No sampled stock
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProductStock;
