
import React, { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Estimate } from '@/types/estimate';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';

interface EstimateFormProps {
  estimate?: Partial<Estimate>;
  onSubmit: (data: Partial<Estimate>) => void;
  onCancel: () => void;
}

interface CustomerOption {
  id: string;
  glide_row_id: string;
  account_name: string;
}

const EstimateForm: React.FC<EstimateFormProps> = ({
  estimate,
  onSubmit,
  onCancel
}) => {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  const form = useForm<Partial<Estimate>>({
    defaultValues: {
      rowid_accounts: estimate?.rowid_accounts || '',
      estimate_date: estimate?.estimate_date 
        ? new Date(estimate.estimate_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      add_note: estimate?.add_note || false,
      is_a_sample: estimate?.is_a_sample || false
    }
  });

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoadingCustomers(true);
      try {
        const { data, error } = await supabase
          .from('gl_accounts')
          .select('id, glide_row_id, account_name')
          .order('account_name');
        
        if (error) throw error;
        
        setCustomers(data || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleSubmit = (data: Partial<Estimate>) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="rowid_accounts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              {isLoadingCustomers ? (
                <div className="flex items-center justify-center py-2">
                  <Spinner size="sm" />
                </div>
              ) : (
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.glide_row_id}>
                        {customer.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="estimate_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimate Date</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="add_note"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Add Note</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Include notes with this estimate
                  </p>
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="is_a_sample"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Sample</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Mark as sample estimate
                  </p>
                </div>
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {estimate && estimate.id ? 'Update Estimate' : 'Create Estimate'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EstimateForm;
