import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductsTableWrapper from '@/components/feature/product/ProductsTableWrapper';
import ProductDialog from '@/components/feature/product/ProductDialog';
import ProductDetails from '@/components/feature/product/ProductDetails';
import { useTableData } from '@/hooks/useTableData';
import { useToast } from '@/hooks/use-toast';
import { LoadingState } from '@/components/sync/LoadingState';
import { Product } from '@/types';

const Products: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  
  const { toast } = useToast();
  const { 
    data: rawProducts, 
    isLoading: isLoadingProducts, 
    error, 
    fetchData: refreshProducts,
    createRecord,
    updateRecord,
    deleteRecord
  } = useTableData('gl_products');

  const products = React.useMemo(() => {
    return (rawProducts || []).map((product: any): Product => ({
      id: product.id,
      name: product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product',
      sku: product.glide_row_id || '',
      description: product.purchase_notes || '',
      price: 0,
      cost: product.cost || 0,
      quantity: product.total_qty_purchased || 0,
      category: product.category || '',
      status: 'active',
      imageUrl: product.product_image1 || '',
      createdAt: new Date(product.created_at || Date.now()),
      updatedAt: new Date(product.updated_at || Date.now())
    }));
  }, [rawProducts]);

  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  const handleRefresh = async () => {
    setIsLoading(true);
    await refreshProducts();
    setIsLoading(false);
  };

  const handleCreateProduct = async (productData: Record<string, unknown>) => {
    try {
      await createRecord(productData);
      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to create product',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateProduct = async (productData: Record<string, unknown>) => {
    if (!currentProduct?.id) return;
    
    try {
      await updateRecord(currentProduct.id, productData);
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
      setIsEditDialogOpen(false);
      setCurrentProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProduct = async (product: any) => {
    if (confirm(`Are you sure you want to delete ${product.display_name || 'this product'}?`)) {
      try {
        await deleteRecord(product.id);
        toast({
          title: 'Success',
          description: 'Product deleted successfully',
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete product',
          variant: 'destructive',
        });
      }
    }
  };

  const handleEdit = (product: any) => {
    setCurrentProduct(product);
    setIsEditDialogOpen(true);
  };
  
  const handleViewDetails = (product: any) => {
    setCurrentProduct(product);
    setIsDetailsDialogOpen(true);
  };

  const filteredProducts = searchTerm
    ? products.filter((product: Product) => {
        const searchFields = [
          product.name,
          product.category,
          product.description
        ].filter(Boolean);
        
        return searchFields.some(field => 
          field.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : products;

  if (error) {
    return (
      <div className="container py-6 max-w-7xl">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <p>Error loading products: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 w-full sm:w-64"
            />
          </div>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              setIsLoading(true);
              refreshProducts().finally(() => setIsLoading(false));
            }}
            disabled={isLoading || isLoadingProducts}
            title="Refresh products"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="gap-1"
          >
            <Plus size={18} />
            New Product
          </Button>
        </div>
      </div>
      
      {isLoadingProducts ? (
        <LoadingState />
      ) : (
        <ProductsTableWrapper 
          products={filteredProducts} 
          onEdit={handleEdit} 
          onDelete={handleDeleteProduct}
          onViewDetails={handleViewDetails}
        />
      )}

      <ProductDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateProduct}
        title="Create New Product"
      />

      <ProductDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateProduct}
        title="Edit Product"
        product={currentProduct}
      />
      
      <ProductDetails
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        product={currentProduct}
        onEdit={handleEdit}
      />
    </div>
  );
};

export default Products;
