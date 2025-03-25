
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePurchaseOrdersView } from '@/hooks/purchase-orders/usePurchaseOrdersView';
import { formatCurrency } from '@/utils/format-utils';
import { PurchaseOrderWithVendor, PurchaseOrderFilters } from '@/types/purchaseOrder';
import { StatusBadge } from '@/components/invoices/shared/StatusBadge';
import { PurchaseOrderFilters as FilterComponent } from '@/components/purchase-orders/PurchaseOrderFilters';

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const { fetchPurchaseOrders, isLoading } = usePurchaseOrdersView();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithVendor[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<PurchaseOrderFilters>({});
  
  useEffect(() => {
    loadPurchaseOrders();
  }, []);
  
  const loadPurchaseOrders = async () => {
    try {
      const data = await fetchPurchaseOrders(filters);
      setPurchaseOrders(data || []);
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    }
  };
  
  const handleFilterChange = (newFilters: PurchaseOrderFilters) => {
    setFilters(newFilters);
    // Automatically reload on filter change
    const fetchData = async () => {
      const data = await fetchPurchaseOrders(newFilters);
      setPurchaseOrders(data || []);
    };
    fetchData();
  };
  
  const handleCreatePO = () => {
    navigate('/purchase-orders/new');
  };
  
  const handleViewPO = (id: string) => {
    navigate(`/purchase-orders/${id}`);
  };
  
  const filteredPurchaseOrders = purchaseOrders.filter(po => {
    if (activeTab === 'all') return true;
    if (activeTab === 'draft') return po.status === 'draft';
    if (activeTab === 'sent') return po.status === 'sent';
    if (activeTab === 'received') return po.status === 'received';
    if (activeTab === 'partial') return po.status === 'partial';
    if (activeTab === 'complete') return po.status === 'complete';
    return true;
  });

  if (isLoading && purchaseOrders.length === 0) {
    return (
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
        <Button onClick={handleCreatePO}>
          <Plus className="mr-2 h-4 w-4" /> New Purchase Order
        </Button>
      </div>
      
      <div className="mb-6">
        <FilterComponent 
          filters={filters}
          onChange={handleFilterChange}
        />
      </div>
      
      <Tabs 
        defaultValue="all" 
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="received">Received</TabsTrigger>
          <TabsTrigger value="partial">Partial</TabsTrigger>
          <TabsTrigger value="complete">Complete</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {filteredPurchaseOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPurchaseOrders.map((po) => (
                <Card 
                  key={po.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewPO(po.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 truncate">PO #{po.number}</h3>
                        
                        <div className="text-sm text-muted-foreground mb-2 truncate">
                          {po.vendorName}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {po.date instanceof Date 
                            ? po.date.toLocaleDateString() 
                            : new Date(po.date).toLocaleDateString()}
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <StatusBadge status={po.status} />
                          
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(po.total)}
                            </div>
                            {po.totalPaid > 0 && po.totalPaid < po.total && (
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(po.totalPaid)} paid
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <h3 className="font-medium text-lg mb-2">No purchase orders found</h3>
                <p className="text-muted-foreground mb-4">Create your first purchase order to get started.</p>
                <Button onClick={handleCreatePO}>
                  <Plus className="mr-2 h-4 w-4" /> Create Purchase Order
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
