import { useToast } from '@/hooks/utils/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CustomerCredit } from '@/types/estimate';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function useInvoiceCredits() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCustomerCredit = useMutation({
    mutationFn: async ({ invoiceGlideId, data }: { invoiceGlideId: string, data: Partial<CustomerCredit> }): Promise<CustomerCredit> => {
      try {
        // Create a unique glide_row_id for the credit
        const creditGlideId = `CR-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // Convert Date to ISO string if it's a Date object
        const dateOfPayment = data.date_of_payment instanceof Date 
          ? data.date_of_payment.toISOString() 
          : data.date_of_payment;
        
        const creditData = {
          glide_row_id: creditGlideId,
          rowid_invoices: invoiceGlideId,
          rowid_accounts: data.rowid_accounts,
          payment_amount: data.payment_amount,
          date_of_payment: dateOfPayment,
          payment_type: data.payment_type,
          payment_note: data.payment_note
        };
        
        const { data: newCredit, error: createError } = await supabase
          .from('gl_customer_credits')
          .insert([creditData])
          .select()
          .single();
          
        if (createError) throw createError;
        
        // Update the invoice to reflect the credit
        await updateInvoiceWithCredit(invoiceGlideId);
        
        toast({
          title: 'Success',
          description: 'Credit added successfully',
        });
        
        return {
          id: newCredit.id,
          glide_row_id: newCredit.glide_row_id,
          rowid_invoices: invoiceGlideId,
          rowid_accounts: newCredit.rowid_accounts || undefined,
          payment_amount: Number(newCredit.payment_amount),
          payment_note: newCredit.payment_note || undefined,
          payment_type: newCredit.payment_type || undefined,
          date_of_payment: newCredit.date_of_payment || undefined,
          created_at: newCredit.created_at,
          updated_at: newCredit.updated_at
        };
      } catch (err) {
        console.error('Error adding credit:', err);
        toast({
          title: 'Error',
          description: 'Failed to add credit',
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
    }
  });

  const updateCustomerCredit = useMutation({
    mutationFn: async ({ creditId, data }: { creditId: string, data: Partial<CustomerCredit> }): Promise<CustomerCredit> => {
      try {
        // Get the current credit to access the invoice ID
        const { data: currentCredit, error: fetchError } = await supabase
          .from('gl_customer_credits')
          .select('*')
          .eq('id', creditId)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Prepare data for database update
        const creditData: any = {};
        
        if (data.rowid_accounts !== undefined) creditData.rowid_accounts = data.rowid_accounts;
        if (data.payment_amount !== undefined) creditData.payment_amount = data.payment_amount;
        if (data.payment_type !== undefined) creditData.payment_type = data.payment_type;
        if (data.payment_note !== undefined) creditData.payment_note = data.payment_note;
        
        // Convert Date to ISO string if it's a Date object
        if (data.date_of_payment !== undefined) {
          creditData.date_of_payment = data.date_of_payment instanceof Date 
            ? data.date_of_payment.toISOString() 
            : data.date_of_payment;
        }
        
        // Update the credit
        const { data: updatedCredit, error: updateError } = await supabase
          .from('gl_customer_credits')
          .update(creditData)
          .eq('id', creditId)
          .select()
          .single();
          
        if (updateError) throw updateError;
        
        // Update the invoice to reflect the credit
        await updateInvoiceWithCredit(currentCredit.rowid_invoices);
        
        toast({
          title: 'Success',
          description: 'Credit updated successfully',
        });
        
        return {
          id: updatedCredit.id,
          glide_row_id: updatedCredit.glide_row_id,
          rowid_invoices: updatedCredit.rowid_invoices,
          rowid_accounts: updatedCredit.rowid_accounts || undefined,
          payment_amount: Number(updatedCredit.payment_amount),
          payment_note: updatedCredit.payment_note || undefined,
          payment_type: updatedCredit.payment_type || undefined,
          date_of_payment: updatedCredit.date_of_payment || undefined,
          created_at: updatedCredit.created_at,
          updated_at: updatedCredit.updated_at
        };
      } catch (err) {
        console.error('Error updating credit:', err);
        toast({
          title: 'Error',
          description: 'Failed to update credit',
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
    }
  });

  const deleteCustomerCredit = useMutation({
    mutationFn: async (creditId: string): Promise<boolean> => {
      try {
        // Get the current credit to access the invoice ID
        const { data: credit, error: fetchError } = await supabase
          .from('gl_customer_credits')
          .select('rowid_invoices')
          .eq('id', creditId)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Delete the credit
        const { error: deleteError } = await supabase
          .from('gl_customer_credits')
          .delete()
          .eq('id', creditId);
          
        if (deleteError) throw deleteError;
        
        // Update the invoice to reflect the removed credit
        await updateInvoiceWithCredit(credit.rowid_invoices);
        
        toast({
          title: 'Success',
          description: 'Credit deleted successfully',
        });
        
        return true;
      } catch (err) {
        console.error('Error deleting credit:', err);
        toast({
          title: 'Error',
          description: 'Failed to delete credit',
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice'] });
    }
  });

  // Helper function to update invoice with credit information
  const updateInvoiceWithCredit = async (invoiceGlideId: string) => {
    try {
      // Calculate total credits applied to this invoice
      const { data: credits, error: creditsError } = await supabase
        .from('gl_customer_credits')
        .select('payment_amount')
        .eq('rowid_invoices', invoiceGlideId);
        
      if (creditsError) throw creditsError;
      
      const totalCredits = credits.reduce((sum, credit) => sum + (Number(credit.payment_amount) || 0), 0);
      
      // Get invoice current data
      const { data: invoice, error: invoiceError } = await supabase
        .from('gl_invoices')
        .select('total_amount, total_paid')
        .eq('glide_row_id', invoiceGlideId)
        .single();
        
      if (invoiceError) throw invoiceError;
      
      const totalAmount = Number(invoice.total_amount) || 0;
      const totalPaid = Number(invoice.total_paid) || 0;
      
      // Calculate new balance with credits applied
      const balance = totalAmount - totalPaid - totalCredits;
      
      // Determine payment status based on balance
      let paymentStatus = 'unpaid';
      if (balance <= 0) {
        paymentStatus = 'paid';
      } else if (totalPaid > 0 || totalCredits > 0) {
        paymentStatus = 'partial';
      }
      
      // If there are credits but the invoice isn't fully paid, mark as credit
      if (totalCredits > 0 && balance > 0) {
        paymentStatus = 'credit';
      }
      
      // Update invoice with credit information
      const { error: updateError } = await supabase
        .from('gl_invoices')
        .update({
          total_credits: totalCredits,
          balance: balance,
          payment_status: paymentStatus
        })
        .eq('glide_row_id', invoiceGlideId);
        
      if (updateError) throw updateError;
      
    } catch (err) {
      console.error('Error updating invoice with credit:', err);
      throw err;
    }
  };

  const fetchCreditsForInvoice = async (invoiceGlideId: string): Promise<CustomerCredit[]> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('gl_customer_credits')
        .select('*')
        .eq('rowid_invoices', invoiceGlideId);
        
      if (error) throw error;
      
      return data.map(credit => ({
        id: credit.id,
        glide_row_id: credit.glide_row_id,
        rowid_invoices: credit.rowid_invoices,
        rowid_accounts: credit.rowid_accounts || undefined,
        payment_amount: Number(credit.payment_amount),
        payment_note: credit.payment_note || undefined,
        payment_type: credit.payment_type || undefined,
        date_of_payment: credit.date_of_payment || undefined,
        created_at: credit.created_at,
        updated_at: credit.updated_at
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching credits';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addCustomerCredit,
    updateCustomerCredit,
    deleteCustomerCredit,
    fetchCreditsForInvoice,
    isLoading,
    error
  };
} 