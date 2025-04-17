/**
 * Hook for creating, updating, and deleting invoices
 * @returns Mutation functions for invoice operations
 */
import { glInvoicesService } from "@/services/supabase/tables";
import { UpdateInvoiceInput } from "@/types/invoice";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useInvoiceMutation() {
  const queryClient = useQueryClient();

  // Create invoice mutation
  const createInvoice = useMutation({
    mutationFn: async (data: any) => {
      return await glInvoicesService.createInvoice(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error) => {
      console.error("Error creating invoice:", error);
    },
  });

  // Update invoice mutation
  const updateInvoice = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & UpdateInvoiceInput) => {
      return await glInvoicesService.updateInvoice(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating invoice:", error);
    },
  });

  // Delete invoice mutation
  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      await glInvoicesService.deleteInvoice(id);
      return true;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.removeQueries({ queryKey: ["invoice", id] });
    },
    onError: (error) => {
      console.error("Error deleting invoice:", error);
    },
  });

  return {
    createInvoice,
    updateInvoice,
    deleteInvoice,
    isLoading:
      createInvoice.isPending ||
      updateInvoice.isPending ||
      deleteInvoice.isPending,
    error: createInvoice.error || updateInvoice.error || deleteInvoice.error,
  };
}
