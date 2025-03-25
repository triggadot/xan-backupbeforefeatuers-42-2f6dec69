
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStandardizedPurchaseOrders } from '@/hooks/purchase-orders/useStandardizedPurchaseOrders';
import PurchaseOrderList from '@/components/purchase-orders/PurchaseOrderList';
import { PurchaseOrderFilters } from '@/components/purchase-orders/PurchaseOrderFilters';
import { PurchaseOrderFilters as FilterOptions } from '@/types/purchaseOrder';

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const { fetchPurchaseOrders, isLoading } = useStandardizedPurchaseOrders();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filters, setFilters] = useState<FilterOptions>({});
  
  useEffect(() => {
    loadPurchaseOrders();
  }, []);
  
  const loadPurchaseOrders = async () => {
    try {
      const orders = await fetchPurchaseOrders(filters);
      setPurchaseOrders(orders || []);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    }
  };
  
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // We could automatically reload on filter change
    loadPurchaseOrders();
  };
  
  const handleCreatePO = () => {
    navigate('/purchase-orders/new');
  };
  
  const handleViewPO = (id: string) => {
    navigate(`/purchase-orders/${id}`);
  };
  
  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <Button onClick={handleCreatePO}>
          <Plus className="mr-2 h-4 w-4" /> New Purchase Order
        </Button>
      </div>
      
      <div className="mb-6">
        <PurchaseOrderFilters 
          filters={filters}
          onChange={handleFilterChange}
        />
      </div>
      
      <PurchaseOrderList 
        purchaseOrders={purchaseOrders}
        isLoading={isLoading}
        error={null}
        onView={handleViewPO}
      />
    </div>
  );
}
