import React from 'react';
import { Card, Grid, Col, Title, Text, Tab, TabGroup, TabList, TabPanel, TabPanels, Metric, Bold, Divider } from '@tremor/react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatShortDate } from '@/utils/format';
import { ProductDetail as ProductDetailType } from '@/types/products';
import { ProductPDFActions } from '@/components/products/ProductPDFActions';
import { ProductCrudActions } from '@/components/products/ProductCrudActions';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';

interface ProductDetailProps {
  /**
   * The product data to display
   */
  product: ProductDetailType;
  
  /**
   * Optional loading state
   */
  isLoading?: boolean;
  
  /**
   * Optional error state
   */
  error?: Error | null;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, isLoading, error }) => {
  const navigate = useNavigate();
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
        <p>Error loading product: {error.message}</p>
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
      <div className="flex justify-between items-center mb-6">
        <Title>Product Details</Title>
        <div className="flex space-x-2">
          <ProductCrudActions
            product={product}
            mode="detail"
            hideActions={{ add: true }}
            onActionComplete={() => navigate('/products')}
          />
          <ProductPDFActions 
            productId={product.glide_row_id} 
            productName={product.display_name || product.vendor_product_name} 
            existingPdfUrl={product.supabase_pdf_url} 
          />
        </div>
      </div>

      <Grid numItemsMd={2} numItemsLg={3} className="gap-6 mb-6">
        <Card decoration="top" decorationColor="blue">
          <div className="flex justify-between items-start">
            <div>
              <Text>Product Name</Text>
              <Metric className="mt-1">{product.display_name}</Metric>
              {product.vendor_product_name && product.vendor_product_name !== product.display_name && (
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

      <Grid numItemsMd={2} className="gap-6 mb-6">
        <Col>
          <Card className="h-full">
            <Title className="mb-4">Product Images</Title>
            {product.product_image1 ? (
              <div className="aspect-square overflow-hidden rounded-md bg-gray-100 flex items-center justify-center">
                <img
                  src={product.product_image1}
                  alt={product.display_name}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 flex items-center justify-center rounded-md">
                <Text className="text-gray-400">No image available</Text>
              </div>
            )}
          </Card>
        </Col>
        
        <Col>
          <Card className="h-full">
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
            <Tab>Related Invoices ({product.invoiceLines?.length || 0})</Tab>
            <Tab>Related Estimates ({product.estimateLines?.length || 0})</Tab>
            {product.purchaseOrder && <Tab>Purchase Order</Tab>}
            <Tab>Vendor Payments</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <div className="mt-4">
                <Title>Related Invoices</Title>
                {product.invoiceLines && product.invoiceLines.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {product.invoiceLines.map((line, index) => (
                      <li key={index} className="text-sm border-b border-gray-100 pb-2">
                        <div className="flex justify-between">
                          <span>
                            Invoice #{line.invoice?.invoice_uid || 'N/A'}
                            {line.invoice?.account && (
                              <span className="text-gray-500 ml-1">({line.invoice.account.account_name})</span>
                            )}
                          </span>
                          <span className="font-medium">{formatCurrency(line.line_amt || 0)}</span>
                        </div>
                        {line.invoice && (
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{formatShortDate(line.invoice.invoice_date)}</span>
                            <span>{line.invoice.status || 'Unknown'}</span>
                            {line.invoice.supabase_pdf_url && (
                              <a 
                                href={line.invoice.supabase_pdf_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View PDF
                              </a>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Text className="text-sm text-gray-500">No related invoices</Text>
                )}
              </div>
            </TabPanel>
            
            <TabPanel>
              <div className="mt-4">
                <Title>Related Estimates</Title>
                {product.estimateLines && product.estimateLines.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {product.estimateLines.map((line, index) => (
                      <li key={index} className="text-sm border-b border-gray-100 pb-2">
                        <div className="flex justify-between">
                          <span>
                            Estimate #{line.estimate?.estimate_uid || 'N/A'}
                            {line.estimate?.account && (
                              <span className="text-gray-500 ml-1">({line.estimate.account.account_name})</span>
                            )}
                          </span>
                          <span className="font-medium">{formatCurrency(line.line_amt || 0)}</span>
                        </div>
                        {line.estimate && (
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{formatShortDate(line.estimate.estimate_date)}</span>
                            <span>{line.estimate.status || 'Unknown'}</span>
                            {line.estimate.supabase_pdf_url && (
                              <a 
                                href={line.estimate.supabase_pdf_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View PDF
                              </a>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Text className="text-sm text-gray-500">No related estimates</Text>
                )}
              </div>
            </TabPanel>
            
            {product.purchaseOrder ? (
              <TabPanel>
                <div className="mt-4">
                  <Card>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Title>Purchase Order Details</Title>
                        <Text className="mt-1">
                          <Link to={`/purchase-orders/${product.purchaseOrder.glide_row_id}`} className="text-blue-600 hover:underline">
                            {product.purchaseOrder.po_uid || 'PO-' + product.purchaseOrder.id.substring(0, 8)}
                          </Link>
                        </Text>
                      </div>
                      <Badge color={product.purchaseOrder.balance === 0 ? 'green' : 'yellow'}>
                        {product.purchaseOrder.balance === 0 ? 'Paid' : 'Outstanding'}
                      </Badge>
                    </div>
                    
                    <Grid numItemsMd={2} className="gap-6 mt-4">
                      <Col>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Text className="text-gray-500">Date:</Text>
                            <Text>{formatDate(product.purchaseOrder.date_of_purchase_order)}</Text>
                          </div>
                          <div className="flex justify-between">
                            <Text className="text-gray-500">Vendor:</Text>
                            <Text>{product.purchaseOrder.account?.account_name || 'N/A'}</Text>
                          </div>
                          <div className="flex justify-between">
                            <Text className="text-gray-500">Total Amount:</Text>
                            <Text>{formatCurrency(product.purchaseOrder.total_amount || 0)}</Text>
                          </div>
                        </div>
                      </Col>
                      <Col>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Text className="text-gray-500">Paid Amount:</Text>
                            <Text>{formatCurrency(product.purchaseOrder.total_paid || 0)}</Text>
                          </div>
                          <div className="flex justify-between">
                            <Text className="text-gray-500">Balance:</Text>
                            <Text>{formatCurrency(product.purchaseOrder.balance || 0)}</Text>
                          </div>
                          <div className="flex justify-between">
                            <Text className="text-gray-500">Products Count:</Text>
                            <Text>{product.purchaseOrder.products_count || 1}</Text>
                          </div>
                        </div>
                      </Col>
                    </Grid>
                    
                    <div className="mt-6">
                      <Link to={`/purchase-orders/${product.purchaseOrder.glide_row_id}`}>
                        <Button className="w-full">View Purchase Order</Button>
                      </Link>
                    </div>
                  </Card>
                </div>
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
            <TabPanel>
              <div className="mt-4">
                {product.vendorPayments && product.vendorPayments.length > 0 ? (
                  <Table className="mt-4">
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>Payment Date</TableHeaderCell>
                        <TableHeaderCell>Amount</TableHeaderCell>
                        <TableHeaderCell>Vendor</TableHeaderCell>
                        <TableHeaderCell>Purchase Order</TableHeaderCell>
                        <TableHeaderCell>Notes</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {product.vendorPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.date_of_payment)}</TableCell>
                          <TableCell>{formatCurrency(payment.payment_amount || 0)}</TableCell>
                          <TableCell>{payment.account?.account_name || 'N/A'}</TableCell>
                          <TableCell>
                            {payment.purchaseOrder && (
                              <Link to={`/purchase-orders/${payment.purchaseOrder.glide_row_id}`} className="text-blue-600 hover:underline">
                                {payment.purchaseOrder.po_uid || 'PO-' + payment.purchaseOrder.id.substring(0, 8)}
                              </Link>
      <Card className="mt-6">
        <TabGroup>
          <TabList>
            <Tab>Related Invoices</Tab>
            <Tab>Related Estimates</Tab>
            <Tab>Vendor Payments</Tab>
            <Tab>Documents</Tab>
            {product.purchaseOrder && <Tab>Purchase Order</Tab>}
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <div className="mt-4">
                <Title>Related Invoices</Title>
                {product.invoiceLines && product.invoiceLines.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {product.invoiceLines.map((line, index) => (
                      <li key={index} className="text-sm border-b border-gray-100 pb-2">
                        <div className="flex justify-between">
                          <span>
                            Invoice #{line.invoice?.invoice_uid || 'N/A'}
                            {line.invoice?.account && (
                              <span className="text-gray-500 ml-1">({line.invoice.account.account_name})</span>
                            )}
                          </span>
                          <span className="font-medium">{formatCurrency(line.line_amt || 0)}</span>
                        </div>
                        {line.invoice && (
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{formatShortDate(line.invoice.invoice_date)}</span>
                            <span>{line.invoice.status || 'Unknown'}</span>
                            {line.invoice.supabase_pdf_url && (
                              <a 
                                href={line.invoice.supabase_pdf_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View PDF
                              </a>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Text className="text-sm text-gray-500">No related invoices</Text>
                )}
              </div>
            </TabPanel>
            
            <TabPanel>
              <div className="mt-4">
                <Title>Related Estimates</Title>
                {product.estimateLines && product.estimateLines.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {product.estimateLines.map((line, index) => (
                      <li key={index} className="text-sm border-b border-gray-100 pb-2">
                        <div className="flex justify-between">
                          <span>
                            Estimate #{line.estimate?.estimate_uid || 'N/A'}
                            {line.estimate?.account && (
                              <span className="text-gray-500 ml-1">({line.estimate.account.account_name})</span>
                            )}
                          </span>
                          <span className="font-medium">{formatCurrency(line.line_amt || 0)}</span>
                        </div>
                        {line.estimate && (
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{formatShortDate(line.estimate.estimate_date)}</span>
                            <span>{line.estimate.status || 'Unknown'}</span>
                            {line.estimate.supabase_pdf_url && (
                              <a 
                                href={line.estimate.supabase_pdf_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View PDF
                              </a>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Text className="text-sm text-gray-500">No related estimates</Text>
                )}
              </div>
            </TabPanel>
            
            <TabPanel>
              <div className="mt-4">
                <Title>Vendor Payments</Title>
                {product.vendorPayments && product.vendorPayments.length > 0 ? (
                  <div className="overflow-x-auto mt-4">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Order</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {product.vendorPayments.map((payment, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatShortDate(payment.payment_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payment.account?.account_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {payment.purchaseOrder?.purchase_order_uid || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              {formatCurrency(payment.payment_amount || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Badge
                                variant={payment.status === 'paid' ? 'success' : payment.status === 'pending' ? 'warning' : 'secondary'}
                              >
                                {payment.status || 'Unknown'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 text-center rounded-md mt-4">
                    <Text className="text-gray-500">No vendor payments found for this product</Text>
                  </div>
                )}
              </div>
            </TabPanel>
            
            <TabPanel>
              <div className="mt-4">
                <Title>Documents</Title>
                <div className="space-y-4 mt-4">
                  <Card className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <Text className="font-medium">Product Documentation</Text>
                        <Text className="text-sm text-gray-500">Product specifications, manuals, and documentation</Text>
                      </div>
                      <ProductPDFActions 
                        productId={product.glide_row_id}
                        productName={product.display_name || product.vendor_product_name}
                        existingPdfUrl={product.supabase_pdf_url}
                        showAllActions={true}
                      />
                    </div>
                  </Card>
                  
                  {product.purchaseOrder && (
                    <Card className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <Text className="font-medium">Purchase Order #{product.purchaseOrder.purchase_order_uid}</Text>
                          <Text className="text-sm text-gray-500">
                            {formatShortDate(product.purchaseOrder.purchase_order_date)} | 
                            {product.purchaseOrder.account?.account_name || 'Unknown Vendor'}
                          </Text>
                        </div>
                        {product.purchaseOrder.supabase_pdf_url ? (
                          <a 
                            href={product.purchaseOrder.supabase_pdf_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            View PO
                          </a>
                        ) : (
                          <span className="text-sm text-gray-500">No PDF Available</span>
                        )}
                      </div>
                    </Card>
                  )}
                  
                  {(product.invoiceLines && product.invoiceLines.some(line => line.invoice?.supabase_pdf_url)) && (
                    <Card className="p-4">
                      <Text className="font-medium mb-4">Related Invoice Documents</Text>
                      <div className="space-y-2">
                        {product.invoiceLines
                          .filter(line => line.invoice?.supabase_pdf_url)
                          .map((line, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <Text className="text-sm">
                                Invoice #{line.invoice?.invoice_uid} | {formatShortDate(line.invoice?.invoice_date)}
                              </Text>
                              <a 
                                href={line.invoice?.supabase_pdf_url || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View PDF
                              </a>
                            </div>
                          ))
                        }
                      </div>
                    </Card>
                  )}
                  
                  {(product.estimateLines && product.estimateLines.some(line => line.estimate?.supabase_pdf_url)) && (
                    <Card className="p-4">
                      <Text className="font-medium mb-4">Related Estimate Documents</Text>
                      <div className="space-y-2">
                        {product.estimateLines
                          .filter(line => line.estimate?.supabase_pdf_url)
                          .map((line, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <Text className="text-sm">
                                Estimate #{line.estimate?.estimate_uid} | {formatShortDate(line.estimate?.estimate_date)}
                              </Text>
                              <a 
                                href={line.estimate?.supabase_pdf_url || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                View PDF
                              </a>
                            </div>
                          ))
                        }
                      </div>
                    </Card>
                  )}
                </div>
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
                      {product.purchaseOrder.purchase_order_date && (
                        <Text className="mt-2">Date: {formatDate(product.purchaseOrder.purchase_order_date)}</Text>
                      )}
                    </Card>
                    <Card decoration="left" decorationColor="indigo">
                      <Text>Payment Status</Text>
                      <Metric className="mt-1">{product.purchaseOrder.payment_status || 'N/A'}</Metric>
                      <div className="mt-2 flex justify-between">
                        <Text>Total: {formatCurrency(product.purchaseOrder.total_amount || 0)}</Text>
                        {product.purchaseOrder.balance !== undefined && (
                          <Text>Balance: {formatCurrency(product.purchaseOrder.balance)}</Text>
                        )}
                      </div>
                    </Card>
                  </Grid>
                  
                  {product.purchaseOrder.supabase_pdf_url && (
                    <div className="mt-6">
                      <a 
                        href={product.purchaseOrder.supabase_pdf_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex w-full justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View Purchase Order PDF
                      </a>
                    </div>
                  )}
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
