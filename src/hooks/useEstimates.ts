
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Estimate, EstimateLine, CustomerCredit } from '@/types/estimate';
import { Account } from '@/types/index';

export function useEstimates() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEstimates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch estimates with account names
      const { data: estimatesData, error: estimatesError } = await supabase
        .from('gl_estimates')
        .select(`
          *,
          account:gl_accounts(id, account_name)
        `)
        .order('created_at', { ascending: false });
      
      if (estimatesError) throw estimatesError;
      
      const enhancedEstimates = estimatesData.map((estimate) => {
        const account = estimate.account as unknown as { id: string; account_name: string }[] | null;
        // Cast to the expected enum type
        const status = estimate.status as 'draft' | 'pending' | 'converted';
        
        return {
          ...estimate,
          accountName: account && account.length > 0 ? account[0].account_name : 'Unknown',
          status: status
        } as Estimate;
      });
      
      setEstimates(enhancedEstimates);
      return enhancedEstimates;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch estimates';
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
  }, [toast]);

  const getEstimate = useCallback(async (id: string): Promise<Estimate | null> => {
    try {
      // Get the main estimate data
      const { data: estimate, error: estimateError } = await supabase
        .from('gl_estimates')
        .select(`
          *,
          account:gl_accounts(*)
        `)
        .eq('id', id)
        .single();
      
      if (estimateError) throw estimateError;
      
      // Get estimate lines
      const { data: estimateLines, error: linesError } = await supabase
        .from('gl_estimate_lines')
        .select('*')
        .eq('rowid_estimate_lines', estimate.glide_row_id);
      
      if (linesError) throw linesError;
      
      // Get credits applied to this estimate
      const { data: credits, error: creditsError } = await supabase
        .from('gl_customer_credits')
        .select('*')
        .eq('rowid_estimates', estimate.glide_row_id);
      
      if (creditsError) throw creditsError;
      
      // Format the estimate with related data
      const account = estimate.account as unknown as Account[] | null;
      // Cast the status to the expected enum type
      const status = estimate.status as 'draft' | 'pending' | 'converted';
      
      const formattedEstimate: Estimate = {
        ...estimate,
        accountName: account && account.length > 0 ? account[0].account_name : 'Unknown',
        account: account && account.length > 0 ? account[0] : undefined,
        estimateLines: estimateLines as EstimateLine[],
        credits: credits as CustomerCredit[],
        status: status
      };
      
      return formattedEstimate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch estimate';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const createEstimate = useCallback(async (estimateData: Partial<Estimate>) => {
    try {
      // Create glide_row_id for the estimate
      const glideRowId = `EST-${Date.now()}`;
      
      // Basic estimate data
      const newEstimate = {
        status: 'draft' as const,
        glide_row_id: glideRowId,
        rowid_accounts: estimateData.rowid_accounts,
        estimate_date: estimateData.estimate_date || new Date().toISOString(),
        add_note: estimateData.add_note || false,
        total_amount: 0,
        total_credits: 0,
        balance: 0
      };
      
      // Insert the new estimate
      const { data, error } = await supabase
        .from('gl_estimates')
        .insert(newEstimate)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Estimate created successfully',
      });
      
      await fetchEstimates();
      return data as Estimate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create estimate';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchEstimates, toast]);

  const updateEstimate = useCallback(async (id: string, estimateData: Partial<Estimate>) => {
    try {
      // Remove nested objects before updating
      const { account, estimateLines, credits, ...updateData } = estimateData;
      
      const { data, error } = await supabase
        .from('gl_estimates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Estimate updated successfully',
      });
      
      await fetchEstimates();
      return data as Estimate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update estimate';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchEstimates, toast]);

  const deleteEstimate = useCallback(async (id: string) => {
    try {
      const { data: estimate } = await supabase
        .from('gl_estimates')
        .select('glide_row_id')
        .eq('id', id)
        .single();
      
      if (!estimate) throw new Error('Estimate not found');
      
      // Delete associated estimate lines
      await supabase
        .from('gl_estimate_lines')
        .delete()
        .eq('rowid_estimate_lines', estimate.glide_row_id);
      
      // Delete associated credits
      await supabase
        .from('gl_customer_credits')
        .delete()
        .eq('rowid_estimates', estimate.glide_row_id);
      
      // Delete the estimate itself
      const { error } = await supabase
        .from('gl_estimates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Estimate deleted successfully',
      });
      
      await fetchEstimates();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete estimate';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchEstimates, toast]);

  const addEstimateLine = useCallback(async (estimateGlideId: string, lineData: Partial<EstimateLine>) => {
    try {
      const newLine = {
        ...lineData,
        rowid_estimate_lines: estimateGlideId,
        glide_row_id: `EL-${Date.now()}`,
        line_total: (lineData.qty_sold || 0) * (lineData.selling_price || 0)
      };
      
      const { data, error } = await supabase
        .from('gl_estimate_lines')
        .insert(newLine)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Estimate line added successfully',
      });
      
      return data as EstimateLine;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add estimate line';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const updateEstimateLine = useCallback(async (lineId: string, lineData: Partial<EstimateLine>) => {
    try {
      // Calculate line total if qty or price is updated
      let updateData = { ...lineData };
      if (lineData.qty_sold !== undefined || lineData.selling_price !== undefined) {
        const { data: existingLine } = await supabase
          .from('gl_estimate_lines')
          .select('qty_sold, selling_price')
          .eq('id', lineId)
          .single();
          
        const qty = lineData.qty_sold ?? existingLine?.qty_sold ?? 0;
        const price = lineData.selling_price ?? existingLine?.selling_price ?? 0;
        updateData.line_total = qty * price;
      }
      
      const { data, error } = await supabase
        .from('gl_estimate_lines')
        .update(updateData)
        .eq('id', lineId)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Estimate line updated successfully',
      });
      
      return data as EstimateLine;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update estimate line';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const deleteEstimateLine = useCallback(async (lineId: string) => {
    try {
      const { error } = await supabase
        .from('gl_estimate_lines')
        .delete()
        .eq('id', lineId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Estimate line removed successfully',
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove estimate line';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const addCustomerCredit = useCallback(async (estimateGlideId: string, creditData: Partial<CustomerCredit>) => {
    try {
      const newCredit = {
        ...creditData,
        rowid_estimates: estimateGlideId,
        glide_row_id: `CR-${Date.now()}`
      };
      
      const { data, error } = await supabase
        .from('gl_customer_credits')
        .insert(newCredit)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Credit added successfully',
      });
      
      return data as CustomerCredit;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add credit';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const updateCustomerCredit = useCallback(async (creditId: string, creditData: Partial<CustomerCredit>) => {
    try {
      const { data, error } = await supabase
        .from('gl_customer_credits')
        .update(creditData)
        .eq('id', creditId)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Credit updated successfully',
      });
      
      return data as CustomerCredit;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update credit';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const deleteCustomerCredit = useCallback(async (creditId: string) => {
    try {
      const { error } = await supabase
        .from('gl_customer_credits')
        .delete()
        .eq('id', creditId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Credit removed successfully',
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove credit';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const convertToInvoice = useCallback(async (estimateId: string) => {
    try {
      const estimate = await getEstimate(estimateId);
      if (!estimate) throw new Error('Estimate not found');
      
      // Create a new invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('gl_invoices')
        .insert({
          rowid_accounts: estimate.rowid_accounts,
          glide_row_id: `INV-${Date.now()}`,
          notes: estimate.add_note ? 'Converted from estimate' : null,
          created_timestamp: new Date().toISOString(),
          payment_status: 'unpaid'
        })
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;
      
      // Copy estimate lines to invoice lines
      if (estimate.estimateLines && estimate.estimateLines.length > 0) {
        const invoiceLines = estimate.estimateLines.map(line => ({
          rowid_invoices: invoice.glide_row_id,
          renamed_product_name: line.sale_product_name,
          qty_sold: line.qty_sold,
          selling_price: line.selling_price,
          line_total: line.line_total,
          product_sale_note: line.product_sale_note,
          date_of_sale: new Date().toISOString(),
          rowid_products: line.rowid_products,
          glide_row_id: `IL-${Date.now()}-${Math.floor(Math.random() * 1000)}`
        }));
        
        const { error: linesError } = await supabase
          .from('gl_invoice_lines')
          .insert(invoiceLines);
        
        if (linesError) throw linesError;
      }
      
      // Update the estimate as converted and link to the invoice
      const { error: updateError } = await supabase
        .from('gl_estimates')
        .update({
          status: 'converted' as const,
          valid_final_create_invoice_clicked: true,
          rowid_invoices: invoice.glide_row_id
        })
        .eq('id', estimateId);
      
      if (updateError) throw updateError;
      
      toast({
        title: 'Success',
        description: 'Estimate converted to invoice successfully',
      });
      
      await fetchEstimates();
      return invoice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to convert estimate to invoice';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchEstimates, getEstimate, toast]);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  return {
    estimates,
    isLoading,
    error,
    fetchEstimates,
    getEstimate,
    createEstimate,
    updateEstimate,
    deleteEstimate,
    addEstimateLine,
    updateEstimateLine,
    deleteEstimateLine,
    addCustomerCredit,
    updateCustomerCredit,
    deleteCustomerCredit,
    convertToInvoice
  };
}
