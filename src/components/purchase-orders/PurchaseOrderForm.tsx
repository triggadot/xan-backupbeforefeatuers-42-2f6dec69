
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAccountsNew } from '@/hooks/useAccountsNew';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { PurchaseOrder } from '@/types/purchaseOrder';

// Define accepted status values
const PurchaseOrderStatus = z.enum(['draft', 'partial', 'sent', 'complete']);
type PurchaseOrderStatusType = z.infer<typeof PurchaseOrderStatus>;

const formSchema = z.object({
  vendorId: z.string({
    required_error: 'Please select a vendor',
  }),
  date: z.date({
    required_error: 'Please select a date',
  }),
  number: z.string().optional(),
  status: PurchaseOrderStatus,
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PurchaseOrderFormProps {
  initialData?: PurchaseOrder;
  isEdit?: boolean;
  onClose?: () => void;
}

export function PurchaseOrderForm({ initialData, isEdit = false, onClose }: PurchaseOrderFormProps) {
  const navigate = useNavigate();
  const { accounts } = useAccountsNew();
  const { createPurchaseOrder, updatePurchaseOrder } = usePurchaseOrders();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      vendorId: initialData.vendorId || initialData.rowid_accounts || '',
      date: new Date(initialData.date),
      number: initialData.number || '',
      status: initialData.status as PurchaseOrderStatusType || 'draft',
      notes: initialData.notes || '',
    } : {
      vendorId: '',
      date: new Date(),
      number: '',
      status: 'draft' as PurchaseOrderStatusType,
      notes: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      if (isEdit && initialData) {
        await updatePurchaseOrder(initialData.id, {
          vendorId: values.vendorId,
          date: values.date,
          number: values.number,
          status: values.status,
          notes: values.notes,
        });
        
        if (onClose) {
          onClose();
        }
      } else {
        await createPurchaseOrder({
          vendorId: values.vendorId,
          date: values.date,
          number: values.number,
          status: values.status,
          notes: values.notes,
        });
        
        if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      console.error('Error submitting purchase order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label
            htmlFor="vendorId"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed"
          >
            Vendor
          </label>
          <select
            id="vendorId"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...form.register('vendorId')}
            disabled={isSubmitting}
          >
            <option value="">Select a vendor</option>
            {accounts
              .filter(account => account.is_vendor)
              .map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
          </select>
          {form.formState.errors.vendorId && (
            <p className="text-sm text-red-500">{form.formState.errors.vendorId.message as React.ReactNode}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="date"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed"
          >
            Date
          </label>
          <div className="relative">
            <input
              type="date"
              id="date"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...form.register('date', { valueAsDate: true })}
              disabled={isSubmitting}
            />
            <CalendarIcon className="absolute right-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
          </div>
          {form.formState.errors.date && (
            <p className="text-sm text-red-500">{form.formState.errors.date.message as React.ReactNode}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="number"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed"
          >
            PO Number
          </label>
          <Input
            id="number"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="PO-2024-001"
            {...form.register('number')}
            disabled={isSubmitting}
          />
          {form.formState.errors.number && (
            <p className="text-sm text-red-500">{form.formState.errors.number.message as React.ReactNode}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="status"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed"
          >
            Status
          </label>
          <select
            id="status"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...form.register('status')}
            disabled={isSubmitting}
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="partial">Partial</option>
            <option value="complete">Complete</option>
          </select>
          {form.formState.errors.status && (
            <p className="text-sm text-red-500">{form.formState.errors.status.message as React.ReactNode}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="notes"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed"
        >
          Notes
        </label>
        <textarea
          id="notes"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Additional notes for the purchase order"
          {...form.register('notes')}
          disabled={isSubmitting}
        />
        {form.formState.errors.notes && (
          <p className="text-sm text-red-500">{form.formState.errors.notes.message as React.ReactNode}</p>
        )}
      </div>

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
          {isEdit ? 'Update Purchase Order' : 'Create Purchase Order'}
        </Button>
      </div>
    </form>
  );
}
