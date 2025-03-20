import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAccounts } from '@/hooks/useAccounts';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { PurchaseOrder } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

const purchaseOrderSchema = z.object({
  date: z.date(),
  number: z.string().min(1, { message: 'Purchase order number is required' }),
  status: z.enum(['draft', 'sent', 'complete', 'partial']),
  vendorId: z.string().min(1, { message: 'Vendor is required' }),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderFormProps {
  initialData?: PurchaseOrder;
  onSubmit: (data: PurchaseOrderFormValues) => Promise<void>;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ initialData, onSubmit }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { accounts, isLoading: isAccountsLoading } = useAccounts();
  const { updatePurchaseOrder, createPurchaseOrder } = usePurchaseOrders();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      date: initialData?.date || new Date(),
      number: initialData?.number || '',
      status: initialData?.status || 'draft',
      vendorId: initialData?.vendorId || '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        date: initialData.date,
        number: initialData.number,
        status: initialData.status,
        vendorId: initialData.vendorId,
      });
    }
  }, [initialData, form]);

  const onSubmitHandler = async (values: PurchaseOrderFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = {
        date: values.date,
        number: values.number,
        status: values.status as any, // Type casting to avoid status type mismatch
        vendorId: values.vendorId,
      };

      if (id) {
        // Update existing purchase order
        if (updatePurchaseOrder) {
          await updatePurchaseOrder.mutateAsync({ id, ...formData });
          toast({
            title: 'Success',
            description: 'Purchase order updated successfully.',
          });
        } else {
          console.error('updatePurchaseOrder mutation is undefined');
          toast({
            title: 'Error',
            description: 'Failed to update purchase order.',
            variant: 'destructive',
          });
        }
      } else {
        // Create new purchase order
        if (createPurchaseOrder) {
          await createPurchaseOrder.mutateAsync(formData);
          toast({
            title: 'Success',
            description: 'Purchase order created successfully.',
          });
          navigate('/purchase-orders');
        } else {
          console.error('createPurchaseOrder mutation is undefined');
          toast({
            title: 'Error',
            description: 'Failed to create purchase order.',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error submitting purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit purchase order.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-8">
      <div>
        <Label htmlFor="date">Date</Label>
        <Controller
          control={form.control}
          name="date"
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className="w-[240px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        />
      </div>
      <div>
        <Label htmlFor="number">Purchase Order Number</Label>
        <Input id="number" type="text" {...form.register('number')} />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select onValueChange={form.setValue.bind(null, 'status')}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select a status" defaultValue={initialData?.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="vendorId">Vendor</Label>
        <Select onValueChange={form.setValue.bind(null, 'vendorId')}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select a vendor" />
          </SelectTrigger>
          <SelectContent>
            {!isAccountsLoading &&
              accounts?.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
};
