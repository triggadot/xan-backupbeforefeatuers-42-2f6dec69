import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useToast } from '@/hooks/use-toast';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useAccountsNew } from '@/hooks/useAccountsNew';

const formSchema = z.object({
  number: z.string().min(3, {
    message: "Purchase order number must be at least 3 characters.",
  }),
  date: z.date({
    required_error: "A date is required.",
  }),
  vendorId: z.string().min(1, {
    message: "Vendor is required.",
  }),
  status: z.string().min(1, {
    message: "Status is required.",
  }),
  notes: z.string().optional(),
});

interface PurchaseOrderFormProps {
  purchaseOrder?: any; // Using 'any' temporarily to fix build errors
  onCancel: () => void;
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ purchaseOrder, onCancel }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createPurchaseOrder, updatePurchaseOrder } = usePurchaseOrders();
  const { accounts, isLoading: isLoadingAccounts } = useAccountsNew();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      number: purchaseOrder?.number || '',
      date: purchaseOrder?.date ? new Date(purchaseOrder.date) : new Date(),
      vendorId: purchaseOrder?.vendor_id || '',
      status: purchaseOrder?.status || 'draft',
      notes: purchaseOrder?.notes || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      if (purchaseOrder) {
        // Update existing purchase order
        await updatePurchaseOrder.mutateAsync({
          id: purchaseOrder.id,
          data: {
            ...values,
            date: values.date,
          }
        });
        toast({
          title: "Success",
          description: "Purchase order updated successfully.",
        });
      } else {
        // Create new purchase order
        await createPurchaseOrder.mutateAsync({
          ...values,
          date: values.date,
        });
        toast({
          title: "Success",
          description: "Purchase order created successfully.",
        });
      }
      onCancel();
      navigate('/purchase-orders');
    } catch (error) {
      console.error("Error creating/updating purchase order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create/update purchase order. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Purchase Order Number */}
          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Order Number</FormLabel>
                <FormControl>
                  <Input placeholder="PO-2024-001" {...field} />
                </FormControl>
                <FormDescription>
                  This is the unique identifier for the purchase order.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Vendor Selection */}
          <FormField
            control={form.control}
            name="vendorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting || isLoadingAccounts}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts
                      .filter(account => account.is_vendor)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The vendor for this purchase order.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date Picker */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Order Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "yyyy-MM-dd")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date()
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  The date when the purchase order was issued.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status Selection */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  The current status of the purchase order.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes or comments about the purchase order."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Any additional information about the purchase order.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PurchaseOrderForm;
