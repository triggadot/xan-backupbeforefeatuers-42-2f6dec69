
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { CustomerCredit } from '@/types/estimate';

interface CustomerCreditFormProps {
  credit?: CustomerCredit;
  onSubmit: (data: Partial<CustomerCredit>) => void;
  onCancel: () => void;
}

const CustomerCreditForm: React.FC<CustomerCreditFormProps> = ({
  credit,
  onSubmit,
  onCancel
}) => {
  const form = useForm<Partial<CustomerCredit>>({
    defaultValues: {
      payment_amount: credit?.payment_amount || 0,
      payment_type: credit?.payment_type || 'credit',
      payment_note: credit?.payment_note || '',
      date_of_payment: credit?.date_of_payment 
        ? new Date(credit.date_of_payment).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    }
  });

  const handleSubmit = (data: Partial<CustomerCredit>) => {
    // Ensure amount is a number
    const formattedData = {
      ...data,
      payment_amount: Number(data.payment_amount),
      date_of_payment: data.date_of_payment ? new Date(data.date_of_payment).toISOString() : undefined
    };
    
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="payment_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Credit Amount</FormLabel>
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
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="payment_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select credit type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="prepayment">Prepayment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="date_of_payment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="payment_note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Enter notes about this credit" />
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
            {credit ? 'Update Credit' : 'Add Credit'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CustomerCreditForm;
