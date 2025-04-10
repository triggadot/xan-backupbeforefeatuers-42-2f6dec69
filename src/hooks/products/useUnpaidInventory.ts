import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/products';
import { formatCurrency } from '@/utils/format';

export interface UnpaidInventoryItem extends Product {
  vendor_name?: string;
  total_qty_purchased: number;
  cost: number;
  total_cost: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  payment_amount?: number;
  remaining_balance: number;
  due_date?: Date | null;
}

/**
 * Hook for fetching unpaid inventory data
 * Retrieves products that have been received but not fully paid for
 * Calculates remaining balance and payment status
 */
export const useUnpaidInventory = () => {
  return useQuery({
    queryKey: ['unpaid-inventory'],
    queryFn: async (): Promise<UnpaidInventoryItem[]> => {
      // Fetch products that are not fully paid
      const { data: products, error } = await supabase
        .from('gl_products')
        .select(`
          *,
          gl_accounts!rowid_accounts(
            account_name
          ),
          gl_vendor_payments!rowid_vendor_payments(
            payment_amount
          )
        `)
        .eq('samples_or_fronted', false) // Exclude sample/fronted products
        .is('rowid_purchase_orders', null); // Only include products not associated with POs
      
      if (error) throw new Error(`Error fetching unpaid inventory: ${error.message}`);
      
      // Transform and calculate derived fields
      const unpaidItems = products.map(product => {
        const vendorName = product.gl_accounts?.[0]?.account_name || 'Unknown Vendor';
        const totalQty = product.total_qty_purchased || 0;
        const unitCost = product.cost || 0;
        const totalCost = totalQty * unitCost;
        
        // Calculate payment amount from related vendor payments
        const paymentAmount = product.gl_vendor_payments?.reduce(
          (sum, payment) => sum + (payment.payment_amount || 0), 
          0
        ) || 0;
        
        // Calculate remaining balance
        const remainingBalance = totalCost - paymentAmount;
        
        // Determine payment status
        let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
        if (remainingBalance <= 0) {
          paymentStatus = 'paid';
        } else if (paymentAmount > 0) {
          paymentStatus = 'partial';
        }
        
        // Only include items that are unpaid or partially paid
        if (paymentStatus === 'paid') return null;
        
        return {
          ...product,
          vendor_name: vendorName,
          total_qty_purchased: totalQty,
          cost: unitCost,
          total_cost: totalCost,
          payment_status: paymentStatus,
          payment_amount: paymentAmount,
          remaining_balance: remainingBalance,
          // For display purposes
          formattedCost: formatCurrency(unitCost),
          formattedTotalCost: formatCurrency(totalCost),
          formattedRemainingBalance: formatCurrency(remainingBalance)
        };
      }).filter(Boolean) as UnpaidInventoryItem[];
      
      return unpaidItems;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Export the hook to be used in components
export default useUnpaidInventory;
