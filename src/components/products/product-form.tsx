import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product, ProductFormData } from '@/types/products';
import { useProductMutation } from '@/hooks/products';
import { Card, Title, Grid, Col } from '@tremor/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/utils/use-toast';

// Define validation schema using Zod
const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  vendorId: z.string().min(1, 'Vendor is required'),
  category: z.string().optional(),
  cost: z.coerce.number().min(0, 'Cost must be a positive number'),
  quantity: z.coerce.number().min(0, 'Quantity must be a positive number'),
  purchaseDate: z.date().nullable().optional(),
  notes: z.string().optional(),
  isSample: z.boolean().optional(),
  isFronted: z.boolean().optional(),
  isMiscellaneous: z.boolean().optional(),
  frontedTerms: z.string().optional(),
  sampleUnits: z.coerce.number().optional(),
  purchaseOrderId: z.string().optional(),
});

interface ProductFormProps {
  product?: Product;
  vendors: { id: string; name: string }[];
  purchaseOrders?: { id: string; uid: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Form component for creating and editing products
 * 
 * @param product - Optional product data for editing existing product
 * @param vendors - List of vendors to select from
 * @param purchaseOrders - Optional list of purchase orders to associate with
 * @param onSuccess - Callback function called after successful submission
 * @param onCancel - Callback function called when form is cancelled
 */
export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  vendors,
  purchaseOrders,
  onSuccess,
  onCancel,
}) => {
  const { createProduct, updateProduct } = useProductMutation();
  const { toast } = useToast();
  
  const defaultValues: Partial<ProductFormData> = {
    name: product?.display_name || '',
    vendorId: product?.rowid_accounts || '',
    category: product?.category || '',
    cost: product?.cost || 0,
    quantity: product?.total_qty_purchased || 0,
    purchaseDate: product?.product_purchase_date ? new Date(product.product_purchase_date) : null,
    notes: product?.purchase_notes || '',
    isSample: product?.samples || false,
    isFronted: product?.fronted || false,
    isMiscellaneous: product?.miscellaneous_items || false,
    frontedTerms: product?.terms_for_fronted_product || '',
    sampleUnits: product?.total_units_behind_sample || 0,
    purchaseOrderId: product?.rowid_purchase_orders || '',
  };

  const { 
    control, 
    handleSubmit, 
    watch,
    formState: { errors, isSubmitting } 
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const isSample = watch('isSample');
  const isFronted = watch('isFronted');

  const onSubmit = async (data: ProductFormData) => {
    try {
      if (product) {
        // Update existing product
        await updateProduct.mutateAsync({
          id: product.glide_row_id,
          data: {
            ...data,
            // Map form fields to database fields
            display_name: data.name,
            total_qty_purchased: data.quantity,
            rowid_accounts: data.vendorId,
            product_purchase_date: data.purchaseDate,
            purchase_notes: data.notes,
            samples: data.isSample,
            fronted: data.isFronted,
            miscellaneous_items: data.isMiscellaneous,
            terms_for_fronted_product: data.frontedTerms,
            total_units_behind_sample: data.sampleUnits,
            rowid_purchase_orders: data.purchaseOrderId,
          },
        });
        toast({
          title: "Success",
          description: "Product updated successfully",
          variant: "default",
        });
      } else {
        // Create new product
        await createProduct.mutateAsync({
          ...data,
          // Map form fields to database fields
          display_name: data.name,
          total_qty_purchased: data.quantity,
          rowid_accounts: data.vendorId,
          product_purchase_date: data.purchaseDate,
          purchase_notes: data.notes,
          samples: data.isSample,
          fronted: data.isFronted,
          miscellaneous_items: data.isMiscellaneous,
          terms_for_fronted_product: data.frontedTerms,
          total_units_behind_sample: data.sampleUnits,
          rowid_purchase_orders: data.purchaseOrderId,
        });
        toast({
          title: "Success",
          description: "Product created successfully",
          variant: "default",
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <Title className="mb-6">{product ? 'Edit Product' : 'Create New Product'}</Title>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid numItemsMd={2} className="gap-6 mb-6">
          <Col>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name*</Label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="name" 
                      placeholder="Enter product name" 
                      {...field} 
                    />
                  )}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="vendorId">Vendor*</Label>
                <Controller
                  name="vendorId"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.vendorId && (
                  <p className="text-sm text-red-500 mt-1">{errors.vendorId.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="category" 
                      placeholder="Enter category" 
                      {...field} 
                      value={field.value || ''}
                    />
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost">Cost*</Label>
                  <Controller
                    name="cost"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="cost" 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    )}
                  />
                  {errors.cost && (
                    <p className="text-sm text-red-500 mt-1">{errors.cost.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="quantity">Quantity*</Label>
                  <Controller
                    name="quantity"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        id="quantity" 
                        type="number" 
                        min="0" 
                        placeholder="0" 
                        {...field} 
                      />
                    )}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Controller
                  name="purchaseDate"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="purchaseDate" 
                      type="date" 
                      {...field} 
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                    />
                  )}
                />
              </div>
            </div>
          </Col>
          
          <Col>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Purchase Notes</Label>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <Textarea 
                      id="notes" 
                      placeholder="Enter purchase notes" 
                      rows={4} 
                      {...field} 
                      value={field.value || ''}
                    />
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="isSample"
                    control={control}
                    render={({ field }) => (
                      <Checkbox 
                        id="isSample" 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="isSample">This is a sample product</Label>
                </div>
                
                {isSample && (
                  <div className="ml-6">
                    <Label htmlFor="sampleUnits">Units Behind Sample</Label>
                    <Controller
                      name="sampleUnits"
                      control={control}
                      render={({ field }) => (
                        <Input 
                          id="sampleUnits" 
                          type="number" 
                          min="0" 
                          placeholder="0" 
                          {...field} 
                          value={field.value || ''}
                        />
                      )}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="isFronted"
                    control={control}
                    render={({ field }) => (
                      <Checkbox 
                        id="isFronted" 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor="isFronted">This is a fronted product</Label>
                </div>
                
                {isFronted && (
                  <div className="ml-6">
                    <Label htmlFor="frontedTerms">Terms for Fronted Product</Label>
                    <Controller
                      name="frontedTerms"
                      control={control}
                      render={({ field }) => (
                        <Textarea 
                          id="frontedTerms" 
                          placeholder="Enter terms" 
                          rows={2} 
                          {...field} 
                          value={field.value || ''}
                        />
                      )}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Controller
                  name="isMiscellaneous"
                  control={control}
                  render={({ field }) => (
                    <Checkbox 
                      id="isMiscellaneous" 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="isMiscellaneous">This is a miscellaneous item</Label>
              </div>
              
              {purchaseOrders && purchaseOrders.length > 0 && (
                <div>
                  <Label htmlFor="purchaseOrderId">Purchase Order</Label>
                  <Controller
                    name="purchaseOrderId"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a purchase order" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {purchaseOrders.map((po) => (
                            <SelectItem key={po.id} value={po.id}>
                              {po.uid}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
            </div>
          </Col>
        </Grid>
        
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ProductForm;
