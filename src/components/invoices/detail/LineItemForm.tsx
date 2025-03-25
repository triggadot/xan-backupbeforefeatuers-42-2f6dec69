
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { InvoiceLineItem } from '@/types/invoice';

interface LineItemFormProps {
  lineItem?: InvoiceLineItem;
  onSubmit: (data: Partial<InvoiceLineItem>) => Promise<void>;
  onCancel: () => void;
}

const formSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, { message: 'Description is required' }),
  quantity: z.coerce.number().min(0.01, { message: 'Quantity must be greater than 0' }),
  unitPrice: z.coerce.number().min(0, { message: 'Unit price must be 0 or greater' }),
  notes: z.string().optional(),
});

export function LineItemForm({ lineItem, onSubmit, onCancel }: LineItemFormProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: lineItem?.productId || '',
      description: lineItem?.description || '',
      quantity: lineItem?.quantity || 1,
      unitPrice: lineItem?.unitPrice || 0,
      notes: lineItem?.notes || '',
    },
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('gl_products')
          .select('id, glide_row_id, display_name, vendor_product_name, cost')
          .order('display_name', { ascending: true });
          
        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: 'Error',
          description: 'Failed to load products.',
          variant: 'destructive',
        });
      }
    };

    fetchProducts();
  }, [toast]);

  const handleProductChange = (productId: string) => {
    if (productId === 'none') {
      // Handle "No product selected" option
      form.setValue('productId', '');
      return;
    }
    
    const product = products.find(p => p.glide_row_id === productId);
    if (product) {
      form.setValue('productId', product.glide_row_id);
      form.setValue('description', product.display_name || product.vendor_product_name);
      form.setValue('unitPrice', product.cost || 0);
    }
  };

  const calculateTotal = () => {
    const quantity = form.watch('quantity') || 0;
    const unitPrice = form.watch('unitPrice') || 0;
    return (quantity * unitPrice).toFixed(2);
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const lineItemData = {
        productId: values.productId,
        description: values.description,
        quantity: values.quantity,
        unitPrice: values.unitPrice,
        total: Number(values.quantity) * Number(values.unitPrice),
        notes: values.notes,
      };
      
      await onSubmit(lineItemData);
    } catch (error) {
      console.error('Error submitting line item:', error);
      toast({
        title: 'Error',
        description: 'Failed to save line item.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <Select
                value={field.value || 'none'}
                onValueChange={(value) => {
                  field.onChange(value === 'none' ? '' : value);
                  handleProductChange(value);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">-- No product selected --</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.glide_row_id} value={product.glide_row_id}>
                      {product.display_name || product.vendor_product_name}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0.01" 
                    step="0.01" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      form.trigger(['quantity', 'unitPrice']);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Price</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      form.trigger(['quantity', 'unitPrice']);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="p-4 bg-muted rounded-md">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total:</span>
            <span className="text-lg font-bold">${calculateTotal()}</span>
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : lineItem ? 'Update' : 'Add'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
