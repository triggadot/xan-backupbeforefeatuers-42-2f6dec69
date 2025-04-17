/**
 * Hook for creating, updating, and managing estimates
 * @returns Mutation functions for estimate operations
 */
import { useToast } from "@/hooks/utils/use-toast";
import { glEstimatesService } from "@/services/supabase/tables";
import { Estimate } from "@/types/estimates/estimate";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Helper function to ensure status is a valid enum value
const validateStatus = (status: string): "pending" | "draft" | "converted" => {
  if (status === "pending" || status === "draft" || status === "converted") {
    return status;
  }
  return "draft"; // Default fallback
};

// Helper function to convert Date objects to ISO strings
const convertDatesToISOString = (data: any): any => {
  if (!data) return data;

  const result = { ...data };

  // Convert Date objects to strings
  Object.keys(result).forEach((key) => {
    if (result[key] instanceof Date) {
      result[key] = result[key].toISOString();
    }
  });

  return result;
};

export function useEstimateMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create estimate mutation
  const createEstimate = useMutation({
    mutationFn: async (data: Partial<Estimate>): Promise<Estimate> => {
      try {
        // Create a unique glide_row_id if not provided
        const glideRowId = data.glide_row_id || `EST-${Date.now()}`;

        // Ensure status is a valid enum value
        const validStatus = validateStatus(data.status || "draft");

        // Convert Date objects to strings and prepare data
        const convertedData = convertDatesToISOString(data);

        const estimateData = {
          ...convertedData,
          glide_row_id: glideRowId,
          status: validStatus,
          total_amount: data.total_amount || 0,
          total_credits: data.total_credits || 0,
          balance: data.balance || 0,
        };

        // Use the service layer instead of direct Supabase calls
        return await glEstimatesService.createEstimate(estimateData);
      } catch (err) {
        console.error("Error creating estimate:", err);
        toast({
          title: "Error",
          description: "Failed to create estimate",
          variant: "destructive",
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast({
        title: "Success",
        description: "Estimate created successfully",
      });
    },
  });

  // Update estimate mutation
  const updateEstimate = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & Partial<Estimate>): Promise<Estimate> => {
      try {
        // Ensure status is a valid enum value if included
        const updateData = { ...data };
        if (updateData.status) {
          updateData.status = validateStatus(updateData.status);
        }

        // Convert Date objects to strings
        const convertedData = convertDatesToISOString(updateData);

        // Use the service layer instead of direct Supabase calls
        return await glEstimatesService.updateEstimate(id, convertedData);
      } catch (err) {
        console.error("Error updating estimate:", err);
        toast({
          title: "Error",
          description: "Failed to update estimate",
          variant: "destructive",
        });
        throw err;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      queryClient.invalidateQueries({ queryKey: ["estimate", variables.id] });
      toast({
        title: "Success",
        description: "Estimate updated successfully",
      });
    },
  });

  // Delete estimate mutation
  const deleteEstimate = useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      try {
        // Use the service layer instead of direct Supabase calls
        await glEstimatesService.deleteEstimate(id);
        return true;
      } catch (err) {
        console.error("Error deleting estimate:", err);
        toast({
          title: "Error",
          description: "Failed to delete estimate",
          variant: "destructive",
        });
        throw err;
      }
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      queryClient.removeQueries({ queryKey: ["estimate", id] });
      toast({
        title: "Success",
        description: "Estimate deleted successfully",
      });
    },
  });

  // Convert estimate to invoice mutation
  const convertToInvoice = useMutation({
    mutationFn: async (id: string): Promise<any> => {
      try {
        // Fetch the estimate
        const estimate = await glEstimatesService.getEstimateById(id);

        // Create an invoice from the estimate data
        // Note: This would need a specific service method in glEstimatesService
        // For now, we'll assume this is handled through some API call
        const response = await fetch(
          "https://swrfsullhirscyxqneay.supabase.co/functions/v1/convert-estimate-to-invoice",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ estimateId: id }),
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(
            result.error || "Failed to convert estimate to invoice"
          );
        }

        return result;
      } catch (err) {
        console.error("Error converting estimate to invoice:", err);
        toast({
          title: "Error",
          description: "Failed to convert estimate to invoice",
          variant: "destructive",
        });
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({
        title: "Success",
        description: "Estimate converted to invoice successfully",
      });
    },
  });

  return {
    createEstimate,
    updateEstimate,
    deleteEstimate,
    convertToInvoice,
    isLoading:
      createEstimate.isPending ||
      updateEstimate.isPending ||
      deleteEstimate.isPending ||
      convertToInvoice.isPending,
    error:
      createEstimate.error ||
      updateEstimate.error ||
      deleteEstimate.error ||
      convertToInvoice.error,
  };
}
