
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VendorPayment } from '@/types/purchaseOrder';
import { useToast } from '@/hooks/utils/use-toast';

export function usePaymentOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const addPayment = {
    mutateAsync: async ({ purchaseOrderGlideId, data, vendorId }: { purchaseOrderGlideId: string, data: Partial<VendorPayment>, vendorId: string }): Promise<VendorPayment | null> => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Create a unique glide_row_id for the payment
        const paymentGlideId = `VPAY-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Prepare data for database insert
        const paymentData = {
          glide_row_id: paymentGlideId,
          rowid_purchase_orders: purchaseOrderGlideId,
          rowid_accounts: vendorId,
          payment_amount: data.amount,
          date_of_payment: data.date instanceof Date ? data.date.toISOString() : data.date,
          vendor_purchase_note: data.notes || ''
        };
        
        const { data: newPayment, error: createError } = await supabase
          .from('gl_vendor_payments')
          .insert([paymentData])
          .select()
          .single();
          
        if (createError) throw createError;
        
        toast({
          title: 'Success',
          description: 'Payment added successfully.',
        });
        
        // Map the database response to our frontend model
        return {
          id: newPayment.id,
          amount: Number(newPayment.payment_amount || 0),
          date: newPayment.date_of_payment || newPayment.created_at,
          method: 'Payment',
          notes: newPayment.vendor_purchase_note || '',
          vendorId: vendorId
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error adding payment';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    }
  };

  const updatePayment = {
    mutateAsync: async ({ id, data }: { id: string, data: Partial<VendorPayment> }): Promise<VendorPayment | null> => {
      setIsLoading(true);
      setError(null);
      
      try {
        const paymentData: any = {};
        
        if (data.amount !== undefined) paymentData.payment_amount = data.amount;
        if (data.date !== undefined) {
          paymentData.date_of_payment = data.date instanceof Date 
            ? data.date.toISOString() 
            : data.date;
        }
        if (data.notes !== undefined) paymentData.vendor_purchase_note = data.notes;
        
        const { data: updatedPayment, error: updateError } = await supabase
          .from('gl_vendor_payments')
          .update(paymentData)
          .eq('id', id)
          .select()
          .single();
          
        if (updateError) throw updateError;
        
        toast({
          title: 'Success',
          description: 'Payment updated successfully.',
        });
        
        return {
          id: updatedPayment.id,
          amount: Number(updatedPayment.payment_amount || 0),
          date: updatedPayment.date_of_payment || updatedPayment.created_at,
          method: 'Payment',
          notes: updatedPayment.vendor_purchase_note || '',
          vendorId: updatedPayment.rowid_accounts || ''
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error updating payment';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    }
  };

  const deletePayment = {
    mutateAsync: async ({ id }: { id: string }): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { error: deleteError } = await supabase
          .from('gl_vendor_payments')
          .delete()
          .eq('id', id);
          
        if (deleteError) throw deleteError;
        
        toast({
          title: 'Success',
          description: 'Payment deleted successfully.',
        });
        
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error deleting payment';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    }
  };

  return {
    addPayment,
    updatePayment,
    deletePayment,
    isLoading,
    error
  };
}
