/**
 * Hook for creating, updating, and managing purchase orders
 * @returns Mutation functions for purchase order operations
 */
import { glPurchaseOrdersService } from "@/services/supabase/tables";
import { PurchaseOrder } from "@/types/purchase-orders/purchaseOrder";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hook for purchase order mutation operations
 */
export function usePurchaseOrderMutation() {
  const queryClient = useQueryClient();

  // Function to safely convert a Date or string to ISO string format
  const toISOString = (dateInput?: Date | string): string | undefined => {
    if (!dateInput) return undefined;

    try {
      // If it's a Date object, use toISOString directly
      if (dateInput instanceof Date) {
        return dateInput.toISOString();
      }
      // If it's a string, convert to Date first
      return new Date(dateInput).toISOString();
    } catch (e) {
      console.error("Error converting date:", e);
      return undefined;
    }
  };

  // Create purchase order mutation
  const createPurchaseOrder = useMutation({
    mutationFn: async (data: Partial<PurchaseOrder>) => {
      // Convert date to ISO string format if it exists
      const poDate = toISOString(data.date) || new Date().toISOString();

      const purchaseOrderData = {
        rowid_accounts: data.vendorId || data.rowid_accounts,
        po_date: poDate,
        purchase_order_uid: data.number,
        notes: data.notes,
        payment_status: data.status || "draft",
        glide_row_id: `PO-${Date.now()}`,
      };

      return await glPurchaseOrdersService.createPurchaseOrder(
        purchaseOrderData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
    },
    onError: (error) => {
      console.error("Error creating purchase order:", error);
    },
  });

  // Update purchase order mutation
  const updatePurchaseOrder = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<PurchaseOrder>;
    }) => {
      // Convert dates to ISO string format if they exist
      const poDate = toISOString(data.date);
      const dueDate = toISOString(data.dueDate);

      const updateData = {
        rowid_accounts: data.vendorId || data.rowid_accounts,
        po_date: poDate,
        purchase_order_uid: data.number,
        notes: data.notes,
        payment_status: data.status,
        date_payment_date_mddyyyy: dueDate,
      };

      return await glPurchaseOrdersService.updatePurchaseOrder(id, updateData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      queryClient.invalidateQueries({
        queryKey: ["purchaseOrder", variables.id],
      });
    },
    onError: (error) => {
      console.error("Error updating purchase order:", error);
    },
  });

  // Generate PDF mutation
  const generatePDF = useMutation({
    mutationFn: async (purchaseOrderId: string): Promise<string> => {
      // Call the Supabase Edge Function to generate the PDF
      const response = await fetch(
        "https://swrfsullhirscyxqneay.supabase.co/functions/v1/generate-purchase-order-pdf",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ poId: purchaseOrderId }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to generate PDF");
      }

      return result.url;
    },
    onError: (error) => {
      console.error("Error generating PDF:", error);
    },
  });

  return {
    createPurchaseOrder,
    updatePurchaseOrder,
    generatePDF,
    isLoading:
      createPurchaseOrder.isPending ||
      updatePurchaseOrder.isPending ||
      generatePDF.isPending,
    error:
      createPurchaseOrder.error ||
      updatePurchaseOrder.error ||
      generatePDF.error,
  };
}
