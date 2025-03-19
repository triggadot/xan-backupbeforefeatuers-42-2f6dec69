
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EstimateLine } from '@/types/estimate';

interface EstimateLineFormProps {
  estimateLine?: EstimateLine;
  onSubmit: (data: Partial<EstimateLine>) => void;
  onCancel: () => void;
}

const EstimateLineForm: React.FC<EstimateLineFormProps> = ({
  estimateLine,
  onSubmit,
  onCancel
}) => {
  const form = useForm<Partial<EstimateLine>>({
    defaultValues: {
      sale_product_name: estimateLine?.sale_product_name || '',
      qty_sold: estimateLine?.qty_sold || 1,
      selling_price: estimateLine?.selling_price || 0,
      product_sale_note: estimateLine?.product_sale_note || '',
    }
  });

  const handleSubmit = (data: Partial<EstimateLine>) => {
    // Make sure numbers are actually numbers and not strings
    const formattedData = {
      ...data,
      qty_sold: Number(data.qty_sold),
      selling_price: Number(data.selling_price),
    };
    
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="sale_product_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product/Service Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter product or service name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="qty_sold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min="1" 
                    step="1"
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="selling_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min="0" 
                    step="0.01"
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="product_sale_note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Enter notes about this item" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {estimateLine ? 'Update Item' : 'Add Item'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EstimateLineForm;
