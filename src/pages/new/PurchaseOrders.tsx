import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchaseOrdersNew } from '@/hooks/usePurchaseOrdersNew';
import { PurchaseOrder, PurchaseOrderFilters } from '@/types/purchaseOrder';
import { PurchaseOrderList, PurchaseOrderStats } from '@/components/new/purchase-orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PurchaseOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<PurchaseOrderFilters>({});
  
  const { purchaseOrders, isLoading, error, fetchPurchaseOrders } = usePurchaseOrdersNew(filters);

  const filteredPurchaseOrders = purchaseOrders.filter(po =>
    (po.vendor?.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (po.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (po.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleCreatePurchaseOrder = () => {
    navigate('/purchase-orders/new');
  };

  const handleViewPurchaseOrder = (purchaseOrder: PurchaseOrder) => {
    navigate(`/purchase-orders/${purchaseOrder.id}`);
  };
  
  const handleDeletePurchaseOrder = async (id: string) => {
    try {
      // First get the purchase order to get the glide_row_id
      const { data: purchaseOrder, error: getError }: { data: { glide_row_id: string } | null, error: any } = await supabase
        .from('gl_purchase_orders')
        .select('glide_row_id')
        .eq('id', id)
        .single();
      
      if (getError) throw getError;
      if (!purchaseOrder) throw new Error('Purchase order not found');
      
      // Delete purchase order lines first
      const { error: linesError } = await supabase
        .from('gl_purchase_order_lines')
        .delete()
        .eq('rowid_purchase_orders', purchaseOrder.glide_row_id);
      
      if (linesError) throw linesError;
      
      // Delete payments associated with the purchase order
      const { error: paymentsError } = await supabase
        .from('gl_vendor_payments')
        .delete()
        .eq('rowid_purchase_orders', purchaseOrder.glide_row_id);
      
      if (paymentsError) throw paymentsError;
      
      // Delete the purchase order
      const { error: deleteError } = await supabase
        .from('gl_purchase_orders')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      toast({
        title: 'Success',
        description: 'Purchase order has been deleted.',
      });
      
      // Refresh the list
      fetchPurchaseOrders();
    } catch (err) {
      console.error('Error deleting purchase order:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete purchase order.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
        <Button onClick={handleCreatePurchaseOrder}>
          <Plus className="mr-2 h-4 w-4" /> Create Purchase Order
        </Button>
      </div>
      
      <PurchaseOrderStats purchaseOrders={purchaseOrders} isLoading={isLoading} />
      
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search purchase orders..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPurchaseOrders()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      <PurchaseOrderList 
        purchaseOrders={filteredPurchaseOrders} 
        isLoading={isLoading} 
        onViewPurchaseOrder={handleViewPurchaseOrder}
        onDelete={handleDeletePurchaseOrder}
      />
    </div>
  );
};

export default PurchaseOrders;
