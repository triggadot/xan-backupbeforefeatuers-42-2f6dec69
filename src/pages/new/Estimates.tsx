import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstimates } from '@/hooks/estimates';
import { EstimateWithDetails, EstimateFilters } from '@/types/estimate';
import { EstimateList, EstimateStats } from '@/components/estimates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/utils/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Estimates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<EstimateFilters>({});
  
  const { estimates, isLoading, error, fetchEstimates } = useEstimates(filters);

  const filteredEstimates = React.useMemo(() => {
    if (!estimates) return [];
    return estimates.filter(estimate =>
      (estimate.account?.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (estimate.id || '').toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [estimates, searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleCreateEstimate = () => {
    navigate('/estimates/new');
  };

  const handleViewEstimate = (estimate: EstimateWithDetails) => {
    navigate(`/estimates/${estimate.id}`);
  };
  
  const handleDeleteEstimate = async (id: string) => {
    try {
      // First get the estimate to get the glide_row_id
      const { data: estimate, error: getError }: { data: { glide_row_id: string } | null, error: any } = await supabase
        .from('gl_estimates')
        .select('glide_row_id')
        .eq('id', id)
        .single();
      
      if (getError) throw getError;
      if (!estimate) throw new Error('Estimate not found');
      
      // Delete estimate lines first
      const { error: linesError } = await supabase
        .from('gl_estimate_lines')
        .delete()
        .eq('rowid_estimates', estimate.glide_row_id);
      
      if (linesError) throw linesError;
      
      // Delete credits associated with the estimate
      const { error: creditsError } = await supabase
        .from('gl_customer_credits')
        .delete()
        .eq('rowid_estimates', estimate.glide_row_id);
      
      if (creditsError) throw creditsError;
      
      // Delete the estimate
      const { error: deleteError } = await supabase
        .from('gl_estimates')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      toast({
        title: 'Success',
        description: 'Estimate has been deleted.',
      });
      
      // Refresh the list
      fetchEstimates();
    } catch (err) {
      console.error('Error deleting estimate:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete estimate.',
        variant: 'destructive',
      });
    }
  };
  
  const handleConvertToInvoice = async (id: string) => {
    try {
      // Get the estimate
      const { data: estimate, error: getError }: { data: EstimateWithDetails | null, error: any } = await supabase
        .from('gl_estimates')
        .select('*')
        .eq('id', id)
        .single();
      
      if (getError) throw getError;
      if (!estimate) throw new Error('Estimate not found');
      
      // Update the estimate status to 'converted'
      const { error: updateError } = await supabase
        .from('gl_estimates')
        .update({ 
          status: 'converted',
          valid_final_create_invoice_clicked: true,
          date_invoice_created_date: new Date().toISOString()
        })
        .eq('id', id);
        
      if (updateError) throw updateError;
      
      toast({
        title: 'Success',
        description: 'Estimate has been converted to an invoice.',
      });
      
      // Refresh the list
      fetchEstimates();
    } catch (err) {
      console.error('Error converting estimate to invoice:', err);
      toast({
        title: 'Error',
        description: 'Failed to convert estimate to invoice.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Estimates</h1>
        <Button onClick={handleCreateEstimate}>
          <Plus className="mr-2 h-4 w-4" /> Create Estimate
        </Button>
      </div>
      
      <EstimateStats estimates={estimates} isLoading={isLoading} />
      
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
            onClick={() => fetchEstimates()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      <EstimateList 
        estimates={filteredEstimates} 
        isLoading={isLoading} 
        onViewEstimate={handleViewEstimate}
        onDelete={handleDeleteEstimate}
        onConvertToInvoice={handleConvertToInvoice}
      />
    </div>
  );
};

export default Estimates;
