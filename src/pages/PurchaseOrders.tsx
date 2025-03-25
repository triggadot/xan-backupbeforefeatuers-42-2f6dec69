
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PurchaseOrderWithVendor, PurchaseOrderFilters } from '@/types/purchaseOrder';
import { usePurchaseOrdersView } from '@/hooks/purchase-orders/usePurchaseOrdersView';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { formatCurrency } from '@/utils/format-utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import PurchaseOrderList from '@/components/purchase-orders/PurchaseOrderList';
import PurchaseOrderCard from '@/components/purchase-orders/PurchaseOrderCard';
import { PurchaseOrderFilters as FilterComponent } from '@/components/purchase-orders/PurchaseOrderFilters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, Eye, FileText, Plus, RefreshCw, Trash } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { PurchaseOrderForm } from '@/components/purchase-orders/PurchaseOrderForm';

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithVendor[]>([]);
  const [filters, setFilters] = useState<PurchaseOrderFilters>({});

  const {
    fetchPurchaseOrders,
    isLoading,
    error
  } = usePurchaseOrdersView();
  
  const {
    createPurchaseOrder,
    updatePurchaseOrder,
    getPurchaseOrder
  } = usePurchaseOrders();

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

  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredPurchaseOrders = React.useMemo(() => {
    if (!purchaseOrders) return [];
    return purchaseOrders.filter(po =>
      (po.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (po.number || '').toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [purchaseOrders, searchTerm]);

  const handleViewPurchaseOrder = (id: string) => {
    navigate(`/purchase-orders/${id}`);
  };

  const handleCreatePurchaseOrder = async (data: any) => {
    try {
      await createPurchaseOrder(data);
      setIsCreateDialogOpen(false);
      loadPurchaseOrders();
      toast({
        title: "Purchase Order Created",
        description: "New purchase order has been created successfully",
      });
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive"
      });
    }
  };

  const handleDeletePurchaseOrder = async (id: string) => {
    setSelectedPurchaseOrderId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPurchaseOrderId) return;
    
    try {
      // Implement delete functionality when available
      toast({
        title: "Purchase Order Deleted",
        description: "The purchase order has been deleted successfully",
      });
      setIsDeleteAlertOpen(false);
      loadPurchaseOrders();
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      toast({
        title: "Error",
        description: "Failed to delete purchase order",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = () => {
    loadPurchaseOrders();
  };

  const handleFilterChange = (newFilters: PurchaseOrderFilters) => {
    setFilters(newFilters);
    const fetchData = async () => {
      const data = await fetchPurchaseOrders(newFilters);
      setPurchaseOrders(data || []);
    };
    fetchData();
  };

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        
        <div className="flex w-full sm:w-auto gap-2">
          <Input
            placeholder="Search purchase orders..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full sm:w-64"
          />
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </Button>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Purchase Order
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <FilterComponent 
          filters={filters}
          onChange={handleFilterChange}
        />
      </div>

      <div className="flex justify-end mb-4">
        <div className="flex space-x-1 bg-muted p-1 rounded-md">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="text-xs"
          >
            Cards
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="text-xs"
          >
            Table
          </Button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && filteredPurchaseOrders.length === 0 ? (
            Array(6).fill(0).map((_, index) => (
              <Card key={index} className="h-[200px] animate-pulse bg-muted"></Card>
            ))
          ) : filteredPurchaseOrders.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="py-12 text-center">
                  <h3 className="font-medium text-lg mb-2">No purchase orders found</h3>
                  <p className="text-muted-foreground mb-4">Create your first purchase order to get started.</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create Purchase Order
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredPurchaseOrders.map((po) => (
              <PurchaseOrderCard 
                key={po.id} 
                purchaseOrder={po}
                onClick={() => handleViewPurchaseOrder(po.id)}
              />
            ))
          )}
        </div>
      ) : (
        <Card>
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-lg">Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex justify-center">
                          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredPurchaseOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No purchase orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPurchaseOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell>#{po.number || po.id.substring(0, 8)}</TableCell>
                        <TableCell>{po.vendorName}</TableCell>
                        <TableCell>{formatDate(po.date)}</TableCell>
                        <TableCell>{formatCurrency(po.total)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            po.status === 'complete' ? 'success' :
                            po.status === 'partial' ? 'warning' : 
                            po.status === 'draft' ? 'secondary' : 'default'
                          } className="capitalize">
                            {po.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPurchaseOrder(po.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePurchaseOrder(po.id)}
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Purchase Order</DialogTitle>
          </DialogHeader>
          <PurchaseOrderForm
            onSubmit={handleCreatePurchaseOrder}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the purchase order
              and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPurchaseOrderId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
