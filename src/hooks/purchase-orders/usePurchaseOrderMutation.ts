
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/utils/use-toast';
import { PurchaseOrder } from '@/types/purchase-orders/purchaseOrder';

/**
 * Hook for creating and updating purchase orders in the database
 */
export function usePurchaseOrderMutation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

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
      console.error('Error converting date:', e);
      return undefined;
    }
  };

  // Create a new purchase order
  const createPurchaseOrder = async (data: Partial<PurchaseOrder>) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Convert date to ISO string format if it exists
      const poDate = toISOString(data.date) || new Date().toISOString();

      const { data: newPo, error } = await supabase
        .from('gl_purchase_orders')
        .insert({
          rowid_accounts: data.vendorId || data.rowid_accounts,
          po_date: poDate,
          purchase_order_uid: data.number,
          notes: data.notes,
          payment_status: data.status || 'draft',
          glide_row_id: `PO-${Date.now()}`
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Purchase Order Created',
        description: 'New purchase order has been created successfully.'
      });

      return newPo;
    } catch (err) {
      console.error('Error creating purchase order:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create purchase order',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update an existing purchase order
  const updatePurchaseOrder = async (id: string, data: Partial<PurchaseOrder>) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Convert dates to ISO string format if they exist
      const poDate = toISOString(data.date);
      const dueDate = toISOString(data.dueDate);

      const { data: updatedPo, error } = await supabase
        .from('gl_purchase_orders')
        .update({
          rowid_accounts: data.vendorId || data.rowid_accounts,
          po_date: poDate,
          purchase_order_uid: data.number,
          notes: data.notes,
          payment_status: data.status,
          date_payment_date_mddyyyy: dueDate
        })
        .eq('glide_row_id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Purchase Order Updated',
        description: 'Purchase order has been updated successfully.'
      });

      return updatedPo;
    } catch (err) {
      console.error('Error updating purchase order:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update purchase order',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate a PDF for a purchase order
   * 
   * @param purchaseOrderId - The glide_row_id of the purchase order
   * @returns The URL of the generated PDF
   */
  const generatePDF = async (purchaseOrderId: string): Promise<string> => {
    setIsLoading(true);
    setError('');
    
    try {
      // Call the Supabase Edge Function to generate the PDF
      const response = await fetch(
        'https://swrfsullhirscyxqneay.supabase.co/functions/v1/generate-purchase-order-pdf',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ poId: purchaseOrderId }),
        }
      );
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate PDF');
      }
      
      toast({
        title: 'PDF Generated',
        description: 'Purchase order PDF has been generated successfully.'
      });
      
      return result.url;
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to generate PDF',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createPurchaseOrder,
    updatePurchaseOrder,
    generatePDF,
    isLoading,
    error
  };
}
