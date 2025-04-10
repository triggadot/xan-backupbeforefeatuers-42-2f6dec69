import React from 'react';
import { useProductDetail } from '@/hooks/products';
import { Product } from '@/types/products';
import { Card, Title, Text, Grid, Col, Metric, Badge, Tab, TabGroup, TabList, TabPanel, TabPanels } from '@tremor/react';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency, formatDate } from '@/utils/format';
import { ProductImageGallery } from './product-image-gallery';
import { ProductStock } from './product-stock';
import { ProductFinance } from './product-finance';

interface ProductDetailProps {
  productId: string;
  onBack: () => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ productId, onBack }) => {
  const { data: product, isLoading, error } = useProductDetail(productId);

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
        <p>Error loading product details: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        <p>Product not found</p>
      </div>
    );
  }

  const totalValue = (product.cost || 0) * (product.total_qty_purchased || 0);

  return (
    <div>
      <div className="mb-4 flex items-center">
        <button 
          onClick={onBack}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
        <Title>Product Details</Title>
      </div>

      <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mb-6">
        <Card decoration="top" decorationColor="blue">
          <div className="flex justify-between items-start">
            <div>
              <Text>Product Name</Text>
              <Metric className="mt-1">{product.display_name}</Metric>
              {product.vendor_product_name !== product.new_product_name && (
                <Text className="text-gray-500 mt-1">Vendor Name: {product.vendor_product_name}</Text>
              )}
            </div>
            <div className="flex space-x-1">
              {product.samples && (
                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                  Sample
                </Badge>
              )}
              {product.fronted && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  Fronted
                </Badge>
              )}
              {product.miscellaneous_items && (
                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                  Misc
                </Badge>
              )}
            </div>
          </div>
        </Card>

        <Card decoration="top" decorationColor="green">
          <Text>Total Value</Text>
          <Metric className="mt-1">{formatCurrency(totalValue)}</Metric>
          <div className="mt-2 flex justify-between">
            <Text>Unit Cost: {formatCurrency(product.cost || 0)}</Text>
            <Text>Quantity: {product.total_qty_purchased || 0}</Text>
          </div>
        </Card>

        <Card decoration="top" decorationColor="amber">
          <Text>Vendor</Text>
          <Metric className="mt-1">{product.vendor?.account_name || 'N/A'}</Metric>
          {product.product_purchase_date && (
            <Text className="mt-2">Purchase Date: {formatDate(product.product_purchase_date)}</Text>
          )}
        </Card>
      </Grid>

      <Grid numItemsMd={2} className="gap-6">
        <Col>
          <ProductImageGallery product={product} />
        </Col>
        
        <Col>
          <Card className="mb-6">
            <div className="flex items-center mb-4">
              <div className="flex-1">
                <Title>Product Information</Title>
              </div>
              {product.category && (
                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                  {product.category}
                </Badge>
              )}
            </div>

            <Grid numItemsMd={2} className="gap-6">
              <Col>
                <div className="mb-4">
                  <Text className="font-medium">Product Details</Text>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <Text className="text-gray-500">ID:</Text>
                      <Text>{product.glide_row_id}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text className="text-gray-500">Created:</Text>
                      <Text>{formatDate(product.created_at)}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text className="text-gray-500">Updated:</Text>
                      <Text>{formatDate(product.updated_at)}</Text>
                    </div>
                  </div>
                </div>

                {product.fronted && (
                  <div className="mb-4">
                    <Text className="font-medium">Fronted Product Details</Text>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <Text className="text-gray-500">Terms:</Text>
                        <Text>{product.terms_for_fronted_product || 'N/A'}</Text>
                      </div>
                    </div>
                  </div>
                )}

                {product.samples && (
                  <div className="mb-4">
                    <Text className="font-medium">Sample Details</Text>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <Text className="text-gray-500">Units Behind Sample:</Text>
                        <Text>{product.total_units_behind_sample || 'N/A'}</Text>
                      </div>
                    </div>
                  </div>
                )}
              </Col>

              <Col>
                {product.purchase_notes && (
                  <div className="mb-4">
                    <Text className="font-medium">Purchase Notes</Text>
                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                      <Text>{product.purchase_notes}</Text>
                    </div>
                  </div>
                )}
              </Col>
            </Grid>
          </Card>
        </Col>
      </Grid>

      {/* Stock & Finance Sections */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <ProductStock productId={product.glide_row_id} />
        <ProductFinance productId={product.glide_row_id} />
      </div>

      <Card>
        <TabGroup>
          <TabList>
            <Tab>Related Invoices</Tab>
            <Tab>Related Estimates</Tab>
            {product.purchaseOrder && <Tab>Purchase Order</Tab>}
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <div className="mt-4">
                <Title>Invoice Lines</Title>
                {product.invoiceLines && product.invoiceLines.length > 0 ? (
                  <div className="overflow-x-auto mt-4">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {product.invoiceLines.map((line) => (
                          <tr key={line.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {line.invoice?.invoice_uid || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {line.invoice?.invoice_order_date ? formatDate(line.invoice.invoice_order_date) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {line.qty_sold || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(line.selling_price || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency((line.qty_sold || 0) * (line.selling_price || 0))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {line.invoice?.payment_status || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Text className="mt-2 text-gray-500">No invoice lines found for this product</Text>
                )}
              </div>
            </TabPanel>
            
            <TabPanel>
              <div className="mt-4">
                <Title>Estimate Lines</Title>
                {product.estimateLines && product.estimateLines.length > 0 ? (
                  <div className="overflow-x-auto mt-4">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimate</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {product.estimateLines.map((line) => (
                          <tr key={line.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {line.estimate?.estimate_uid || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {line.estimate?.estimate_date ? formatDate(line.estimate.estimate_date) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {line.quantity || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(line.unit_price || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency((line.quantity || 0) * (line.unit_price || 0))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {line.estimate?.status || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Text className="mt-2 text-gray-500">No estimate lines found for this product</Text>
                )}
              </div>
            </TabPanel>
            
            {product.purchaseOrder && (
              <TabPanel>
                <div className="mt-4">
                  <Title>Purchase Order Details</Title>
                  <Grid numItemsMd={2} className="gap-6 mt-4">
                    <Card decoration="left" decorationColor="indigo">
                      <Text>Purchase Order ID</Text>
                      <Metric className="mt-1">{product.purchaseOrder.purchase_order_uid || 'N/A'}</Metric>
                      {product.purchaseOrder.po_date && (
                        <Text className="mt-2">Date: {formatDate(product.purchaseOrder.po_date)}</Text>
                      )}
                    </Card>
                    <Card decoration="left" decorationColor="indigo">
                      <Text>Payment Status</Text>
                      <Metric className="mt-1">{product.purchaseOrder.payment_status || 'N/A'}</Metric>
                      <div className="mt-2 flex justify-between">
                        <Text>Total: {formatCurrency(product.purchaseOrder.total_amount || 0)}</Text>
                        <Text>Balance: {formatCurrency(product.purchaseOrder.balance || 0)}</Text>
                      </div>
                    </Card>
                  </Grid>
                </div>
              </TabPanel>
            )}
          </TabPanels>
        </TabGroup>
      </Card>
    </div>
  );
};

export default ProductDetail;
