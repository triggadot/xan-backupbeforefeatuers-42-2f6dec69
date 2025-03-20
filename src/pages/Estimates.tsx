
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { PlusCircle } from 'lucide-react';
import { useEstimates } from '@/hooks/useEstimates';
import EstimateList from '@/components/estimates/EstimateList';
import { Button } from '@/components/ui/button';
import { Estimate } from '@/types/estimate';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EstimateDetail from '@/components/estimates/EstimateDetail';
import EstimateForm from '@/components/estimates/EstimateForm';

const Estimates = () => {
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
  } = useEstimates();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Handle create estimate
  const handleCreateEstimate = async (data: Partial<Estimate>) => {
    await createEstimate.mutateAsync(data);
    setIsCreateDialogOpen(false);
  };

  // View estimate details
  const handleViewEstimate = async (estimate: Estimate) => {
    setDetailsLoading(true);
    const fullEstimate = await getEstimate(estimate.id);
    if (fullEstimate) {
      setSelectedEstimate(fullEstimate);
    }
    setDetailsLoading(false);
  };

  // Back to list view
  const handleBackToList = () => {
    setSelectedEstimate(null);
  };

  // Refresh current estimate
  const handleRefreshEstimate = async () => {
    if (selectedEstimate) {
      setDetailsLoading(true);
      const refreshedEstimate = await getEstimate(selectedEstimate.id);
      if (refreshedEstimate) {
        setSelectedEstimate(refreshedEstimate);
      }
      setDetailsLoading(false);
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
          onUpdate={updateEstimate.mutateAsync}
          onDelete={deleteEstimate.mutateAsync}
          onAddLine={addEstimateLine.mutateAsync}
          onUpdateLine={updateEstimateLine.mutateAsync}
          onDeleteLine={deleteEstimateLine.mutateAsync}
          onAddCredit={addCustomerCredit.mutateAsync}
          onUpdateCredit={updateCustomerCredit.mutateAsync}
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
            error={error}
            onViewEstimate={handleViewEstimate}
          />
        </>
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
