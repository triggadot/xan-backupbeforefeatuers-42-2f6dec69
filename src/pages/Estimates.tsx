import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { PlusCircle } from 'lucide-react';
import { useEstimatesNew } from '@/hooks/useEstimatesNew';
import EstimateList from '@/components/estimates/EstimateList';
import { Button } from '@/components/ui/button';
import { Estimate, EstimateWithDetails, EstimateLine, CustomerCredit } from '@/types/estimate';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EstimateDetail from '@/components/estimates/EstimateDetail';
import EstimateForm from '@/components/estimates/EstimateForm';
import { useToast } from '@/hooks/use-toast';

const Estimates = () => {
  const { toast } = useToast();
  
  const {
    estimates,
    isLoading,
    error,
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
    convertToInvoice
  } = useEstimatesNew();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<EstimateWithDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Handle create estimate
  const handleCreateEstimate = async (data: Partial<Estimate>) => {
    try {
      await createEstimate.mutateAsync(data);
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Estimate created successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create estimate",
        variant: "destructive",
      });
    }
  };

  // View estimate details
  const handleViewEstimate = async (estimate: Estimate) => {
    setDetailsLoading(true);
    try {
      const fullEstimate = await getEstimate(estimate.id);
      if (fullEstimate) {
        setSelectedEstimate(fullEstimate as EstimateWithDetails);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load estimate details",
        variant: "destructive",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  // Back to list view
  const handleBackToList = () => {
    setSelectedEstimate(null);
  };

  // Refresh current estimate
  const handleRefreshEstimate = async () => {
    if (selectedEstimate) {
      setDetailsLoading(true);
      try {
        const refreshedEstimate = await getEstimate(selectedEstimate.id);
        if (refreshedEstimate) {
          setSelectedEstimate(refreshedEstimate as EstimateWithDetails);
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to refresh estimate",
          variant: "destructive",
        });
      } finally {
        setDetailsLoading(false);
      }
    }
  };

  // Wrapper functions for type safety
  const handleUpdateEstimate = async (id: string, data: Partial<Estimate>) => {
    try {
      const result = await updateEstimate.mutateAsync({ id, data });
      return result as unknown as Estimate;
    } catch (err) {
      return null;
    }
  };

  const handleAddLine = async (estimateGlideId: string, data: Partial<EstimateLine>) => {
    try {
      return await addEstimateLine.mutateAsync({ estimateId: estimateGlideId, lineData: data });
    } catch (err) {
      return null;
    }
  };

  const handleUpdateLine = async (lineId: string, data: Partial<EstimateLine>) => {
    try {
      return await updateEstimateLine.mutateAsync({ lineId, lineData: data });
    } catch (err) {
      return null;
    }
  };

  const handleAddCredit = async (estimateGlideId: string, data: Partial<CustomerCredit>) => {
    try {
      return await addCustomerCredit.mutateAsync({ estimateId: estimateGlideId, creditData: data });
    } catch (err) {
      return null;
    }
  };

  const handleUpdateCredit = async (creditId: string, data: Partial<CustomerCredit>) => {
    try {
      return await updateCustomerCredit.mutateAsync({ creditId, creditData: data });
    } catch (err) {
      return null;
    }
  };

  return (
    <div className="container py-6 space-y-6 animate-enter-bottom">
      <Helmet>
        <title>Estimates | Billow</title>
      </Helmet>

      {selectedEstimate ? (
        <EstimateDetail
          estimate={selectedEstimate}
          isLoading={detailsLoading}
          onBack={handleBackToList}
          onRefresh={handleRefreshEstimate}
          onUpdate={handleUpdateEstimate}
          onDelete={deleteEstimate.mutateAsync}
          onAddLine={handleAddLine}
          onUpdateLine={handleUpdateLine}
          onDeleteLine={deleteEstimateLine.mutateAsync}
          onAddCredit={handleAddCredit}
          onUpdateCredit={handleUpdateCredit}
          onDeleteCredit={deleteCustomerCredit.mutateAsync}
          onConvertToInvoice={convertToInvoice.mutateAsync}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Estimates</h1>
              <p className="text-muted-foreground">
                Create and manage customer estimates
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-1 h-4 w-4" /> New Estimate
            </Button>
          </div>

          <EstimateList
            estimates={estimates}
            isLoading={isLoading}
            error={error as string}
            onViewEstimate={handleViewEstimate}
          />
        </>
      )}

      {error && (
        <div className="text-center py-6 text-destructive">
          {(error as Error).message || String(error)}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create Estimate</DialogTitle>
          </DialogHeader>
          <EstimateForm
            onSubmit={handleCreateEstimate}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Estimates;
