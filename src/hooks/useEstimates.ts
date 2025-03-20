
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Estimate, EstimateLine, CustomerCredit, EstimateWithDetails } from '@/types/estimate';
import { supabase } from '@/integrations/supabase/client';

export function useEstimates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all estimates with account details using the materialized view
  const {
    data: estimates = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['estimates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mv_estimate_customer_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(estimate => ({
        ...estimate,
        status: estimate.status || 'draft',
        accountName: estimate.account_name
      })) as Estimate[];
    }
  });

  // Get a single estimate with all details
  const getEstimate = useCallback(async (id: string): Promise<EstimateWithDetails | null> => {
    try {
      // Get the estimate details
      const { data: estimate, error: estimateError } = await supabase
        .from('gl_estimates')
        .select('*, gl_accounts!gl_estimates_rowid_accounts_fkey(account_name)')
        .eq('id', id)
        .single();
      
      if (estimateError) throw estimateError;
      
      // Get estimate lines
      const { data: estimateLines, error: linesError } = await supabase
        .from('gl_estimate_lines')
        .select('*, gl_products!gl_estimate_lines_rowid_products_fkey(*)')
        .eq('rowid_estimate_lines', estimate.glide_row_id);
      
      if (linesError) throw linesError;
      
      // Get credits
      const { data: credits, error: creditsError } = await supabase
        .from('gl_customer_credits')
        .select('*')
        .eq('rowid_estimates', estimate.glide_row_id);
      
      if (creditsError) throw creditsError;
      
      return {
        ...estimate,
        status: estimate.status || 'draft',
        accountName: estimate.gl_accounts?.account_name,
        estimateLines: estimateLines || [],
        credits: credits || []
      } as EstimateWithDetails;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch estimate';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Create a new estimate
  const createEstimate = useMutation({
    mutationFn: async (data: Partial<Estimate>) => {
      // Generate unique glide row ID
      const glideRowId = `EST-${Date.now()}`;

      const estimate = {
        glide_row_id: glideRowId,
        rowid_accounts: data.rowid_accounts,
        estimate_date: data.estimate_date || new Date().toISOString(),
        status: 'draft',
        total_amount: 0,
        total_credits: 0,
        balance: 0,
        is_a_sample: data.is_a_sample || false,
        add_note: data.add_note || false
      };

      const { data: newEstimate, error } = await supabase
        .from('gl_estimates')
        .insert(estimate)
        .select()
        .single();

      if (error) throw error;
      return newEstimate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Estimate created successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create estimate';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Update an estimate
  const updateEstimate = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Estimate> }) => {
      const { data: updated, error } = await supabase
        .from('gl_estimates')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Estimate updated successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update estimate';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Delete an estimate
  const deleteEstimate = useMutation({
    mutationFn: async (id: string) => {
      // Get the glide_row_id first
      const { data: estimate } = await supabase
        .from('gl_estimates')
        .select('glide_row_id')
        .eq('id', id)
        .single();

      if (!estimate) throw new Error('Estimate not found');

      // Delete related records
      await supabase
        .from('gl_estimate_lines')
        .delete()
        .eq('rowid_estimate_lines', estimate.glide_row_id);

      await supabase
        .from('gl_customer_credits')
        .delete()
        .eq('rowid_estimates', estimate.glide_row_id);

      // Delete the estimate
      const { error } = await supabase
        .from('gl_estimates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Estimate deleted successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete estimate';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Add a new estimate line
  const addEstimateLine = useMutation({
    mutationFn: async ({ estimateId, lineData }: { estimateId: string, lineData: Partial<EstimateLine> }) => {
      // Get estimate's glide_row_id first
      const { data: estimate } = await supabase
        .from('gl_estimates')
        .select('glide_row_id')
        .eq('id', estimateId)
        .single();

      if (!estimate) throw new Error('Estimate not found');

      const newLine = {
        glide_row_id: `EL-${Date.now()}`,
        rowid_estimate_lines: estimate.glide_row_id,
        sale_product_name: lineData.sale_product_name,
        qty_sold: lineData.qty_sold || 0,
        selling_price: lineData.selling_price || 0,
        line_total: (lineData.qty_sold || 0) * (lineData.selling_price || 0),
        rowid_products: lineData.rowid_products,
        product_sale_note: lineData.product_sale_note,
        date_of_sale: lineData.date_of_sale || new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('gl_estimate_lines')
        .insert(newLine)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Line item added successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add line item';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Update an estimate line
  const updateEstimateLine = useMutation({
    mutationFn: async ({ lineId, lineData }: { lineId: string, lineData: Partial<EstimateLine> }) => {
      // Calculate line total if qty or price is provided
      const updateData = { ...lineData };
      
      if (lineData.qty_sold !== undefined || lineData.selling_price !== undefined) {
        const { data: existingLine } = await supabase
          .from('gl_estimate_lines')
          .select('qty_sold, selling_price')
          .eq('id', lineId)
          .single();

        if (existingLine) {
          const qty = lineData.qty_sold ?? existingLine.qty_sold;
          const price = lineData.selling_price ?? existingLine.selling_price;
          updateData.line_total = qty * price;
        }
      }

      const { data, error } = await supabase
        .from('gl_estimate_lines')
        .update(updateData)
        .eq('id', lineId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Line item updated successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update line item';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Delete an estimate line
  const deleteEstimateLine = useMutation({
    mutationFn: async (lineId: string) => {
      const { error } = await supabase
        .from('gl_estimate_lines')
        .delete()
        .eq('id', lineId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Line item removed successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove line item';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Add a customer credit
  const addCustomerCredit = useMutation({
    mutationFn: async ({ estimateId, creditData }: { estimateId: string, creditData: Partial<CustomerCredit> }) => {
      // Get estimate's glide_row_id first
      const { data: estimate } = await supabase
        .from('gl_estimates')
        .select('glide_row_id')
        .eq('id', estimateId)
        .single();

      if (!estimate) throw new Error('Estimate not found');

      const newCredit = {
        glide_row_id: `CR-${Date.now()}`,
        rowid_estimates: estimate.glide_row_id,
        rowid_accounts: creditData.rowid_accounts,
        payment_amount: creditData.payment_amount || 0,
        payment_note: creditData.payment_note,
        date_of_payment: creditData.date_of_payment || new Date().toISOString(),
        payment_type: creditData.payment_type
      };

      const { data, error } = await supabase
        .from('gl_customer_credits')
        .insert(newCredit)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Credit added successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add credit';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Update a customer credit
  const updateCustomerCredit = useMutation({
    mutationFn: async ({ creditId, creditData }: { creditId: string, creditData: Partial<CustomerCredit> }) => {
      const { data, error } = await supabase
        .from('gl_customer_credits')
        .update(creditData)
        .eq('id', creditId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Credit updated successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update credit';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Delete a customer credit
  const deleteCustomerCredit = useMutation({
    mutationFn: async (creditId: string) => {
      const { error } = await supabase
        .from('gl_customer_credits')
        .delete()
        .eq('id', creditId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Credit removed successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove credit';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Convert estimate to invoice
  const convertToInvoice = useMutation({
    mutationFn: async (estimateId: string) => {
      const estimate = await getEstimate(estimateId);
      if (!estimate) throw new Error('Estimate not found');

      // Create a new invoice
      const newInvoiceId = `INV-${Date.now()}`;
      const { data: invoice, error: invoiceError } = await supabase
        .from('gl_invoices')
        .insert({
          glide_row_id: newInvoiceId,
          rowid_accounts: estimate.rowid_accounts,
          invoice_order_date: new Date().toISOString(),
          notes: estimate.add_note ? 'Converted from estimate' : null,
          payment_status: 'unpaid',
          total_amount: estimate.total_amount,
          total_paid: 0,
          balance: estimate.total_amount
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Copy estimate lines to invoice lines
      if (estimate.estimateLines && estimate.estimateLines.length > 0) {
        const invoiceLines = estimate.estimateLines.map(line => ({
          glide_row_id: `IL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          rowid_invoices: newInvoiceId,
          renamed_product_name: line.sale_product_name,
          qty_sold: line.qty_sold,
          selling_price: line.selling_price,
          line_total: line.line_total,
          product_sale_note: line.product_sale_note,
          date_of_sale: new Date().toISOString(),
          rowid_products: line.rowid_products
        }));

        const { error: linesError } = await supabase
          .from('gl_invoice_lines')
          .insert(invoiceLines);

        if (linesError) throw linesError;
      }

      // Mark the estimate as converted
      const { error: updateError } = await supabase
        .from('gl_estimates')
        .update({
          status: 'converted',
          valid_final_create_invoice_clicked: true,
          rowid_invoices: newInvoiceId
        })
        .eq('id', estimateId);

      if (updateError) throw updateError;

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({
        title: 'Success',
        description: 'Estimate converted to invoice successfully',
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to convert estimate to invoice';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  return {
    estimates,
    isLoading,
    error,
    fetchEstimates: refetch,
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
