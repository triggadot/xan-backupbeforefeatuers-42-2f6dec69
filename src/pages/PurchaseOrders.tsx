import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PurchaseOrderWithVendor, PurchaseOrderFilters } from '@/types/purchaseOrder';
import { usePurchaseOrdersView } from '@/hooks/purchase-orders/usePurchaseOrdersView';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useToast } from '@/hooks/use-toast';
import { EnhancedPurchaseOrderTable } from '@/components/purchase-orders/EnhancedPurchaseOrderTable';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PurchaseOrderList from '@/components/purchase-orders/PurchaseOrderList';
import PurchaseOrderCard from '@/components/purchase-orders/PurchaseOrderCard';
import { Input } from '@/components/ui/input';

// Extended interface to handle PDF links
interface ExtendedPurchaseOrder extends PurchaseOrderWithVendor {
  pdfLink?: string; // Legacy field - Internal Glide use only
  pdf_link?: string; // Internal Glide use only
  supabase_pdf_url?: string; // Supabase storage URL for PDFs
}

function PurchaseOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<ExtendedPurchaseOrder | null>(null);
  const [activeView, setActiveView] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<PurchaseOrderFilters>({});

  // Use the hooks
  const { 
    purchaseOrders, 
    isLoading, 
    error, 
    fetchPurchaseOrders,
    refetch
  } = usePurchaseOrdersView();
  
  const purchaseOrdersHook = usePurchaseOrders();

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      await fetchPurchaseOrders();
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    }
  };

  const handleCreatePurchaseOrder = () => {
    navigate('/purchase-orders/create');
  };

  const handleViewPurchaseOrder = (id: string) => {
    navigate(`/purchase-orders/${id}`);
  };

  const handleEditPurchaseOrder = (id: string) => {
    navigate(`/purchase-orders/edit/${id}`);
  };

  const handleDeletePurchaseOrder = (purchaseOrder: ExtendedPurchaseOrder) => {
    setSelectedPurchaseOrder(purchaseOrder);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPurchaseOrder) return;
    
    try {
      // Implement delete functionality when available
      // This would use your actual delete method from your hooks
      toast({
        title: 'Purchase Order Deleted',
        description: `Purchase order ${selectedPurchaseOrder.number} has been deleted.`,
      });
      await loadPurchaseOrders();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete purchase order.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedPurchaseOrder(null);
    }
  };

  const handleRefresh = () => {
    loadPurchaseOrders();
  };

  const handleFilterChange = (newFilters: PurchaseOrderFilters) => {
    setFilters(newFilters);
    // Apply filters logic here
    const fetchData = async () => {
      await fetchPurchaseOrders();
    };
    fetchData();
  };

  const handleViewPdf = (purchaseOrder: ExtendedPurchaseOrder) => {
    // Prioritize Supabase PDF URL, then fall back to legacy fields
    const pdfUrl = purchaseOrder.supabase_pdf_url || purchaseOrder.pdfLink || purchaseOrder.pdf_link;
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      toast({
        title: 'PDF Not Available',
        description: 'The PDF for this purchase order is not available.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPdf = (purchaseOrder: ExtendedPurchaseOrder) => {
    // Prioritize Supabase PDF URL, then fall back to legacy fields
    const pdfUrl = purchaseOrder.supabase_pdf_url || purchaseOrder.pdfLink || purchaseOrder.pdf_link;
    if (pdfUrl) {
      // Create a temporary anchor element to trigger download
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `${purchaseOrder.number || 'purchase-order'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      toast({
        title: 'PDF Not Available',
        description: 'The PDF for this purchase order is not available.',
        variant: 'destructive',
      });
    }
  };

  // Cast purchaseOrders to ExtendedPurchaseOrder[] to handle the type mismatch
  const extendedPurchaseOrders = purchaseOrders as unknown as ExtendedPurchaseOrder[];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleCreatePurchaseOrder}>
            <Plus className="mr-2 h-4 w-4" />
            New Purchase Order
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'table' | 'cards')}>
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="cards">Card View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="table" className="space-y-4">
          <EnhancedPurchaseOrderTable 
            purchaseOrders={extendedPurchaseOrders}
            isLoading={isLoading}
            onViewPdf={handleViewPdf}
            onDownloadPdf={handleDownloadPdf}
            onCreatePurchaseOrder={handleCreatePurchaseOrder}
          />
        </TabsContent>
        
        <TabsContent value="cards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : purchaseOrders.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">No purchase orders found.</p>
                <Button onClick={handleCreatePurchaseOrder}>
                  <Plus className="mr-2 h-4 w-4" /> Create Purchase Order
                </Button>
              </div>
            ) : (
              purchaseOrders.map((po) => (
                <PurchaseOrderCard 
                  key={po.id} 
                  purchaseOrder={po}
                  onClick={() => handleViewPurchaseOrder(po.id)}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete purchase order {selectedPurchaseOrder?.number}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default PurchaseOrders;
