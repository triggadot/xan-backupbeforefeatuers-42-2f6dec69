import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductsTableWrapper from '@/components/feature/product/ProductsTableWrapper';
import ProductDialog from '@/components/feature/product/ProductDialog';
import ProductDetails from '@/components/feature/product/ProductDetails';
import { LoadingState } from '@/components/sync/ui/StateDisplay';
import { Product } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';

const Products: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  
  const { toast } = useToast();
  const { 
    products, 
    isLoading, 
    error, 
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  } = useProducts();

  const handleRefresh = () => {
    fetchProducts();
  };

  const handleCreateProduct = async (productData: Record<string, unknown>) => {
    try {
      // Extract the product data and transform it to match our Product interface
      const result = await createProduct({
        name: productData.new_product_name as string,
        vendorId: productData.rowid_accounts as string,
        cost: Number(productData.cost || 0),
        quantity: Number(productData.total_qty_purchased || 0),
        category: productData.category as string || 'Flower', // Default to Flower
        description: productData.purchase_notes as string,
        imageUrl: productData.product_image1 as string,
        isSample: Boolean(productData.samples),
        isFronted: Boolean(productData.fronted),
        isMiscellaneous: Boolean(productData.miscellaneous_items),
        purchaseDate: productData.product_purchase_date ? new Date(productData.product_purchase_date as string) : null,
        frontedTerms: productData.terms_for_fronted_product as string,
        totalUnitsBehindSample: productData.samples ? Number(productData.total_units_behind_sample || 0) : undefined
      });
      
      if (result) {
        setIsCreateDialogOpen(false);
        toast({
          title: 'Success',
          description: 'Product created and purchase order generated.',
        });
      }
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
      // Extract the product data and transform it to match our Product interface
      const result = await updateProduct(currentProduct.id, {
        name: productData.new_product_name as string,
        vendorId: productData.rowid_accounts as string,
        cost: Number(productData.cost || 0),
        quantity: Number(productData.total_qty_purchased || 0),
        category: productData.category as string || 'Flower', // Default to Flower
        description: productData.purchase_notes as string,
        imageUrl: productData.product_image1 as string,
        isSample: Boolean(productData.samples),
        isFronted: Boolean(productData.fronted),
        isMiscellaneous: Boolean(productData.miscellaneous_items),
        purchaseDate: productData.product_purchase_date ? new Date(productData.product_purchase_date as string) : null,
        frontedTerms: productData.terms_for_fronted_product as string,
        totalUnitsBehindSample: productData.samples ? Number(productData.total_units_behind_sample || 0) : undefined
      });
      
      if (result) {
        setIsEditDialogOpen(false);
        setCurrentProduct(null);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (confirm(`Are you sure you want to delete ${product.name || 'this product'}?`)) {
      try {
        await deleteProduct(product.id);
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

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsEditDialogOpen(true);
  };
  
  const handleViewDetails = (product: Product) => {
    setCurrentProduct(product);
    setIsDetailsDialogOpen(true);
  };

  const handleAddProduct = () => {
    setCurrentProduct(null);
    setIsCreateDialogOpen(true);
  };

  // Filter products based on search term
  const filteredProducts = searchTerm
    ? products.filter((product: Product) => {
        const searchFields = [
          product.name,
          product.category,
          product.description,
          product.vendorName
        ].filter(Boolean);
        
        return searchFields.some(field => 
          field?.toLowerCase().includes(searchTerm.toLowerCase())
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
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh products"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          
          <Button 
            onClick={handleAddProduct}
            className="gap-1"
          >
            <Plus size={18} />
            New Product
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <LoadingState />
      ) : (
        <ProductsTableWrapper 
          products={filteredProducts} 
          onEdit={handleEdit} 
          onDelete={handleDeleteProduct}
          onViewDetails={handleViewDetails}
          onAdd={handleAddProduct}
        />
      )}

      {/* Create Product Dialog */}
      <ProductDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateProduct}
        title="Create New Product"
      />

      {/* Edit Product Dialog */}
      <ProductDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateProduct}
        title="Edit Product"
        product={currentProduct?.rawData}
      />
      
      {/* Product Details Dialog */}
      <ProductDetails
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        product={currentProduct?.rawData}
        onEdit={() => currentProduct && handleEdit(currentProduct)}
      />
    </div>
  );
};

export default Products;
