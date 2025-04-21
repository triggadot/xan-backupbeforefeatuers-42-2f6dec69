import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { ApprovalQueueItem } from '@/hooks/telegram/useProductApprovalQueue';
import { NewProductData } from '@/types/telegram/product-matching';

// Schema for product creation validation
const productSchema = z.object({
  product_name: z.string().min(2, { message: "Product name is required" }),
  vendor_id: z.string().optional(),
  purchase_date: z.date().optional(),
  purchase_order_id: z.string().optional(),
  product_code: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.preprocess(
    (value) => (value === '' ? undefined : Number(value)),
    z.number().min(0).optional()
  ),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductCreationFormProps {
  queueItem: ApprovalQueueItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (queueId: string, productData: NewProductData) => void;
  isSubmitting?: boolean;
}

export const ProductCreationForm: React.FC<ProductCreationFormProps> = ({
  queueItem,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product_name: queueItem?.suggested_product_name || '',
      vendor_id: queueItem?.suggested_vendor_uid || '',
      purchase_date: queueItem?.suggested_purchase_date ? new Date(queueItem.suggested_purchase_date) : undefined,
      purchase_order_id: queueItem?.suggested_purchase_order_uid || '',
      product_code: '',
      description: '',
      category: '',
      price: undefined,
    },
  });

  // Reset form when queue item changes
  React.useEffect(() => {
    if (queueItem) {
      form.reset({
        product_name: queueItem.suggested_product_name || '',
        vendor_id: queueItem.suggested_vendor_uid || '',
        purchase_date: queueItem.suggested_purchase_date ? new Date(queueItem.suggested_purchase_date) : undefined,
        purchase_order_id: queueItem.suggested_purchase_order_uid || '',
        product_code: '',
        description: '',
        category: '',
        price: undefined,
      });
    }
  }, [queueItem, form]);

  const handleSubmit = (values: ProductFormValues) => {
    if (!queueItem) return;
    
    const productData: NewProductData = {
      product_name: values.product_name,
      vendor_id: values.vendor_id,
      purchase_date: values.purchase_date ? format(values.purchase_date, 'yyyy-MM-dd') : undefined,
      purchase_order_id: values.purchase_order_id,
      product_code: values.product_code,
      description: values.description,
      category: values.category,
      price: values.price,
    };
    
    onSubmit(queueItem.id, productData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
          <DialogDescription>
            Create a new product from the media message
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {queueItem?.message_details?.public_url && (
            <div className="aspect-video w-full max-h-40 rounded-md overflow-hidden bg-muted">
              <img 
                src={queueItem.message_details.public_url} 
                alt="Product image"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="product_name"
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vendor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor</FormLabel>
                      <FormControl>
                        <Input placeholder="Vendor name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="purchase_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Purchase Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={"w-full pl-3 text-left font-normal"}
                            >
                              {field.value ? (
                                format(field.value, "PP")
                              ) : (
                                <span className="text-muted-foreground">Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
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
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="product_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Code</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU or code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="purchase_order_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Order #</FormLabel>
                    <FormControl>
                      <Input placeholder="PO number" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="Product category" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Product description" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Product"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
