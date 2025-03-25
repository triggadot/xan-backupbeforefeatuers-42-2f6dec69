
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VendorPayment } from '@/types/purchaseOrder';
import { useToast } from '@/hooks/use-toast';

export function usePaymentOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const addPayment = {
    mutateAsync: async ({ purchaseOrderGlideId, vendorId, data }: { 
      purchaseOrderGlideId: string, 
      vendorId: string,
      data: Partial<VendorPayment>
    }): Promise<VendorPayment | null> => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Create a unique glide_row_id for the payment
        const paymentGlideId = `VENDORPMT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Prepare data for database insert
        const paymentData = {
          glide_row_id: paymentGlideId,
          rowid_purchase_orders: purchaseOrderGlideId,
          rowid_accounts: vendorId,
          payment_amount: data.amount,
          date_of_payment: data.date instanceof Date ? data.date.toISOString() : data.date,
          vendor_purchase_note: data.notes
        };
        
        const { data: newPayment, error: createError } = await supabase
          .from('gl_vendor_payments')
          .insert([paymentData])
          .select()
          .single();
          
        if (createError) throw createError;
        
        // Update the purchase order total
        await updatePurchaseOrderTotals(purchaseOrderGlideId);
        
        toast({
          title: 'Success',
          description: 'Payment added successfully.',
        });
        
        // Map the database response to our frontend model
        return {
          id: newPayment.id,
          amount: Number(newPayment.payment_amount || 0),
          date: newPayment.date_of_payment ? new Date(newPayment.date_of_payment) : new Date(newPayment.created_at),
          method: 'Payment',
          notes: newPayment.vendor_purchase_note || ''
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
        // Get the current payment to access the purchase order ID
        const { data: currentPayment, error: fetchError } = await supabase
          .from('gl_vendor_payments')
          .select('*')
          .eq('id', id)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Prepare data for database update
        const paymentData: any = {};
        
        if (data.amount !== undefined) paymentData.payment_amount = data.amount;
        if (data.date !== undefined) {
          paymentData.date_of_payment = data.date instanceof Date 
            ? data.date.toISOString() 
            : data.date;
        }
        if (data.notes !== undefined) paymentData.vendor_purchase_note = data.notes;
        
        // Update the payment
        const { data: updatedPayment, error: updateError } = await supabase
          .from('gl_vendor_payments')
          .update(paymentData)
          .eq('id', id)
          .select()
          .single();
          
        if (updateError) throw updateError;
        
        // Update the purchase order totals
        await updatePurchaseOrderTotals(currentPayment.rowid_purchase_orders);
        
        toast({
          title: 'Success',
          description: 'Payment updated successfully.',
        });
        
        // Map the database response to our frontend model
        return {
          id: updatedPayment.id,
          amount: Number(updatedPayment.payment_amount || 0),
          date: updatedPayment.date_of_payment ? new Date(updatedPayment.date_of_payment) : new Date(updatedPayment.created_at),
          method: 'Payment',
          notes: updatedPayment.vendor_purchase_note || ''
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
        // Get the current payment to access the purchase order ID
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
        
        // Update the purchase order totals
        await updatePurchaseOrderTotals(payment.rowid_purchase_orders);
        
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

  // Helper function to update purchase order totals
  const updatePurchaseOrderTotals = async (purchaseOrderGlideId: string) => {
    try {
      // Get the total amount from products
      const { data: products, error: productsError } = await supabase
        .from('gl_products')
        .select('cost, total_qty_purchased')
        .eq('rowid_purchase_orders', purchaseOrderGlideId);
        
      if (productsError) throw productsError;
      
      const totalAmount = products.reduce((sum, product) => {
        const cost = Number(product.cost || 0);
        const quantity = Number(product.total_qty_purchased || 0);
        return sum + (cost * quantity);
      }, 0);
      
      // Get the total paid amount
      const { data: payments, error: paymentsError } = await supabase
        .from('gl_vendor_payments')
        .select('payment_amount')
        .eq('rowid_purchase_orders', purchaseOrderGlideId);
        
      if (paymentsError) throw paymentsError;
      
      const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.payment_amount || 0), 0);
      
      // Calculate the balance
      const balance = totalAmount - totalPaid;
      
      // Update the purchase order
      const { error: updateError } = await supabase
        .from('gl_purchase_orders')
        .update({
          total_paid: totalPaid,
          balance: balance
        })
        .eq('glide_row_id', purchaseOrderGlideId);
        
      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating purchase order totals:', err);
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
