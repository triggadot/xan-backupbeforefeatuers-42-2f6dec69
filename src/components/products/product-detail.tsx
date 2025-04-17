import React from 'react';
import { Card, Grid, Col, Title, Text, Tab, TabGroup, TabList, TabPanel, TabPanels, Metric, Bold, Divider } from '@tremor/react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate, formatShortDate } from '@/utils/format';
import { Product as ProductDetailType } from '@/types/products/product-types';
import { ProductPDFActions } from '@/components/products/ProductPDFActions';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@tremor/react';
import { toast } from 'sonner';
import { Edit, Trash2 } from 'lucide-react';

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

  const totalValue = (product.price || 0) * (product.quantity || 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title>Product Details</Title>
        <div className="flex space-x-2">
          {/* Edit Button */}
          <Button
            variant="outline"
            onClick={() => {
              toast.info('Product form editing is not yet implemented');
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          
          {/* Delete Button */}
          <Button
            variant="outline"
            className="text-red-500 hover:text-red-50 hover:bg-red-600 hover:border-red-600"
            onClick={() => {
              toast.info('Product deletion functionality is not yet implemented');
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          
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
        <Card>
          <Title>Product Stock</Title>
          <Text>Stock information coming soon</Text>
        </Card>
        
        <Card>
          <Title>Product Finance</Title>
          <Text>Financial data coming soon</Text>
        </Card>
      </div>

      <Card>
        <TabGroup>
          <TabList>
            <Tab>Related Invoices ({product.invoiceLines?.length || 0})</Tab>
            <Tab>Related Estimates ({product.estimateLines?.length || 0})</Tab>
            {product.purchaseOrder && <Tab>Purchase Order</Tab>}
            <Tab>Vendor Payments</Tab>
            <Tab>Documents</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              {!product.invoiceLines || product.invoiceLines.length === 0 ? (
                <div className="text-center py-4">
                  <Text>No invoices found for this product</Text>
                </div>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Invoice Date</TableHeaderCell>
                      <TableHeaderCell>Customer</TableHeaderCell>
                      <TableHeaderCell>Quantity</TableHeaderCell>
                      <TableHeaderCell>Price</TableHeaderCell>
                      <TableHeaderCell>Total</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {product.invoiceLines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{formatShortDate(line.date_of_sale || '')}</TableCell>
                        <TableCell>{line.customerName || 'N/A'}</TableCell>
                        <TableCell>{line.qty_sold}</TableCell>
                        <TableCell>{formatCurrency(line.selling_price)}</TableCell>
                        <TableCell>{formatCurrency(line.line_total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabPanel>
            
            <TabPanel>
              {!product.estimateLines || product.estimateLines.length === 0 ? (
                <div className="text-center py-4">
                  <Text>No estimates found for this product</Text>
                </div>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Estimate Date</TableHeaderCell>
                      <TableHeaderCell>Customer</TableHeaderCell>
                      <TableHeaderCell>Quantity</TableHeaderCell>
                      <TableHeaderCell>Price</TableHeaderCell>
                      <TableHeaderCell>Total</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {product.estimateLines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{formatShortDate(line.date_of_sale || '')}</TableCell>
                        <TableCell>{line.customerName || 'N/A'}</TableCell>
                        <TableCell>{line.qty_sold}</TableCell>
                        <TableCell>{formatCurrency(line.selling_price)}</TableCell>
                        <TableCell>{formatCurrency(line.line_total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabPanel>
            
            {product.purchaseOrder && (
              <TabPanel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Text className="font-medium">Purchase Order Details</Text>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <Text className="text-gray-500">Date:</Text>
                        <Text>{formatDate(product.purchaseOrder.date || '')}</Text>
                      </div>
                      <div className="flex justify-between">
                        <Text className="text-gray-500">Status:</Text>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                          {product.purchaseOrder.status || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <Text className="text-gray-500">Total Amount:</Text>
                        <Text>{formatCurrency(product.purchaseOrder.total_amount || 0)}</Text>
                      </div>
                    </div>
                  </div>
                </div>
              </TabPanel>
            )}
            
            <TabPanel>
              {!product.vendorPayments || product.vendorPayments.length === 0 ? (
                <div className="text-center py-4">
                  <Text>No vendor payments found for this product</Text>
                </div>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Date</TableHeaderCell>
                      <TableHeaderCell>Amount</TableHeaderCell>
                      <TableHeaderCell>Type</TableHeaderCell>
                      <TableHeaderCell>Note</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {product.vendorPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatShortDate(payment.date_of_payment || '')}</TableCell>
                        <TableCell>{formatCurrency(payment.payment_amount || 0)}</TableCell>
                        <TableCell>{payment.payment_type || 'N/A'}</TableCell>
                        <TableCell>{payment.vendor_note || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabPanel>
            
            <TabPanel>
              <div className="text-center py-4">
                <Text>Product documentation coming soon</Text>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </Card>
    </div>
  );
};

export default ProductDetail;
