import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductFormData } from '@/types/products';
import { CrudDialogBase } from '@/components/common/crud/CrudDialogBase';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { useVendors } from '@/hooks/useVendors';
import { useCategories } from '@/hooks/useCategories';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils'; // Fixed import path

// Schema for product form validation
const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  vendorId: z.string().min(1, 'Vendor is required'),
  category: z.string().optional(),
  cost: z.coerce.number().min(0, 'Cost must be a non-negative number'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  purchaseDate: z.date().nullable().optional(),
  notes: z.string().optional(),
  isSample: z.boolean().optional(),
  isFronted: z.boolean().optional(),
  isMiscellaneous: z.boolean().optional(),
  frontedTerms: z.string().optional(),
  sampleUnits: z.coerce.number().optional(),
  purchaseOrderId: z.string().optional(),
});

interface ProductFormDialogProps {
  /**
   * Trigger element to open the dialog
   */
  trigger: React.ReactNode;
  
  /**
   * Product data for editing an existing product (omit for create)
   */
  product?: ProductFormData;
  
  /**
   * Callback function after successful submission
   */
  onSuccess?: () => void;
}

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  trigger,
  product,
  onSuccess,
}) => {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const isEditMode = !!product;
  
  // Load related data
  const { data: vendors } = useVendors();
  const { data: categories } = useCategories();
  const { data: purchaseOrders } = usePurchaseOrders({ 
    filters: { vendorId: '' } // Temporary disabled related PO fetch
  });
  
  // Initialize the form
  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || '',
      vendorId: product?.vendorId || '',
      category: product?.category || '',
      cost: product?.cost || 0,
      quantity: product?.quantity || 1,
      purchaseDate: product?.purchaseDate || null,
      notes: product?.notes || '',
      isSample: product?.isSample || false,
      isFronted: product?.isFronted || false,
      isMiscellaneous: product?.isMiscellaneous || false,
      frontedTerms: product?.frontedTerms || '',
      sampleUnits: product?.sampleUnits || 0,
      purchaseOrderId: product?.purchaseOrderId || '',
    },
  });
  
  // Watch for changes to specific fields to update conditional fields
  const isFronted = form.watch('isFronted');
  const isSample = form.watch('isSample');
  const vendorId = form.watch('vendorId');
  
  const handleSubmit = async (data: z.infer<typeof productFormSchema>) => {
    toast.info('Product form submission is not yet fully implemented');
    
    // Call the onSuccess callback if provided
    if (onSuccess) {
      onSuccess();
    }
    
    // Close the dialog
    setOpen(false);
  };

  return (
    <CrudDialogBase
      title={isEditMode ? 'Edit Product' : 'Add New Product'}
      description={isEditMode ? 'Update the product details.' : 'Add a new product to your inventory.'}
      open={open}
      setOpen={setOpen}
      trigger={trigger}
      onSubmit={form.handleSubmit(handleSubmit)}
    >
      <Form {...form}>
        <div className="grid gap-4 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vendors?.map((vendor) => (
                        <SelectItem key={vendor.glide_row_id} value={vendor.glide_row_id}>
                          {vendor.account_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Cost & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" step="1" placeholder="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Purchase Date */}
          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Purchase Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Purchase Order */}
          <FormField
            control={form.control}
            name="purchaseOrderId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Order</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a purchase order" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {purchaseOrders?.map((po) => (
                      <SelectItem key={po.glide_row_id} value={po.glide_row_id}>
                        PO #{po.po_uid} - {format(new Date(po.po_date), "MMM d, yyyy")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Checkboxes */}
          <div className="grid grid-cols-1 gap-3">
            <FormField
              control={form.control}
              name="isSample"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Sample</FormLabel>
                    <FormDescription>
                      This is a product sample
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isFronted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Fronted</FormLabel>
                    <FormDescription>
                      Product is fronted to customers
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isMiscellaneous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Miscellaneous</FormLabel>
                    <FormDescription>
                      Miscellaneous product item
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
          
          {/* Conditional Fields */}
          {isSample && (
            <FormField
              control={form.control}
              name="sampleUnits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Units Behind Sample</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={0} 
                      step={1} 
                      placeholder="0" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Number of units represented by this sample
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {isFronted && (
            <FormField
              control={form.control}
              name="frontedTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fronted Terms</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter terms for this fronted product" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Terms and conditions for fronting this product
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter notes about this product" 
                    className="resize-none"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </CrudDialogBase>
  );
};

export default ProductFormDialog;
