
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VendorPayment } from '@/types/purchaseOrder';

export function usePaymentOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Add a payment to a purchase order
  const addPayment = useMutation({
    mutationFn: async ({ 
      purchaseOrderGlideId, 
      data,
      vendorId 
    }: { 
      purchaseOrderGlideId: string, 
      data: Partial<VendorPayment>,
      vendorId: string 
    }) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data: newPayment, error: paymentError } = await supabase
          .from('gl_vendor_payments')
          .insert({
            rowid_purchase_orders: purchaseOrderGlideId,
            rowid_accounts: vendorId,
            payment_amount: data.amount,
            date_of_payment: data.date instanceof Date ? data.date.toISOString() : data.date,
            vendor_purchase_note: data.notes
          })
          .select()
          .single();
        
        if (paymentError) throw paymentError;
        
        // Trigger PO totals update via DB trigger
        
        return newPayment;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error adding payment:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });

  // Update a payment
  const updatePayment = useMutation({
    mutationFn: async ({ 
      id, 
      data,
      vendorId 
    }: { 
      id: string, 
      data: Partial<VendorPayment>,
      vendorId?: string
    }) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const updateData: any = {
          payment_amount: data.amount,
          vendor_purchase_note: data.notes
        };
        
        if (data.date) {
          updateData.date_of_payment = data.date instanceof Date ? 
            data.date.toISOString() : data.date;
        }
        
        if (vendorId) {
          updateData.rowid_accounts = vendorId;
        }
        
        const { data: updatedPayment, error: paymentError } = await supabase
          .from('gl_vendor_payments')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
        
        if (paymentError) throw paymentError;
        
        // Trigger PO totals update via DB trigger
        
        return updatedPayment;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error updating payment:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });

  // Delete a payment
  const deletePayment = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { error: paymentError } = await supabase
          .from('gl_vendor_payments')
          .delete()
          .eq('id', id);
        
        if (paymentError) throw paymentError;
        
        // Trigger PO totals update via DB trigger
        
        return id;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error deleting payment:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    }
  });

  return {
    addPayment,
    updatePayment,
    deletePayment,
    isLoading,
    error
  };
}
