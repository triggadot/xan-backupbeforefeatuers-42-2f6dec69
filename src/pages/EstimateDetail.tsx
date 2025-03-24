
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEstimatesNew } from '@/hooks/useEstimatesNew';
import EstimateDetail from '@/components/estimates/EstimateDetail';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EstimateLine, CustomerCredit } from '@/types/estimate';

const EstimateDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<any>(null);

  const { 
    getEstimate, 
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

  useEffect(() => {
    const fetchEstimateDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getEstimate(id);
        setEstimate(data);
      } catch (err) {
        console.error('Error fetching estimate details:', err);
        setError('Failed to load estimate details. Please try again.');
        toast({
          title: 'Error',
          description: 'Failed to load estimate details.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstimateDetails();
  }, [id, getEstimate, toast]);

  const handleUpdateEstimate = async (id: string, data: any) => {
    try {
      const result = await updateEstimate.mutateAsync({ id, ...data });
      // Refresh estimate data
      const updatedEstimate = await getEstimate(id);
      setEstimate(updatedEstimate);
      return updatedEstimate;
    } catch (error) {
      console.error('Error updating estimate:', error);
      return null;
    }
  };

  const handleDeleteEstimate = async (id: string) => {
    try {
      await deleteEstimate.mutateAsync(id);
      navigate('/estimates');
      return true;
    } catch (error) {
      console.error('Error deleting estimate:', error);
      return false;
    }
  };

  const handleAddLine = async (estimateGlideId: string, data: Partial<EstimateLine>) => {
    try {
      const result = await addEstimateLine.mutateAsync({ 
        estimateGlideId, 
        data: data as any 
      });
      // Refresh estimate data
      const updatedEstimate = await getEstimate(id as string);
      setEstimate(updatedEstimate);
      return updatedEstimate.estimateLines?.find(line => 
        line.sale_product_name === data.sale_product_name
      ) || null;
    } catch (error) {
      console.error('Error adding line item:', error);
      return null;
    }
  };

  const handleUpdateLine = async (lineId: string, data: Partial<EstimateLine>) => {
    try {
      const result = await updateEstimateLine.mutateAsync({ 
        lineId, 
        data: data as any 
      });
      // Refresh estimate data
      const updatedEstimate = await getEstimate(id as string);
      setEstimate(updatedEstimate);
      return updatedEstimate.estimateLines?.find(line => line.id === lineId) || null;
    } catch (error) {
      console.error('Error updating line item:', error);
      return null;
    }
  };

  const handleDeleteLine = async (lineId: string) => {
    try {
      await deleteEstimateLine.mutateAsync(lineId);
      // Refresh estimate data
      const updatedEstimate = await getEstimate(id as string);
      setEstimate(updatedEstimate);
      return true;
    } catch (error) {
      console.error('Error deleting line item:', error);
      return false;
    }
  };

  const handleAddCredit = async (estimateGlideId: string, data: Partial<CustomerCredit>) => {
    try {
      const result = await addCustomerCredit.mutateAsync({ 
        estimateGlideId, 
        data: data as any 
      });
      // Refresh estimate data
      const updatedEstimate = await getEstimate(id as string);
      setEstimate(updatedEstimate);
      return updatedEstimate.credits?.find(credit => 
        credit.payment_amount === data.payment_amount
      ) || null;
    } catch (error) {
      console.error('Error adding credit:', error);
      return null;
    }
  };

  const handleUpdateCredit = async (creditId: string, data: Partial<CustomerCredit>) => {
    try {
      const result = await updateCustomerCredit.mutateAsync({ 
        creditId, 
        data: data as any 
      });
      // Refresh estimate data
      const updatedEstimate = await getEstimate(id as string);
      setEstimate(updatedEstimate);
      return updatedEstimate.credits?.find(credit => credit.id === creditId) || null;
    } catch (error) {
      console.error('Error updating credit:', error);
      return null;
    }
  };

  const handleDeleteCredit = async (creditId: string) => {
    try {
      await deleteCustomerCredit.mutateAsync(creditId);
      // Refresh estimate data
      const updatedEstimate = await getEstimate(id as string);
      setEstimate(updatedEstimate);
      return true;
    } catch (error) {
      console.error('Error deleting credit:', error);
      return false;
    }
  };

  const handleConvertToInvoice = async (id: string) => {
    try {
      await convertToInvoice.mutateAsync(id);
      // Refresh estimate data
      const updatedEstimate = await getEstimate(id as string);
      setEstimate(updatedEstimate);
      return true;
    } catch (error) {
      console.error('Error converting to invoice:', error);
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="container py-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/estimates')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Estimates
          </Button>
        </div>
        
        <div className="bg-destructive/10 rounded-md p-6 text-center">
          <h2 className="text-xl font-semibold mb-2 text-destructive">Error Loading Estimate</h2>
          <p className="text-muted-foreground mb-4">{error || 'The requested estimate was not found.'}</p>
          <Link to="/estimates">
            <Button>Return to Estimates</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <EstimateDetail
        estimate={estimate}
        isLoading={isLoading}
        onBack={() => navigate('/estimates')}
        onRefresh={async () => {
          setIsLoading(true);
          try {
            const refreshedEstimate = await getEstimate(id as string);
            setEstimate(refreshedEstimate);
          } catch (error) {
            console.error('Error refreshing estimate:', error);
          } finally {
            setIsLoading(false);
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
    </div>
  );
};

export default EstimateDetailPage;
