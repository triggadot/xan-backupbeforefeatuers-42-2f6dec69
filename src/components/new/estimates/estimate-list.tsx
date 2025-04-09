import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon, PencilIcon, DownloadIcon, ShareIcon, RefreshCw, FileTextIcon } from 'lucide-react'; // Added FileTextIcon
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/utils/use-toast';
import { supabase } from '@/integrations/supabase/client'; // Import supabase client
import { Button } from '@/components/ui/button'; // Import Button component
import { format } from 'date-fns';
import { EstimateWithDetails } from '@/types/estimate';

interface EstimateListProps {
  estimates: EstimateWithDetails[];
  isLoading: boolean;
  onViewEstimate?: (estimate: EstimateWithDetails) => void;
  onDelete?: (id: string) => void;
  onConvertToInvoice?: (id: string) => void;
}

export const EstimateList: React.FC<EstimateListProps> = ({ 
  estimates, 
  isLoading,
  onViewEstimate,
  onDelete,
  onConvertToInvoice
}) => {
  const { toast } = useToast();
  const [selectedEstimates, setSelectedEstimates] = useState<string[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false); // State for batch processing
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedEstimates(estimates.map(estimate => estimate.id));
    } else {
      setSelectedEstimates([]);
    }
  };

  const handleSelectEstimate = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedEstimates([...selectedEstimates, id]);
    } else {
      setSelectedEstimates(selectedEstimates.filter(estimateId => estimateId !== id));
    }
  };

  const handleDownloadPdf = (id: string) => {
    toast({
      title: 'Download Started',
      description: 'Your estimate PDF is being prepared for download.',
    });
    // Implement PDF download functionality
    // You can use the glide_pdf_url field from your database if available
  };

  const handleShareEstimate = (id: string) => {
    toast({
      title: 'Share Options',
      description: 'Estimate sharing options opened.',
    });
    // Implement estimate sharing functionality
  };

  // --- Batch PDF Generation Handler ---
  const handleBatchGeneratePdfs = async () => {
    if (selectedEstimates.length === 0 || isBatchProcessing) {
      return;
    }

    setIsBatchProcessing(true);
    const processingToast = toast({
      title: 'Batch PDF Generation Started',
      description: `Processing ${selectedEstimates.length} estimate(s)... Please wait.`,
      duration: 999999, // Keep toast open until dismissed
    });

    const itemsToProcess = selectedEstimates.map(id => ({ id, type: 'estimate' })); // Set type to 'estimate'

    try {
      const { data, error } = await supabase.functions.invoke('batch-generate-and-store-pdfs', {
        body: JSON.stringify({ items: itemsToProcess }),
      });

      processingToast.dismiss(); // Dismiss loading toast

      if (error) {
        throw error;
      }

      // Process results from the function
      type BatchResultItem = { id: string; type: string; success: boolean; url?: string; error?: string };
      const results: BatchResultItem[] = data?.results || [];
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      toast({
        title: 'Batch PDF Generation Complete',
        description: `Successfully generated ${successCount} PDF(s). ${failureCount > 0 ? `${failureCount} failed.` : ''}`,
        variant: failureCount > 0 ? 'warning' : 'default',
        duration: 5000,
      });

      if (failureCount > 0) {
        console.error('Batch PDF Generation Failures:', results.filter((r) => !r.success));
      }
      
      // Clear selection after processing
      setSelectedEstimates([]); 

    } catch (error) {
      console.error('Error calling batch-generate-and-store-pdfs function:', error);
      processingToast.dismiss(); // Dismiss loading toast on error too
      toast({
        title: 'Batch PDF Generation Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsBatchProcessing(false);
    }
  };
  // --- End Batch PDF Generation Handler ---

  const formatEstimateNumber = (estimate: EstimateWithDetails) => {
    try {
      // Get account_uid from account, if available
      const accountUid = estimate.account?.accounts_uid || 'NOACC';
      
      // Format the date as MMDDYY
      let dateString = 'NODATE';
      if (estimate.estimate_date) {
        const estimateDate = new Date(estimate.estimate_date);
        dateString = format(estimateDate, 'MMddyy');
      }
      
      // Create the formatted estimate number
      return `EST#${accountUid}${dateString}`;
    } catch (err) {
      console.error('Error formatting estimate number:', err);
      return estimate.id?.substring(0, 8) || 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (estimates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <svg className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium">No estimates found</h3>
        <p className="text-gray-500 mt-1">Create your first estimate to get started</p>
        <Link to="/estimates/new">
          <button 
            type="button"
            className="mt-4 py-2 px-3 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
          >
            Create Estimate
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Add Batch Action Button */}
      <div className="p-1.5 flex justify-end">
        <Button
          onClick={handleBatchGeneratePdfs}
          disabled={selectedEstimates.length === 0 || isBatchProcessing}
          size="sm"
        >
          <FileTextIcon className="mr-2 h-4 w-4" />
          {isBatchProcessing ? 'Processing...' : `Generate ${selectedEstimates.length} PDF(s)`}
        </Button>
      </div>
      <div className="-m-1.5 overflow-x-auto">
        <div className="p-1.5 min-w-full inline-block align-middle">
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left">
                    <div className="flex items-center gap-x-2">
                      <input
                        type="checkbox"
                        className="border-gray-300 rounded h-4 w-4"
                        onChange={handleSelectAll}
                        checked={selectedEstimates.length === estimates.length && estimates.length > 0}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-800">
                        Estimate #
                      </span>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-800">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-800">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-800">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-800">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-800">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {estimates.map((estimate) => (
                  <tr key={estimate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-x-2">
                        <input
                          type="checkbox"
                          className="border-gray-300 rounded h-4 w-4"
                          checked={selectedEstimates.includes(estimate.id)}
                          onChange={(e) => handleSelectEstimate(estimate.id, e.target.checked)}
                        />
                        <Link to={`/estimates/${estimate.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                          {formatEstimateNumber(estimate)}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {estimate.account?.account_name || estimate.accountName || 'No Customer'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(estimate.estimate_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center gap-1.5 py-0.5 px-2 rounded-full text-xs font-medium ${
                        estimate.status === 'converted' ? 'bg-green-100 text-green-800' :
                        estimate.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {estimate.status?.charAt(0).toUpperCase() + estimate.status?.slice(1) || 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatCurrency(estimate.total_amount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link to={`/estimates/${estimate.id}`} className="text-blue-600 hover:text-blue-700">
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link to={`/estimates/${estimate.id}/edit`} className="text-gray-600 hover:text-gray-700">
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(estimate.id)}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareEstimate(estimate.id)}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <ShareIcon className="h-4 w-4" />
                        </button>
                        {estimate.status !== 'converted' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onDelete?.(estimate.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => onConvertToInvoice?.(estimate.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-plus">
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="12" y1="18" x2="12" y2="12"></line>
                                <line x1="9" y1="15" x2="15" y2="15"></line>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimateList;
