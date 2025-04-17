import { ProductDetail } from '@/components/products';
import { ProductForm } from '@/components/products/product-form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Spinner } from '@/components/ui/spinner';
import { useProductDetail, useProductMutation } from '@/hooks/products';
import { toast } from '@/hooks/utils/use-toast';
import { Card, Tab, TabGroup, TabList, TabPanel, TabPanels } from '@tremor/react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Product Detail Page component
 * 
 * Displays detailed information about a specific product
 * Allows editing and deleting the product
 * 
 * @returns React component
 */
const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Only fetch product data if we're not on the "new" page
  const { 
    data: product, 
    isLoading, 
    error,
    refetch 
  } = useProductDetail(isNew ? undefined : id);

  const { deleteProduct } = useProductMutation();

  // If the ID is "new", set active tab to the form tab
  useEffect(() => {
    if (isNew) {
      setActiveTab(1); // Form tab
    }
  }, [isNew]);

  const handleGoBack = () => {
    navigate('/products');
  };

  const handleDelete = async () => {
    if (!product) return;
    
    try {
      await deleteProduct.mutateAsync(product.glide_row_id);
      toast.success('Product deleted successfully');
      navigate('/products');
    } catch (error) {
      toast.error(`Error deleting product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setIsDeleteDialogOpen(false);
  };

  const handleEditSuccess = () => {
    setActiveTab(0); // Switch back to details tab
    if (!isNew) {
      refetch(); // Refresh data
    } else {
      navigate('/products'); // Go back to products list for new products
    }
  };

  // Prepare vendors list for the form
  const vendors = product?.vendor 
    ? [{ id: product.vendor.glide_row_id, name: product.vendor.account_name || 'Unknown Vendor' }] 
    : [];

  // Prepare purchase orders list for the form
  const purchaseOrders = product?.purchaseOrder
    ? [{ id: product.purchaseOrder.glide_row_id, uid: product.purchaseOrder.po_uid || 'PO-' + product.purchaseOrder.id.substring(0, 8) }]
    : [];

  if (isLoading && !isNew) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !isNew) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Error"
          description="Failed to load product details"
          actions={
            <Button onClick={handleGoBack}>
              Back to Products
            </Button>
          }
        />
        <Card className="mt-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title={isNew ? "New Product" : product?.display_name || "Product Details"}
        description={isNew ? "Create a new product" : "View and manage product details"}
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleGoBack}>
              Back to Products
            </Button>
            {!isNew && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab(1)}
                >
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        }
      />

      <TabGroup index={activeTab} onIndexChange={setActiveTab}>
        <TabList className="mb-8">
          <Tab disabled={isNew}>Details</Tab>
          <Tab>{isNew ? "Create Product" : "Edit Product"}</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            {product && <ProductDetail product={product} />}
          </TabPanel>
          
          <TabPanel>
            <ProductForm
              product={isNew ? undefined : product}
              vendors={vendors}
              purchaseOrders={purchaseOrders}
              onSuccess={handleEditSuccess}
              onCancel={() => isNew ? handleGoBack() : setActiveTab(0)}
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductDetailPage;
