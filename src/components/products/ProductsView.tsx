
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, Grid2x2, Table as TableIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card as TremorCard,
  List as TremorList,
  ListItem,
  Text,
  Metric,
  Grid,
  Title,
  Badge,
  Divider,
  Flex,
} from '@tremor/react';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency } from '@/utils/formatters';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types/product';

const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'list' | 'grid'>('table');
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Map the database response to our Product type
      const mappedProducts: Product[] = data.map((item) => ({
        id: item.id,
        name: item.new_product_name || item.vendor_product_name || 'Unnamed Product',
        sku: '',
        description: item.purchase_notes || '',
        category: item.category || 'Uncategorized',
        price: 0, // We don't have a selling price in the data
        cost: Number(item.cost) || 0,
        quantity: Number(item.total_qty_purchased) || 0,
        status: 'active', // Default status
        vendorId: item.rowid_accounts || '',
        vendorName: '',
        imageUrl: item.product_image1 || '',
        isSample: item.samples || false,
        isFronted: item.fronted || false,
        isMiscellaneous: item.miscellaneous_items || false,
        purchaseDate: item.product_purchase_date ? new Date(item.product_purchase_date) : null,
        frontedTerms: item.terms_for_fronted_product || '',
        totalUnitsBehindSample: Number(item.total_units_behind_sample) || 0,
        created_at: new Date(item.created_at).toISOString(),
        updated_at: new Date(item.updated_at).toISOString()
      }));
      
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderTableView = () => (
    <div className="border rounded-md overflow-hidden">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  {product.imageUrl && (
                    <img 
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  )}
                  <span>{product.name}</span>
                </div>
              </TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>{formatCurrency(product.cost)}</TableCell>
              <TableCell>{product.quantity}</TableCell>
              <TableCell>
                {product.isSample ? (
                  <Badge color="blue">Sample</Badge>
                ) : product.isFronted ? (
                  <Badge color="amber">Fronted</Badge>
                ) : product.isMiscellaneous ? (
                  <Badge color="gray">Misc</Badge>
                ) : (
                  <Badge color="green">Regular</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderListView = () => (
    <TremorList className="mt-2">
      {products.map((product) => (
        <ListItem key={product.id} className="border rounded-md mb-2 p-4 hover:bg-gray-50 transition-colors">
          <Flex>
            <div className="flex-grow">
              <Flex alignItems="center" className="space-x-2">
                {product.imageUrl && (
                  <img 
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                )}
                <Text className="font-semibold">{product.name}</Text>
              </Flex>
              <Text className="text-sm text-gray-500 mt-1">
                {product.category} • {product.quantity} units
              </Text>
              {product.description && (
                <Text className="text-sm mt-1">{product.description}</Text>
              )}
            </div>
            <div className="text-right">
              <Metric className="text-md">{formatCurrency(product.cost)}</Metric>
              <Badge color={
                product.isSample ? "blue" : 
                product.isFronted ? "amber" : 
                product.isMiscellaneous ? "gray" : "green"
              }>
                {product.isSample ? "Sample" : 
                 product.isFronted ? "Fronted" : 
                 product.isMiscellaneous ? "Misc" : "Regular"}
              </Badge>
            </div>
          </Flex>
        </ListItem>
      ))}
    </TremorList>
  );

  const renderGridView = () => (
    <Grid numItems={1} numItemsMd={2} numItemsLg={3} className="gap-4 mt-2">
      {products.map((product) => (
        <TremorCard key={product.id} className="hover:shadow-md transition-shadow">
          {product.imageUrl && (
            <img 
              src={product.imageUrl}
              alt={product.name}
              className="h-40 w-full object-cover rounded-t-md"
            />
          )}
          <div className="p-4">
            <Flex alignItems="start" justifyContent="between">
              <Text className="font-semibold truncate">{product.name}</Text>
              <Badge color={
                product.isSample ? "blue" : 
                product.isFronted ? "amber" : 
                product.isMiscellaneous ? "gray" : "green"
              }>
                {product.isSample ? "Sample" : 
                 product.isFronted ? "Fronted" : 
                 product.isMiscellaneous ? "Misc" : "Regular"}
              </Badge>
            </Flex>
            <Text className="text-sm text-gray-500">{product.category}</Text>
            <Divider className="my-2" />
            <Flex>
              <Text>Quantity</Text>
              <Text>{product.quantity}</Text>
            </Flex>
            <Flex className="mt-1">
              <Text>Cost</Text>
              <Metric className="text-md">{formatCurrency(product.cost)}</Metric>
            </Flex>
          </div>
        </TremorCard>
      ))}
    </Grid>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Products</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant={viewMode === 'table' ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Table
            </Button>
            <Button 
              variant={viewMode === 'list' ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
            <Button 
              variant={viewMode === 'grid' ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid2x2 className="h-4 w-4 mr-2" />
              Grid
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchProducts}
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No products found
            </div>
          ) : (
            <>
              {viewMode === 'table' && renderTableView()}
              {viewMode === 'list' && renderListView()}
              {viewMode === 'grid' && renderGridView()}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsView;
