import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstimatesNew } from '@/hooks/useEstimatesNew';
import { Estimate, EstimateWithDetails, EstimateFilters } from '@/types/estimate';
import { EstimateList, EstimateStats } from '@/components/new/estimates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Eye, FileText, Trash, Convert } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import EstimateForm from '@/components/estimates/EstimateForm';
import EstimateDetail from '@/components/estimates/EstimateDetail';

const Estimates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeEstimate, setActiveEstimate] = useState<EstimateWithDetails | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [estimates, setEstimates] = useState<EstimateWithDetails[]>([]);
  const [filters, setFilters] = useState<EstimateFilters>({});

  const {
    fetchEstimates,
    getEstimate,
    createEstimate,
    updateEstimate,
    deleteEstimate,
    addEstimateLine,
    updateEstimateLine,
    deleteEstimateLine,
    addCustomerCredit,
    updateCustomerCredit,
    deleteCustomerCredit,
    convertToInvoice,
    isLoading,
    error
  } = useEstimatesNew();

  useEffect(() => {
    loadEstimates();
  }, []);

  const loadEstimates = async () => {
    const data = await fetchEstimates();
    setEstimates(data);
  };

  const formatDate = (dateString: string | undefined) => {
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

  const filteredEstimates = React.useMemo(() => {
    if (!estimates) return [];
    return estimates.filter(estimate =>
      (estimate.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (estimate.id || '').toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [estimates, searchTerm]);

  const handleViewEstimate = (estimate: Estimate) => {
    navigate(`/estimates/${estimate.id}`);
  };

  const handleCreateEstimate = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditEstimate = (id: string) => {
    navigate(`/estimates/${id}/edit`);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedEstimateId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedEstimateId) {
      try {
        await deleteEstimate(selectedEstimateId);
        toast({
          title: 'Estimate Deleted',
          description: 'The estimate has been successfully deleted.',
        });
        loadEstimates();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete the estimate.',
          variant: 'destructive',
        });
      }
    }
    setIsDeleteAlertOpen(false);
  };

  const handleConvertToInvoice = async (estimateId: string) => {
    try {
      await convertToInvoice(estimateId);
      toast({
        title: 'Estimate Converted',
        description: 'The estimate has been successfully converted to an invoice.',
      });
      loadEstimates();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to convert the estimate to an invoice.',
        variant: 'destructive',
      });
    }
  };

  const handleEstimateCreated = (newEstimate: Estimate) => {
    setIsCreateDialogOpen(false);
    loadEstimates();
    toast({
      title: 'Estimate Created',
      description: 'Your new estimate has been created successfully.',
    });
  };

  // Stats for the dashboard cards
  const totalEstimates = estimates.length;
  const pendingEstimates = estimates.filter(est => est.status === 'pending').length;
  const convertedEstimates = estimates.filter(est => est.status === 'converted').length;
  const totalValue = estimates.reduce((sum, est) => sum + (est.total_amount || 0), 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Estimates</h1>
        <Button onClick={handleCreateEstimate}>
          <Plus className="mr-2 h-4 w-4" /> Create Estimate
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Estimates</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEstimates}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Estimates</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingEstimates}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEstimates > 0 ? ((convertedEstimates / totalEstimates) * 100).toFixed(1) : 0}%</div>
            <p className="text-xs text-muted-foreground">
              {convertedEstimates} of {totalEstimates} converted to invoices
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search estimates..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadEstimates}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Use the new EstimateList component */}
      <EstimateList 
        estimates={filteredEstimates} 
        isLoading={isLoading} 
        onViewEstimate={handleViewEstimate}
        onDelete={handleDeleteClick}
        onConvertToInvoice={handleConvertToInvoice}
      />
      
      {/* Create Estimate Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Estimate</DialogTitle>
          </DialogHeader>
          <EstimateForm onSubmit={handleEstimateCreated} onCancel={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the estimate and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {isDetailsOpen && activeEstimate ? (
        <EstimateDetail
          estimate={activeEstimate}
          isLoading={isLoading}
          onBack={() => {
            setIsDetailsOpen(false);
            setActiveEstimate(null);
          }}
          onRefresh={async () => {
            if (activeEstimate) {
              const updatedEstimate = await getEstimate(activeEstimate.id);
              setActiveEstimate(updatedEstimate);
            }
          }}
          onUpdate={async (id: string, data: Partial<Estimate>) => {
            try {
              const result = await updateEstimate(id, data);
              if (activeEstimate && activeEstimate.id === id) {
                const updatedEstimate = await getEstimate(id);
                if (updatedEstimate) {
                  setActiveEstimate(updatedEstimate);
                }
              }
              loadEstimates();
              return result;
            } catch (error) {
              console.error('Error updating estimate:', error);
              return null;
            }
          }}
          onDelete={handleDeleteEstimate}
          onAddLine={async (estimateGlideId: string, data: Partial<EstimateLine>) => {
            try {
              const result = await addEstimateLine(estimateGlideId, data);
              if (activeEstimate && activeEstimate.glide_row_id === estimateGlideId) {
                const updatedEstimate = await getEstimate(activeEstimate.id);
                if (updatedEstimate) {
                  setActiveEstimate(updatedEstimate);
                }
              }
              return result;
            } catch (error) {
              console.error('Error adding line item:', error);
              return null;
            }
          }}
          onUpdateLine={async (lineId: string, data: Partial<EstimateLine>) => {
            try {
              const result = await updateEstimateLine(lineId, data);
              if (activeEstimate) {
                const updatedEstimate = await getEstimate(activeEstimate.id);
                if (updatedEstimate) {
                  setActiveEstimate(updatedEstimate);
                }
              }
              return result;
            } catch (error) {
              console.error('Error updating line item:', error);
              return null;
            }
          }}
          onDeleteLine={async (lineId: string) => {
            try {
              await deleteEstimateLine(lineId);
              if (activeEstimate) {
                const updatedEstimate = await getEstimate(activeEstimate.id);
                if (updatedEstimate) {
                  setActiveEstimate(updatedEstimate);
                }
              }
              return true;
            } catch (error) {
              console.error('Error deleting line item:', error);
              return false;
            }
          }}
          onAddCredit={async (estimateGlideId: string, data: Partial<CustomerCredit>) => {
            try {
              const result = await addCustomerCredit(estimateGlideId, data);
              if (activeEstimate && activeEstimate.glide_row_id === estimateGlideId) {
                const updatedEstimate = await getEstimate(activeEstimate.id);
                if (updatedEstimate) {
                  setActiveEstimate(updatedEstimate);
                }
              }
              return result;
            } catch (error) {
              console.error('Error adding credit:', error);
              return null;
            }
          }}
          onUpdateCredit={async (creditId: string, data: Partial<CustomerCredit>) => {
            try {
              const result = await updateCustomerCredit(creditId, data);
              if (activeEstimate) {
                const updatedEstimate = await getEstimate(activeEstimate.id);
                if (updatedEstimate) {
                  setActiveEstimate(updatedEstimate);
                }
              }
              return result;
            } catch (error) {
              console.error('Error updating credit:', error);
              return null;
            }
          }}
          onDeleteCredit={async (creditId: string) => {
            try {
              await deleteCustomerCredit(creditId);
              if (activeEstimate) {
                const updatedEstimate = await getEstimate(activeEstimate.id);
                if (updatedEstimate) {
                  setActiveEstimate(updatedEstimate);
                }
              }
              return true;
            } catch (error) {
              console.error('Error deleting credit:', error);
              return false;
            }
          }}
          onConvertToInvoice={handleConvertToInvoice}
        />
      ) : (
        <></>
      )}
    </div>
  );
};

export default Estimates;
