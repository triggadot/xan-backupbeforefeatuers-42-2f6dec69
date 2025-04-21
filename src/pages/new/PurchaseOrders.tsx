import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchaseOrders } from '@/hooks/purchase-orders';
import { PurchaseOrder, PurchaseOrderFilters } from '@/types/purchaseOrder';
import PurchaseOrderList from '@/components/new/purchase-orders/purchase-order-list';
import PurchaseOrderStats from '@/components/new/purchase-orders/purchase-order-stats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/utils/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Container } from '@/components/ui/container';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

const PurchaseOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<PurchaseOrderFilters>({});
  
  const { purchaseOrders, isLoading, error, fetchPurchaseOrders } = usePurchaseOrders(filters);

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
      
      // Delete products associated with the purchase order (they serve as line items)
      const { error: productsError } = await supabase
        .from('gl_products')
        .delete()
        .eq('rowid_purchase_orders', purchaseOrder.glide_row_id);
      
      if (productsError) throw productsError;
      
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

  // Debug function to check database tables
  const checkDatabase = async () => {
    try {
      // Check purchase orders table
      const { data: purchaseOrdersData, error: purchaseOrdersError } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .limit(10);
      
      console.log('Purchase Orders in DB:', purchaseOrdersData);
      
      if (purchaseOrdersError) {
        console.error('Error fetching purchase orders:', purchaseOrdersError);
        toast({
          title: 'Database Error',
          description: 'Error fetching purchase orders: ' + purchaseOrdersError.message,
          variant: 'destructive',
        });
        return;
      }
      
      if (!purchaseOrdersData || purchaseOrdersData.length === 0) {
        toast({
          title: 'No Purchase Orders',
          description: 'No purchase orders found in the database.',
          variant: 'destructive',
        });
        return;
      }
      
      // Check if we have any products linked to purchase orders
      const { data: productsData, error: productsError } = await supabase
        .from('gl_products')
        .select('*')
        .eq('rowid_purchase_orders', purchaseOrdersData[0].glide_row_id)
        .limit(10);
      
      console.log('Products linked to first PO:', productsData);
      
      if (productsError) {
        console.error('Error fetching products:', productsError);
      }
      
      toast({
        title: 'Database Check',
        description: `Found ${purchaseOrdersData.length} purchase orders and ${productsData?.length || 0} linked products.`,
      });
    } catch (err) {
      console.error('Error checking database:', err);
      toast({
        title: 'Error',
        description: 'An error occurred while checking the database.',
        variant: 'destructive',
      });
    }
  };

  // Use motion for smooth transitions when data loads
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <Container mobileBottomSpace>
      <motion.div 
        className="space-y-6 pb-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <motion.h1 
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            variants={itemVariants}
          >
            Purchase Orders
          </motion.h1>
          <motion.div 
            className="flex flex-wrap gap-2 w-full sm:w-auto"
            variants={itemVariants}
          >
            {!isMobile && (
              <Button onClick={checkDatabase} variant="outline" size="sm">
                Check Database
              </Button>
            )}
            <Button onClick={fetchPurchaseOrders} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleCreatePurchaseOrder} size="sm" className="sm:ml-2 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Order
            </Button>
          </motion.div>
        </div>
        
        <motion.div variants={itemVariants}>
          <PurchaseOrderStats purchaseOrders={purchaseOrders} isLoading={isLoading} />
        </motion.div>
        
        <motion.div 
          className="flex justify-between items-center"
          variants={itemVariants}
        >
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
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <PurchaseOrderList 
            purchaseOrders={filteredPurchaseOrders} 
            isLoading={isLoading} 
            onViewPurchaseOrder={handleViewPurchaseOrder}
            onDelete={handleDeletePurchaseOrder}
          />
        </motion.div>
      </motion.div>
    </Container>
  );
};

export default PurchaseOrders;
