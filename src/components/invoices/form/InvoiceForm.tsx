
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useAccountsNew } from '@/hooks/useAccountsNew';
import { useInvoicesNew } from '@/hooks/invoices/useInvoicesNew';
import { CreateInvoiceInput, UpdateInvoiceInput, InvoiceWithDetails } from '@/types/invoice';
import { LineItemFormArray } from './LineItemFormArray';
import { cn } from '@/lib/utils';

const invoiceFormSchema = z.object({
  customerId: z.string({
    required_error: 'Please select a customer',
  }),
  invoiceDate: z.date({
    required_error: 'Please select an invoice date',
  }),
  dueDate: z.date().optional(),
  status: z.enum(['draft', 'sent']),
  notes: z.string().optional(),
  lineItems: z.array(
    z.object({
      productId: z.string({
        required_error: 'Please select a product',
      }),
      description: z.string().min(1, 'Description is required'),
      quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
      unitPrice: z.number().min(0, 'Price must be 0 or greater'),
    })
  ).min(1, 'At least one line item is required'),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  initialData?: InvoiceWithDetails;
  isEdit?: boolean;
  onSuccess?: (invoiceId: string) => void;
}

export function InvoiceForm({ initialData, isEdit = false, onSuccess }: InvoiceFormProps) {
  const navigate = useNavigate();
  const { accounts } = useAccountsNew();
  const { createInvoice, updateInvoice } = useInvoicesNew();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: initialData ? {
      customerId: initialData.customerId,
      invoiceDate: initialData.invoiceDate ? new Date(initialData.invoiceDate) : new Date(),
      dueDate: initialData.dueDate ? new Date(initialData.dueDate) : undefined,
      status: initialData.status === 'paid' || initialData.status === 'partial' || initialData.status === 'overdue' 
        ? 'sent' 
        : (initialData.status as 'draft' | 'sent'),
      notes: initialData.notes || '',
      lineItems: initialData.lineItems.map(item => ({
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    } : {
      customerId: '',
      invoiceDate: new Date(),
      status: 'draft' as const,
      notes: '',
      lineItems: [],
    },
  });

  const onSubmit = async (values: InvoiceFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (isEdit && initialData) {
        const updateData: UpdateInvoiceInput = {
          customerId: values.customerId,
          invoiceDate: values.invoiceDate,
          dueDate: values.dueDate,
          status: values.status,
          notes: values.notes,
        };
        
        await updateInvoice.mutateAsync({
          id: initialData.id,
          data: updateData
        });
        
        if (onSuccess) {
          onSuccess(initialData.id);
        } else {
          navigate(`/invoices/${initialData.id}`);
        }
      } else {
        const invoiceId = await createInvoice.mutateAsync(values as CreateInvoiceInput);
        
        if (invoiceId) {
          if (onSuccess) {
            onSuccess(invoiceId);
          } else {
            navigate(`/invoices/${invoiceId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error submitting invoice:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts
                      .filter(account => account.type === 'Customer' || account.type === 'Customer & Vendor')
                      .map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Draft invoices won't be counted in reports until sent.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="invoiceDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Invoice Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isSubmitting}
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
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={isSubmitting}
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
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When payment is expected. Default is 30 days from invoice date.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Line Items</h3>
          <LineItemFormArray 
            control={form.control} 
            disabled={isSubmitting}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter any additional notes or terms..."
                  className="resize-y"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormDescription>
                These notes will appear on the invoice.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
