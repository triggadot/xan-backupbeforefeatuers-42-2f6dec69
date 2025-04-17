import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/utils/use-toast';
import { 
  createBatchPDFJob, 
  startBatchPDFJob, 
  getBatchPDFJobStatus,
  BatchPDFJob 
} from '@/lib/pdf/batch-pdf-generator';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface BatchPDFGeneratorProps {
  documentType: 'invoice' | 'purchaseOrder' | 'estimate';
  documents: Array<{ id: string; name: string; date?: string }>;
  onComplete?: (results: BatchPDFJob['results']) => void;
}

export function BatchPDFGenerator({
  documentType,
  documents,
  onComplete
}: BatchPDFGeneratorProps) {
  const { toast } = useToast();
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<BatchPDFJob | null>(null);
  const [progress, setProgress] = useState(0);

  // Handle select all checkbox
  useEffect(() => {
    if (selectAll) {
      setSelectedDocuments(documents.map(doc => doc.id));
    } else if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([]);
    }
  }, [selectAll, documents]);

  // Update selectAll state when individual selections change
  useEffect(() => {
    setSelectAll(selectedDocuments.length === documents.length && documents.length > 0);
  }, [selectedDocuments, documents]);

  // Poll for job status updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isGenerating && currentJob) {
      interval = setInterval(async () => {
        const updatedJob = await getBatchPDFJobStatus(currentJob.id);
        
        if (updatedJob) {
          setCurrentJob(updatedJob);
          
          if (updatedJob.total > 0) {
            setProgress(Math.round((updatedJob.progress / updatedJob.total) * 100));
          }
          
          if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
            setIsGenerating(false);
            clearInterval(interval);
            
            if (updatedJob.status === 'completed') {
              toast({
                title: 'Batch PDF Generation Complete',
                description: `Successfully generated ${updatedJob.results?.filter(r => r.success).length || 0} of ${updatedJob.total} PDFs.`,
              });
              
              if (onComplete && updatedJob.results) {
                onComplete(updatedJob.results);
              }
            } else {
              toast({
                title: 'Batch PDF Generation Failed',
                description: updatedJob.error || 'An unknown error occurred.',
                variant: 'destructive',
              });
            }
          }
        }
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating, currentJob, toast, onComplete]);

  const handleToggleDocument = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleToggleSelectAll = () => {
    setSelectAll(!selectAll);
  };

  const handleGeneratePDFs = async () => {
    if (selectedDocuments.length === 0) {
      toast({
        title: 'No Documents Selected',
        description: 'Please select at least one document to generate PDFs.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsGenerating(true);
    setProgress(0);
    
    try {
      // Create a new batch job
      const job = await createBatchPDFJob(documentType, selectedDocuments);
      
      if (!job) {
        throw new Error('Failed to create batch PDF job');
      }
      
      setCurrentJob(job);
      
      // Start the job
      const started = await startBatchPDFJob(job.id);
      
      if (!started) {
        throw new Error('Failed to start batch PDF job');
      }
      
      toast({
        title: 'Batch PDF Generation Started',
        description: `Generating PDFs for ${selectedDocuments.length} documents.`,
      });
    } catch (error) {
      console.error('Error starting batch PDF generation:', error);
      setIsGenerating(false);
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to start batch PDF generation.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadAll = async () => {
    if (!currentJob?.results || currentJob.results.length === 0) {
      toast({
        title: 'No PDFs Available',
        description: 'There are no PDFs available to download.',
        variant: 'destructive',
      });
      return;
    }
    
    const successfulResults = currentJob.results.filter(result => result.success && result.pdfUrl);
    
    if (successfulResults.length === 0) {
      toast({
        title: 'No Successful PDFs',
        description: 'There are no successfully generated PDFs to download.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      toast({
        title: 'Preparing Download',
        description: 'Preparing PDFs for download. This may take a moment...',
      });
      
      const zip = new JSZip();
      const documentTypeLabel = documentType === 'purchaseOrder' ? 'Purchase Order' : 
                               documentType.charAt(0).toUpperCase() + documentType.slice(1);
      
      // Download each PDF and add to zip
      const downloadPromises = successfulResults.map(async result => {
        try {
          const response = await fetch(result.pdfUrl!);
          const blob = await response.blob();
          
          // Find the document name
          const document = documents.find(doc => doc.id === result.documentId);
          const fileName = document 
            ? `${documentTypeLabel}_${document.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
            : `${documentTypeLabel}_${result.documentId}.pdf`;
          
          zip.file(fileName, blob);
          return true;
        } catch (error) {
          console.error(`Error downloading PDF for document ${result.documentId}:`, error);
          return false;
        }
      });
      
      const results = await Promise.all(downloadPromises);
      const successCount = results.filter(Boolean).length;
      
      if (successCount === 0) {
        throw new Error('Failed to download any PDFs');
      }
      
      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Save the zip file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      saveAs(zipBlob, `${documentTypeLabel}s_${timestamp}.zip`);
      
      toast({
        title: 'Download Complete',
        description: `Successfully downloaded ${successCount} of ${successfulResults.length} PDFs.`,
      });
    } catch (error) {
      console.error('Error downloading PDFs:', error);
      
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to download PDFs.',
        variant: 'destructive',
      });
    }
  };

  const getDocumentTypeLabel = () => {
    switch (documentType) {
      case 'invoice':
        return 'Invoices';
      case 'purchaseOrder':
        return 'Purchase Orders';
      case 'estimate':
        return 'Estimates';
      default:
        return 'Documents';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Batch PDF Generator</CardTitle>
        <CardDescription>
          Generate PDFs for multiple {getDocumentTypeLabel().toLowerCase()} at once
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isGenerating ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="font-medium">Generating PDFs...</p>
                <p className="text-sm text-muted-foreground">
                  {currentJob?.progress || 0} of {currentJob?.total || 0} complete
                </p>
              </div>
            </div>
            
            <Progress value={progress} className="h-2" />
          </div>
        ) : currentJob?.status === 'completed' ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">PDF Generation Complete</p>
                <p className="text-sm text-muted-foreground">
                  Successfully generated {currentJob.results?.filter(r => r.success).length || 0} of {currentJob.total} PDFs
                </p>
              </div>
            </div>
            
            {currentJob.results && currentJob.results.some(r => !r.success) && (
              <div className="rounded-md bg-amber-50 p-4 mt-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-amber-800">Warning</h3>
                    <div className="mt-1 text-sm text-amber-700">
                      <p>
                        {currentJob.results.filter(r => !r.success).length} PDFs failed to generate.
                        Check the console for more details.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <Button 
              className="w-full mt-4 flex items-center justify-center gap-2"
              onClick={handleDownloadAll}
              disabled={!currentJob.results || currentJob.results.filter(r => r.success).length === 0}
            >
              <Download className="h-4 w-4" />
              Download All PDFs as ZIP
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox 
                id="select-all" 
                checked={selectAll} 
                onCheckedChange={handleToggleSelectAll} 
              />
              <Label htmlFor="select-all">Select All</Label>
            </div>
            
            <div className="max-h-60 overflow-y-auto border rounded-md p-2">
              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md">
                      <Checkbox 
                        id={`doc-${doc.id}`} 
                        checked={selectedDocuments.includes(doc.id)}
                        onCheckedChange={() => handleToggleDocument(doc.id)}
                      />
                      <Label htmlFor={`doc-${doc.id}`} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span>{doc.name}</span>
                          {doc.date && <span className="text-xs text-muted-foreground">{doc.date}</span>}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mb-2" />
                  <p>No documents available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {!isGenerating && currentJob?.status !== 'completed' && (
          <Button 
            className="w-full"
            onClick={handleGeneratePDFs}
            disabled={selectedDocuments.length === 0 || isGenerating}
          >
            Generate PDFs for {selectedDocuments.length} {selectedDocuments.length === 1 ? getDocumentTypeLabel().slice(0, -1).toLowerCase() : getDocumentTypeLabel().toLowerCase()}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
