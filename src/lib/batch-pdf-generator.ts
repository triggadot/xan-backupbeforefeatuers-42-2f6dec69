import { supabase } from '@/integrations/supabase/client';
import { triggerPDFGeneration } from './pdf-utils';

// Define batch job status type
export type BatchJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Define batch job type
export interface BatchPDFJob {
  id: string;
  documentType: 'invoice' | 'purchaseOrder' | 'estimate';
  documentIds: string[];
  status: BatchJobStatus;
  progress: number;
  total: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  results?: {
    documentId: string;
    pdfUrl: string | null;
    success: boolean;
    error?: string;
  }[];
}

/**
 * Create a new batch PDF generation job
 * @param documentType The type of documents to generate PDFs for
 * @param documentIds Array of document IDs to process
 * @returns The created batch job
 */
export async function createBatchPDFJob(
  documentType: 'invoice' | 'purchaseOrder' | 'estimate',
  documentIds: string[]
): Promise<BatchPDFJob | null> {
  try {
    const jobId = `batch-${documentType}-${Date.now()}`;
    const now = new Date().toISOString();
    
    const job: BatchPDFJob = {
      id: jobId,
      documentType,
      documentIds,
      status: 'pending',
      progress: 0,
      total: documentIds.length,
      startedAt: now,
      results: []
    };
    
    // Store the job in the database
    // Using gl_batch_pdf_jobs to follow the Glide naming convention with 'gl_' prefix
    const { error } = await supabase
      .from('gl_batch_pdf_jobs' as any)
      .insert(job);
    
    if (error) {
      console.error('Error creating batch PDF job:', error);
      return null;
    }
    
    return job;
  } catch (error) {
    console.error('Error creating batch PDF job:', error);
    return null;
  }
}

/**
 * Start processing a batch PDF generation job
 * @param jobId The ID of the job to process
 * @returns Whether the job was started successfully
 */
export async function startBatchPDFJob(jobId: string): Promise<boolean> {
  try {
    // Get the job from the database
    // Using gl_batch_pdf_jobs to follow the Glide naming convention with 'gl_' prefix
    const { data: job, error } = await supabase
      .from('gl_batch_pdf_jobs' as any)
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error || !job) {
      console.error('Error fetching batch PDF job:', error);
      return false;
    }
    
    // Update job status to processing
    const { error: updateError } = await supabase
      .from('gl_batch_pdf_jobs' as any)
      .update({
        status: 'processing',
        startedAt: new Date().toISOString()
      })
      .eq('id', jobId);
    
    if (updateError) {
      console.error('Error updating batch PDF job status:', updateError);
      return false;
    }
    
    // Start processing in the background
    // Cast to BatchPDFJob to handle type issues
    processBatchPDFJob(job as unknown as BatchPDFJob).catch(err => {
      console.error('Error processing batch PDF job:', err);
    });
    
    return true;
  } catch (error) {
    console.error('Error starting batch PDF job:', error);
    return false;
  }
}

/**
 * Process a batch PDF generation job
 * @param job The job to process
 */
async function processBatchPDFJob(job: BatchPDFJob): Promise<void> {
  const results: BatchPDFJob['results'] = [];
  let progress = 0;
  
  try {
    // Get the table name based on document type
    const tableName = getTableName(job.documentType);
    
    // Use the known project ID explicitly for all operations
    const PROJECT_ID = 'swrfsullhirscyxqneay';
    
    // Process each document
    for (const documentId of job.documentIds) {
      try {
        // Get the document from the database
        const { data: document, error } = await supabase
          .from(tableName as any)
          .select('*')
          .eq('id', documentId)
          .single();
        
        if (error || !document) {
          results.push({
            documentId,
            pdfUrl: null,
            success: false,
            error: `Document not found: ${error?.message || 'Unknown error'}`
          });
          continue;
        }
        
        // Use the new triggerPDFGeneration function to generate PDF on the server
        // Cast document to the expected type (Invoice, PurchaseOrder, or Estimate)
        const pdfUrl = await triggerPDFGeneration(
          job.documentType,
          document as any, // Use 'any' to bypass the type checking as we know the document structure is valid
          true // Force regenerate
        );
        
        if (!pdfUrl) {
          results.push({
            documentId,
            pdfUrl: null,
            success: false,
            error: `Failed to generate PDF: ${error?.message || 'Unknown error'}`
          });
          continue;
        }
        
        // Add the document to results with the PDF URL
        results.push({
          documentId,
          pdfUrl, // This is the standardized supabase_pdf_url from triggerPDFGeneration
          success: true
        });
        
        // Update the document with the PDF URL in case it wasn't already updated
        // This ensures we have the supabase_pdf_url field updated
        const { error: updateError } = await supabase
          .from(tableName as any)
          .update({ supabase_pdf_url: pdfUrl })
          .eq('id', documentId);
        
        if (updateError) {
          console.error(`Error updating supabase_pdf_url for ${job.documentType} ${documentId}:`, updateError);
        }
        
        // Update progress
        progress++;
        await updateBatchJobProgress(job.id, progress, job.total);
      } catch (error) {
        console.error(`Error processing document ${documentId}:`, error);
        results.push({
          documentId,
          pdfUrl: null,
          success: false,
          error: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        
        // Update progress
        progress++;
        await updateBatchJobProgress(job.id, progress, job.total);
      }
    }
    
    // Complete the job
    await completeBatchJob(job.id, results);
  } catch (error) {
    console.error('Error processing batch PDF job:', error);
    await failBatchJob(job.id, error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Update the progress of a batch job
 * @param jobId The ID of the job
 * @param progress The current progress
 * @param total The total number of documents
 */
async function updateBatchJobProgress(jobId: string, progress: number, total: number): Promise<void> {
  try {
    await supabase
      .from('gl_batch_pdf_jobs' as any)
      .update({
        progress,
        total
      })
      .eq('id', jobId);
  } catch (error) {
    console.error('Error updating batch job progress:', error);
  }
}

/**
 * Mark a batch job as completed
 * @param jobId The ID of the job
 * @param results The results of the job
 */
async function completeBatchJob(jobId: string, results: BatchPDFJob['results']): Promise<void> {
  try {
    await supabase
      .from('gl_batch_pdf_jobs' as any)
      .update({
        status: 'completed',
        completedAt: new Date().toISOString(),
        results
      })
      .eq('id', jobId);
  } catch (error) {
    console.error('Error completing batch job:', error);
  }
}

/**
 * Mark a batch job as failed
 * @param jobId The ID of the job
 * @param error The error message
 */
async function failBatchJob(jobId: string, error: string): Promise<void> {
  try {
    await supabase
      .from('gl_batch_pdf_jobs' as any)
      .update({
        status: 'failed',
        completedAt: new Date().toISOString(),
        error
      })
      .eq('id', jobId);
  } catch (err) {
    console.error('Error marking batch job as failed:', err);
  }
}

/**
 * Get the status of a batch PDF generation job
 * @param jobId The ID of the job
 * @returns The job status
 */
export async function getBatchPDFJobStatus(jobId: string): Promise<BatchPDFJob | null> {
  try {
    const { data, error } = await supabase
      .from('gl_batch_pdf_jobs' as any)
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error || !data) {
      console.error('Error fetching batch PDF job status:', error);
      return null;
    }
    
    // Cast to BatchPDFJob to ensure type safety
    return data as unknown as BatchPDFJob;
  } catch (error) {
    console.error('Error fetching batch PDF job status:', error);
    return null;
  }
}

/**
 * Helper function to get the table name for a document type
 * @param documentType The document type
 * @returns The table name
 */
function getTableName(documentType: 'invoice' | 'purchaseOrder' | 'estimate'): string {
  switch (documentType) {
    case 'invoice':
      return 'gl_invoices';
    case 'purchaseOrder':
      return 'gl_purchase_orders';
    case 'estimate':
      return 'gl_estimates';
    default:
      return '';
  }
}

/**
 * Helper function to get the folder name for a document type
 * @param documentType The document type
 * @returns The folder name
 */
function getFolderName(documentType: 'invoice' | 'purchaseOrder' | 'estimate'): 'Invoices' | 'PurchaseOrders' | 'Estimates' {
  switch (documentType) {
    case 'invoice':
      return 'Invoices';
    case 'purchaseOrder':
      return 'PurchaseOrders';
    case 'estimate':
      return 'Estimates';
    default:
      return 'Invoices';
  }
}

/**
 * Helper function to trigger PDF generation for a document
 * 
 * This function has been updated to use the new edge function approach
 * instead of client-side PDF generation.
 * 
 * @param documentType The document type
 * @param document The document data
 * @returns Promise resolving to the PDF URL or null if generation failed
 */
async function generatePDF(documentType: 'invoice' | 'purchaseOrder' | 'estimate', document: any): Promise<string | null> {
  try {
    // Use the triggerPDFGeneration function which calls the edge function
    const pdfUrl = await triggerPDFGeneration(
      documentType,
      document as any, // Cast to any to handle type mismatches
      true // Force regenerate for batch operations
    );
    
    return pdfUrl;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
}

/**
 * Helper function to generate a file name for a document
 * @param documentType The document type
 * @param document The document data
 * @returns The file name
 */
function getFileName(documentType: 'invoice' | 'purchaseOrder' | 'estimate', document: any): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  switch (documentType) {
    case 'invoice':
      return `Invoice_${document.invoice_uid || document.id}_${timestamp}.pdf`;
    case 'purchaseOrder':
      return `PO_${document.purchase_order_uid || document.id}_${timestamp}.pdf`;
    case 'estimate':
      return `Estimate_${document.estimate_uid || document.id}_${timestamp}.pdf`;
    default:
      return `Document_${document.id}_${timestamp}.pdf`;
  }
}
