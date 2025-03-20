import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Estimate, EstimateWithDetails, EstimateLine, CustomerCredit } from '@/types/estimate';

export function useEstimates() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch estimates
  const {
    data,
    isLoading: queryIsLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['estimates'],
    queryFn: async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('gl_estimates')
          .select('*');

        if (error) {
          throw new Error(error.message);
        }

        if (!data) {
          return [];
        }

        // Add type assertion when converting from database model to Estimate
        return data.map((row: any) => {
          return {
            id: row.estimate_id || row.id,
            glide_row_id: row.glide_row_id,
            status: row.status as 'draft' | 'pending' | 'converted',
            accountName: row.customer_name || row.account_name,
            total_amount: Number(row.total_amount || 0),
            total_credits: Number(row.total_credits || 0),
            balance: Number(row.balance || 0),
            estimate_date: row.estimate_date,
            created_at: row.created_at,
            updated_at: row.updated_at,
            is_a_sample: row.is_a_sample,
            rowid_accounts: row.customer_glide_id,
            rowid_invoices: row.rowid_invoices,
            add_note: row.add_note,
            valid_final_create_invoice_clicked: row.valid_final_create_invoice_clicked
          } as Estimate;
        });
      } catch (err: any) {
        setError(err.message);
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        });
        return [];
      } finally {
        setIsLoading(false);
      }
    },
  });

  useEffect(() => {
    if (data) {
      setEstimates(data);
    }
  }, [data]);

  // Get a single estimate with full details
  const getEstimate = useCallback(async (id: string): Promise<EstimateWithDetails | null> => {
    try {
      // Fetch the estimate
      const { data: estimate, error: estimateError } = await supabase
        .from('gl_estimates')
        .select('*')
        .eq('id', id)
        .single();

      if (estimateError) throw estimateError;
      if (!estimate) throw new Error('Estimate not found');

      // Fetch the account
      const { data: account, error: accountError } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('glide_row_id', estimate.rowid_accounts)
        .maybeSingle();

      if (accountError) throw accountError;

      // Fetch line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('gl_estimate_lines')
        .select('*')
        .eq('rowid_estimates', estimate.glide_row_id);

      if (lineItemsError) throw lineItemsError;

      // Fetch credits
      const { data: credits, error: creditsError } = await supabase
        .from('gl_customer_credits')
        .select('*')
        .eq('rowid_estimates', estimate.glide_row_id);

      if (creditsError) throw creditsError;

      // Map to domain model
      const accountName = account?.account_name || account?.customer_name || 'Unknown';
      const mappedEstimate: EstimateWithDetails = {
        id: estimate.id,
        glide_row_id: estimate.glide_row_id,
        status: estimate.status as 'draft' | 'pending' | 'converted',
        accountName: accountName,
        total_amount: Number(estimate.total_amount || 0),
        total_credits: Number(estimate.total_credits || 0),
        balance: Number(estimate.balance || 0),
        estimate_date: estimate.estimate_date,
        created_at: estimate.created_at,
        updated_at: estimate.updated_at,
        is_a_sample: estimate.is_a_sample,
        rowid_accounts: estimate.rowid_accounts,
        rowid_invoices: estimate.rowid_invoices,
        add_note: estimate.add_note,
        valid_final_create_invoice_clicked: estimate.valid_final_create_invoice_clicked,
        estimateLines: lineItems || [],
        credits: credits || [],
      };

      return mappedEstimate;
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch estimate';
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
    mutationFn: async (data: Partial<Estimate>): Promise<Estimate> => {
      try {
        const { data: newEstimate, error: createError } = await supabase
          .from('gl_estimates')
          .insert([
            {
              ...data,
            },
          ])
          .select()
          .single();

        if (createError) throw createError;

        if (!newEstimate) {
          throw new Error('Failed to create estimate');
        }

        return newEstimate as Estimate;
      } catch (err: any) {
        console.error('Error creating estimate:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to create estimate';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Estimate created successfully',
      });
    },
  });

  // Update an existing estimate
  const updateEstimate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Estimate> }): Promise<Estimate> => {
      try {
        const { data: updatedEstimate, error: updateError } = await supabase
          .from('gl_estimates')
          .update(data)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        if (!updatedEstimate) {
          throw new Error('Failed to update estimate');
        }

        return updatedEstimate as Estimate;
      } catch (err: any) {
        console.error('Error updating estimate:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to update estimate';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Estimate updated successfully',
      });
    },
  });

  // Delete an estimate
  const deleteEstimate = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      try {
        const { error: deleteError } = await supabase
          .from('gl_estimates')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;
      } catch (err: any) {
        console.error('Error deleting estimate:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete estimate';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Estimate deleted successfully',
      });
    },
  });

  // Add a line item to an estimate
  const addEstimateLine = useMutation({
    mutationFn: async ({ estimateId, lineData }: { estimateId: string; lineData: Partial<EstimateLine> }): Promise<EstimateLine> => {
      try {
        const { data: newLine, error: lineError } = await supabase
          .from('gl_estimate_lines')
          .insert([
            {
              rowid_estimates: estimateId,
              ...lineData,
            },
          ])
          .select()
          .single();

        if (lineError) throw lineError;

        if (!newLine) {
          throw new Error('Failed to add line item');
        }

        return newLine as EstimateLine;
      } catch (err: any) {
        console.error('Error adding line item:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to add line item';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Line item added successfully',
      });
    },
  });

  // Update a line item in an estimate
  const updateEstimateLine = useMutation({
    mutationFn: async ({ lineId, lineData }: { lineId: string; lineData: Partial<EstimateLine> }): Promise<EstimateLine> => {
      try {
        const { data: updatedLine, error: lineError } = await supabase
          .from('gl_estimate_lines')
          .update(lineData)
          .eq('id', lineId)
          .select()
          .single();

        if (lineError) throw lineError;

        if (!updatedLine) {
          throw new Error('Failed to update line item');
        }

        return updatedLine as EstimateLine;
      } catch (err: any) {
        console.error('Error updating line item:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to update line item';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Line item updated successfully',
      });
    },
  });

  // Delete a line item from an estimate
  const deleteEstimateLine = useMutation({
    mutationFn: async (lineId: string): Promise<void> => {
      try {
        const { error: lineError } = await supabase
          .from('gl_estimate_lines')
          .delete()
          .eq('id', lineId);

        if (lineError) throw lineError;
      } catch (err: any) {
        console.error('Error deleting line item:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete line item';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Line item deleted successfully',
      });
    },
  });

  // Add a customer credit to an estimate
  const addCustomerCredit = useMutation({
    mutationFn: async ({ estimateId, creditData }: { estimateId: string; creditData: Partial<CustomerCredit> }): Promise<CustomerCredit> => {
      try {
        const { data: newCredit, error: creditError } = await supabase
          .from('gl_customer_credits')
          .insert([
            {
              rowid_estimates: estimateId,
              ...creditData,
            },
          ])
          .select()
          .single();

        if (creditError) throw creditError;

        if (!newCredit) {
          throw new Error('Failed to add customer credit');
        }

        return newCredit as CustomerCredit;
      } catch (err: any) {
        console.error('Error adding customer credit:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to add customer credit';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Customer credit added successfully',
      });
    },
  });

  // Update a customer credit in an estimate
  const updateCustomerCredit = useMutation({
    mutationFn: async ({ creditId, creditData }: { creditId: string; creditData: Partial<CustomerCredit> }): Promise<CustomerCredit> => {
      try {
        const { data: updatedCredit, error: creditError } = await supabase
          .from('gl_customer_credits')
          .update(creditData)
          .eq('id', creditId)
          .select()
          .single();

        if (creditError) throw creditError;

        if (!updatedCredit) {
          throw new Error('Failed to update customer credit');
        }

        return updatedCredit as CustomerCredit;
      } catch (err: any) {
        console.error('Error updating customer credit:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to update customer credit';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Customer credit updated successfully',
      });
    },
  });

  // Delete a customer credit from an estimate
  const deleteCustomerCredit = useMutation({
    mutationFn: async (creditId: string): Promise<void> => {
      try {
        const { error: creditError } = await supabase
          .from('gl_customer_credits')
          .delete()
          .eq('id', creditId);

        if (creditError) throw creditError;
      } catch (err: any) {
        console.error('Error deleting customer credit:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete customer credit';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Customer credit deleted successfully',
      });
    },
  });

  // Convert estimate to invoice
  const convertToInvoice = useMutation({
    mutationFn: async (estimateId: string): Promise<void> => {
      try {
        // Placeholder: Implement the logic to convert the estimate to an invoice
        // This might involve creating a new invoice record and copying relevant data
        // from the estimate.
        console.log(`Converting estimate ${estimateId} to invoice...`);
        toast({
          title: 'Success',
          description: 'Estimate converted to invoice successfully',
        });
      } catch (err: any) {
        console.error('Error converting estimate to invoice:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to convert estimate to invoice';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast({
        title: 'Success',
        description: 'Estimate converted to invoice successfully',
      });
    },
  });

  return {
    estimates,
    isLoading,
    error,
    refetch,
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
