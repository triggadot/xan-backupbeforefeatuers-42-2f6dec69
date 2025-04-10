
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/utils/use-toast';
import { VendorPayment } from '@/types/vendorPayment';

/**
 * Hook for managing vendor payments related to purchase orders
 * 
 * @returns Object with methods and state for vendor payment operations
 */
export function useVendorPayments() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Fetch payments for a specific purchase order
   * 
   * @param purchaseOrderId - The glide_row_id of the purchase order
   * @returns Promise resolving to array of vendor payments
   */
  const fetchPaymentsByPurchaseOrderId = async (purchaseOrderId: string): Promise<VendorPayment[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: payments, error: fetchError } = await supabase
        .from('gl_vendor_payments')
        .select(`
          id, 
          payment_amount, 
          date_of_payment, 
          vendor_purchase_note, 
          rowid_purchase_orders,
          rowid_accounts,
          created_at,
          updated_at
        `)
        .eq('rowid_purchase_orders', purchaseOrderId);

      if (fetchError) throw fetchError;

      // Format payments to match VendorPayment type
      const formattedPayments: VendorPayment[] = payments.map(payment => ({
        id: payment.id,
        amount: Number(payment.payment_amount),
        payment_date: payment.date_of_payment,
        payment_method: 'Payment', // Default method since the table doesn't track this
        payment_notes: payment.vendor_purchase_note,
        rowid_purchase_orders: payment.rowid_purchase_orders,
        rowid_accounts: payment.rowid_accounts,
        created_at: new Date(payment.created_at),
        updated_at: new Date(payment.updated_at)
      }));

      return formattedPayments;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payments';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add a new payment to a purchase order
   */
  const addPayment = {
    mutateAsync: async ({ 
      purchaseOrderId, 
      data, 
      vendorId 
    }: { 
      purchaseOrderId: string, 
      data: Partial<VendorPayment>, 
      vendorId: string 
    }): Promise<VendorPayment | null> => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Create a unique glide_row_id for the payment
        const paymentGlideId = `VPAY-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Convert Date to ISO string if it's a Date object
        const paymentDate = data.payment_date instanceof Date 
          ? data.payment_date.toISOString() 
          : data.payment_date;
        
        // Prepare data for database insert
        const paymentData = {
          glide_row_id: paymentGlideId,
          rowid_purchase_orders: purchaseOrderId,
          rowid_accounts: vendorId,
          payment_amount: data.amount,
          date_of_payment: paymentDate,
          vendor_purchase_note: data.payment_notes || ''
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
          payment_date: newPayment.date_of_payment || newPayment.created_at,
          payment_method: 'Payment',
          payment_notes: newPayment.vendor_purchase_note || '',
          rowid_purchase_orders: purchaseOrderId,
          rowid_accounts: vendorId,
          created_at: new Date(newPayment.created_at),
          updated_at: new Date(newPayment.updated_at)
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

  /**
   * Update an existing payment
   */
  const updatePayment = {
    mutateAsync: async ({ 
      id, 
      data 
    }: { 
      id: string, 
      data: Partial<VendorPayment> 
    }): Promise<VendorPayment | null> => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get the current payment to access related IDs
        const { data: currentPayment, error: fetchError } = await supabase
          .from('gl_vendor_payments')
          .select('*')
          .eq('id', id)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Prepare data for database update
        const paymentData: any = {};
        
        if (data.amount !== undefined) paymentData.payment_amount = data.amount;
        if (data.payment_notes !== undefined) paymentData.vendor_purchase_note = data.payment_notes;
        
        // Convert Date to ISO string if it's a Date object
        if (data.payment_date !== undefined) {
          paymentData.date_of_payment = data.payment_date instanceof Date 
            ? data.payment_date.toISOString() 
            : data.payment_date;
        }
        
        // Update the payment
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
        
        // Map the database response to our frontend model
        return {
          id: updatedPayment.id,
          amount: Number(updatedPayment.payment_amount || 0),
          payment_date: updatedPayment.date_of_payment || updatedPayment.created_at,
          payment_method: 'Payment',
          payment_notes: updatedPayment.vendor_purchase_note || '',
          rowid_purchase_orders: updatedPayment.rowid_purchase_orders,
          rowid_accounts: updatedPayment.rowid_accounts || '',
          created_at: new Date(updatedPayment.created_at),
          updated_at: new Date(updatedPayment.updated_at)
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

  /**
   * Delete a payment
   */
  const deletePayment = {
    mutateAsync: async ({ id }: { id: string }): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get the current payment for related IDs
        const { data: payment, error: fetchError } = await supabase
          .from('gl_vendor_payments')
          .select('rowid_purchase_orders')
          .eq('id', id)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Delete the payment
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
    fetchPaymentsByPurchaseOrderId,
    addPayment,
    updatePayment,
    deletePayment,
    isLoading,
    error
  };
}
