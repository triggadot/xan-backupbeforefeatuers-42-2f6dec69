import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstimatesNew } from '@/hooks/useEstimatesNew';
import { Estimate, EstimateWithDetails, EstimateLine, CustomerCredit } from '@/types/estimate';
import EstimateList from '@/components/estimates/EstimateList';
import EstimateDetail from '@/components/estimates/EstimateDetail';
import EstimateForm from '@/components/estimates/EstimateForm';
import { formatCurrency } from '@/utils/format-utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
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

  const handleViewEstimate = async (id: string) => {
    try {
      const details = await getEstimate(id);
      if (details) {
        setActiveEstimate(details);
        setIsDetailsOpen(true);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load estimate details.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error loading estimate details:', err);
      toast({
        title: 'Error',
        description: 'Failed to load estimate details.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateEstimate = async (data: Partial<EstimateWithDetails>) => {
    try {
      await createEstimate.mutateAsync(data);
      setIsCreateDialogOpen(false);
      loadEstimates();
      return null;
    } catch (error) {
      console.error('Error creating estimate:', error);
      return null;
    }
  };

  const handleUpdateEstimate = async (id: string, data: Partial<Estimate>): Promise<Estimate | null> => {
    try {
      const result = await updateEstimate.mutateAsync({ id, ...data });
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
  };

  const handleDeleteEstimate = async (id: string): Promise<boolean> => {
    try {
      await deleteEstimate.mutateAsync(id);
      if (isDetailsOpen && activeEstimate?.id === id) {
        setIsDetailsOpen(false);
        setActiveEstimate(null);
      }
      loadEstimates();
      return true;
    } catch (error) {
      console.error('Error deleting estimate:', error);
      return false;
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedEstimateId) {
      try {
        await handleDeleteEstimate(selectedEstimateId);
        setIsDeleteAlertOpen(false);
        setSelectedEstimateId(null);
      } catch (error) {
        console.error('Error deleting estimate:', error);
      }
    }
  };

  const handleAddLine = async (estimateGlideId: string, data: Partial<EstimateLine>): Promise<EstimateLine | null> => {
    try {
      const result = await addEstimateLine.mutateAsync({ 
        estimateGlideId, 
        data
      });
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
  };

  const handleUpdateLine = async (lineId: string, data: Partial<EstimateLine>): Promise<EstimateLine | null> => {
    try {
      const result = await updateEstimateLine.mutateAsync({ 
        lineId, 
        data
      });
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
  };

  const handleDeleteLine = async (lineId: string): Promise<boolean> => {
    try {
      await deleteEstimateLine.mutateAsync(lineId);
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
  };

  const handleAddCredit = async (estimateGlideId: string, data: Partial<CustomerCredit>): Promise<CustomerCredit | null> => {
    try {
      const result = await addCustomerCredit.mutateAsync({ 
        estimateGlideId, 
        data
      });
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
  };

  const handleUpdateCredit = async (creditId: string, data: Partial<CustomerCredit>): Promise<CustomerCredit | null> => {
    try {
      const result = await updateCustomerCredit.mutateAsync({ 
        creditId, 
        data
      });
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
  };

  const handleDeleteCredit = async (creditId: string): Promise<boolean> => {
    try {
      await deleteCustomerCredit.mutateAsync(creditId);
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
  };

  const handleConvertToInvoice = async (id: string): Promise<any> => {
    try {
      const result = await convertToInvoice.mutateAsync(id);
      if (activeEstimate && activeEstimate.id === id) {
        const updatedEstimate = await getEstimate(id);
        if (updatedEstimate) {
          setActiveEstimate(updatedEstimate);
        }
      }
      return result;
    } catch (error) {
      console.error('Error converting to invoice:', error);
      return null;
    }
  };

  const handleRefresh = () => {
    loadEstimates();
    if (activeEstimate) {
      handleViewEstimate(activeEstimate.id);
    }
  };

  return (
    <div className="container py-6 max-w-7xl">
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
          onUpdate={handleUpdateEstimate}
          onDelete={handleDeleteEstimate}
          onAddLine={handleAddLine}
          onUpdateLine={handleUpdateLine}
          onDeleteLine={handleDeleteLine}
          onAddCredit={handleAddCredit}
          onUpdateCredit={handleUpdateCredit}
          onDeleteCredit={handleDeleteCredit}
          onConvertToInvoice={handleConvertToInvoice}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold">Estimates</h1>
            
            <div className="flex w-full sm:w-auto gap-2">
              <Input
                placeholder="Search estimates..."
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
                New Estimate
              </Button>
            </div>
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
            <EstimateList 
              estimates={filteredEstimates} 
              isLoading={isLoading} 
              error={error}
              onViewEstimate={(estimate) => handleViewEstimate(estimate.id)}
            />
          ) : (
            <Card>
              <CardHeader className="px-6 py-4">
                <CardTitle className="text-lg">Estimates</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estimate #</TableHead>
                        <TableHead>Customer</TableHead>
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
                      ) : filteredEstimates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No estimates found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEstimates.map((estimate) => (
                          <TableRow key={estimate.id}>
                            <TableCell>#{estimate.glide_row_id?.substring(4, 10)}</TableCell>
                            <TableCell>{estimate.accountName}</TableCell>
                            <TableCell>{formatDate(estimate.estimate_date as string)}</TableCell>
                            <TableCell>${estimate.total_amount?.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={
                                estimate.status === 'converted' ? 'success' :
                                estimate.status === 'pending' ? 'warning' : 'secondary'
                              }>
                                {estimate.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewEstimate(estimate.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {estimate.status !== 'converted' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteEstimate(estimate.id)}
                                  >
                                    <Trash className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </>
                              )}
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
        </>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Estimate</DialogTitle>
          </DialogHeader>
          <EstimateForm
            onSubmit={handleCreateEstimate}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the estimate
              and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedEstimateId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Estimates;
