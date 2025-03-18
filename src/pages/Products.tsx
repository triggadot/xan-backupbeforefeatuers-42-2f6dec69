
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Tag, Package } from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import { Skeleton } from '@/components/ui/skeleton';

export type GlProduct = {
  id: string;
  glide_row_id: string;
  vendor_product_name?: string;
  new_product_name?: string;
  category?: string;
  cost?: number;
  total_qty_purchased?: number;
  product_purchase_date?: string;
  miscellaneous_items?: boolean;
  samples?: boolean;
  fronted?: boolean;
  product_image1?: string;
  created_at?: string;
  updated_at?: string;
  display_name?: string;
};

export default function Products() {
  const [products, setProducts] = useState<GlProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('gl_products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    const searchString = searchTerm.toLowerCase();
    const productName = (product.new_product_name || product.vendor_product_name || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    
    return productName.includes(searchString) || category.includes(searchString);
  });

  const getProductName = (product: GlProduct) => {
    return product.new_product_name || product.vendor_product_name || 'Unnamed Product';
  };

  const columns = [
    {
      id: 'name',
      header: 'Product Name',
      accessorKey: 'name',
      cell: (row: GlProduct) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>{getProductName(row)}</span>
        </div>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'category',
      cell: (row: GlProduct) => (
        row.category ? (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span>{row.category}</span>
          </div>
        ) : null
      ),
    },
    {
      id: 'cost',
      header: 'Cost',
      accessorKey: 'cost',
      cell: (row: GlProduct) => (
        row.cost != null ? (
          <span className="font-medium">${row.cost.toFixed(2)}</span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )
      ),
    },
    {
      id: 'quantity',
      header: 'Quantity',
      accessorKey: 'total_qty_purchased',
      cell: (row: GlProduct) => (
        row.total_qty_purchased != null ? (
          <span>{row.total_qty_purchased}</span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )
      ),
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      cell: (row: GlProduct) => {
        if (row.samples) return <Badge variant="secondary">Sample</Badge>;
        if (row.fronted) return <Badge variant="warning">Fronted</Badge>;
        if (row.miscellaneous_items) return <Badge variant="outline">Misc</Badge>;
        return <Badge variant="default">Regular</Badge>;
      },
    },
    {
      id: 'purchase_date',
      header: 'Purchase Date',
      accessorKey: 'product_purchase_date',
      cell: (row: GlProduct) => (
        row.product_purchase_date ? (
          <span>{new Date(row.product_purchase_date).toLocaleDateString()}</span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )
      ),
    },
  ];

  return (
    <>
      <Helmet>
        <title>Products | Billow Business Console</title>
      </Helmet>
      <div className="py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="sm:w-auto w-full">
              Add Product
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="p-4">
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <DataTable
            data={filteredProducts}
            columns={columns}
            searchPlaceholder="Search products..."
            createButtonLabel="Add Product"
          />
        )}
      </div>
    </>
  );
}
