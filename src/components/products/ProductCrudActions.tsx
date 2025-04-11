import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Product } from '@/types/products';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus } from 'lucide-react';
import ProductFormDialog from './ProductFormDialog';
import { DeleteConfirmationDialog } from '@/components/common/crud/DeleteConfirmationDialog';

interface ProductCrudActionsProps {
  /**
   * The product data (undefined for creating new product)
   */
  product?: Product;
  
  /**
   * Mode for displaying actions
   */
  mode?: 'row' | 'detail' | 'toolbar';
  
  /**
   * Callback after successful operation
   */
  onActionComplete?: () => void;
  
  /**
   * Whether to hide specific actions
   */
  hideActions?: {
    add?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
}

export const ProductCrudActions: React.FC<ProductCrudActionsProps> = ({
  product,
  mode = 'row',
  onActionComplete,
  hideActions = {},
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  
  // Configure button sizes and display based on mode
  const buttonConfig = {
    row: {
      size: 'sm' as const,
      variant: 'ghost' as const,
      className: 'h-8 w-8 p-0',
      showLabels: false
    },
    detail: {
      size: 'default' as const,
      variant: 'outline' as const, 
      className: '',
      showLabels: true
    },
    toolbar: {
      size: 'sm' as const,
      variant: 'outline' as const,
      className: '',
      showLabels: true
    }
  };
  
  const config = buttonConfig[mode];
  
  const handleDelete = async () => {
    if (!product?.glide_row_id) return;
    
    try {
      setIsDeleting(true);
      
      // Check if product is used in invoices, estimates, or purchase orders before deleting
      const { data: relatedItems, error: checkError } = await supabase
        .rpc('gl_check_product_relationships', { 
          product_id: product.glide_row_id 
        });
        
      if (checkError) {
        throw new Error(checkError.message);
      }
      
      // If product is in use, prevent deletion
      if (relatedItems && relatedItems.in_use) {
        toast.error(
          "Cannot delete this product as it's currently in use in " + 
          relatedItems.message
        );
        setIsDeleteDialogOpen(false);
        return;
      }
      
      // Proceed with deletion
      const { error: deleteError } = await supabase
        .from('gl_products')
        .delete()
        .eq('glide_row_id', product.glide_row_id);
        
      if (deleteError) {
        throw new Error(deleteError.message);
      }
      
      toast.success('Product deleted successfully');
      
      // Invalidate related queries
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['dashboard-metrics']);
      
      // Call the onActionComplete callback if provided
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(`Failed to delete product: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Format product data for the edit form
  const productFormData = product ? {
    glide_row_id: product.glide_row_id,
    name: product.display_name || product.vendor_product_name || '',
    vendorId: product.rowid_accounts || '',
    category: product.category || '',
    cost: product.cost || 0,
    quantity: product.total_qty_purchased || 0,
    purchaseDate: product.product_purchase_date ? new Date(product.product_purchase_date) : null,
    notes: product.purchase_notes || '',
    isSample: product.samples || false,
    isFronted: product.fronted || false,
    isMiscellaneous: product.miscellaneous_items || false,
    frontedTerms: product.terms_for_fronted_product || '',
    sampleUnits: product.total_units_behind_sample || 0,
    purchaseOrderId: product.rowid_purchase_orders || '',
  } : undefined;
  
  return (
    <div className={`flex ${mode === 'row' ? 'justify-end gap-1' : 'gap-2'}`}>
      {/* Add Product Button */}
      {!hideActions.add && !product && (
        <ProductFormDialog
          trigger={
            <Button
              variant={config.variant}
              size={config.size}
              className={config.className}
            >
              <Plus className={`h-4 w-4 ${config.showLabels ? 'mr-2' : ''}`} />
              {config.showLabels && 'Add Product'}
            </Button>
          }
          onSuccess={onActionComplete}
        />
      )}
      
      {/* Edit Product Button */}
      {!hideActions.edit && product && (
        <ProductFormDialog
          product={productFormData}
          trigger={
            <Button
              variant={config.variant}
              size={config.size}
              className={config.className}
            >
              <Edit className={`h-4 w-4 ${config.showLabels ? 'mr-2' : ''}`} />
              {config.showLabels && 'Edit'}
            </Button>
          }
          onSuccess={onActionComplete}
        />
      )}
      
      {/* Delete Product Button */}
      {!hideActions.delete && product && (
        <>
          <Button
            variant={config.variant}
            size={config.size}
            className={`${config.className} ${mode === 'row' ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-red-500 hover:text-red-50 hover:bg-red-600 hover:border-red-600'}`}
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className={`h-4 w-4 ${config.showLabels ? 'mr-2' : ''}`} />
            {config.showLabels && 'Delete'}
          </Button>
          
          <DeleteConfirmationDialog
            title="Product"
            entityName={product.display_name || product.vendor_product_name || 'Unnamed Product'}
            entityType="product"
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirmDelete={handleDelete}
            isDeleting={isDeleting}
            consequenceMessage="This will permanently delete the product and its associated data."
          />
        </>
      )}
    </div>
  );
};

export default ProductCrudActions;
