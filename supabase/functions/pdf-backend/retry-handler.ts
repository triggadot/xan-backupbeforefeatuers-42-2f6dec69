import { DocumentType, PDFErrorType, createPDFError } from './types.ts';

// Interface for retry item
interface RetryItem {
  id: number;
  document_type: string;
  document_id: string;
  error_message: string;
  retry_count: number;
  last_attempt: string;
  next_attempt: string;
}

/**
 * Process retry of failed PDF generations
 * 
 * @param {any} supabaseAdmin - Supabase client with admin privileges
 * @param {Object} options - Retry options
 * @param {number} [options.maxRetries=10] - Maximum number of retries before marking as requiring manual intervention
 * @param {number} [options.batchSize=20] - Number of failed generations to retry in each batch
 * @returns {Promise<any>} Retry results
 */
export async function processFailedGenerations(supabaseAdmin, options = {}) {
  const maxRetries = options.maxRetries || 10;
  const batchSize = options.batchSize || 20;
  
  const results = {
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    manualInterventionRequired: 0,
    details: []
  };

  try {
    // Find failed generations that are due for retry
    const { data: failedItems, error } = await supabaseAdmin
      .from('pdf_generation_failures')
      .select('*')
      .eq('resolved', false)
      .lte('next_attempt', new Date().toISOString())
      .order('retry_count', { ascending: true })
      .limit(batchSize);
    
    if (error) {
      throw createPDFError(
        PDFErrorType.DATABASE_ERROR,
        `Error fetching failed generations: ${error.message}`
      );
    }
    
    console.log(`Found ${failedItems?.length || 0} failed generations due for retry`);
    
    if (!failedItems || failedItems.length === 0) {
      return results;
    }
    
    // Process each failed item
    for (const item of failedItems) {
      results.totalProcessed++;
      
      try {
        // Check if we've exceeded the maximum retry count
        if (item.retry_count >= maxRetries) {
          console.log(`Item ${item.document_type}/${item.document_id} has exceeded max retries (${maxRetries})`);
          
          // Mark as requiring manual intervention but don't retry
          await supabaseAdmin
            .from('pdf_generation_failures')
            .update({
              requires_manual_intervention: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
          
          results.manualInterventionRequired++;
          results.details.push({
            id: item.id,
            documentType: item.document_type,
            documentId: item.document_id,
            success: false,
            retryCount: item.retry_count,
            requiresManualIntervention: true,
            message: 'Exceeded maximum retry attempts'
          });
          
          continue;
        }
        
        // For valid document types, try to normalize the type
        let normalizedType;
        try {
          normalizedType = normalizeDocumentType(item.document_type);
        } catch (e) {
          throw createPDFError(
            PDFErrorType.VALIDATION_ERROR,
            `Invalid document type: ${item.document_type}`
          );
        }
        
        // Attempt to regenerate the PDF
        console.log(`Retrying PDF generation for ${normalizedType} ${item.document_id} (attempt ${item.retry_count + 1})`);
        
        // Call the single document generation function (imported from external scope)
        const response = await handleSingleDocumentGeneration(supabaseAdmin, {
          documentType: normalizedType,
          documentId: item.document_id,
          forceRegenerate: true,  // Always force regenerate on retry
          overwriteExisting: true // Always overwrite existing on retry
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw createPDFError(
            PDFErrorType.GENERATION_ERROR,
            result.error || 'Unknown error during regeneration'
          );
        }
        
        // If successful, mark the failure as resolved
        await supabaseAdmin.rpc('reset_pdf_generation_failure', {
          p_document_type: normalizedType,
          p_document_id: item.document_id
        });
        
        results.successful++;
        results.details.push({
          id: item.id,
          documentType: normalizedType,
          documentId: item.document_id,
          success: true,
          retryCount: item.retry_count,
          url: result.url
        });
        
      } catch (error) {
        results.failed++;
        console.error(`Error retrying generation for ${item.document_type}/${item.document_id}:`, error);
        
        // Update the failure record for next retry attempt (will be handled by the SQL function)
        try {
          await supabaseAdmin.rpc('log_pdf_generation_failure', {
            p_document_type: item.document_type,
            p_document_id: item.document_id,
            p_error_message: error.message || 'Unknown error'
          });
        } catch (logError) {
          console.error(`Error updating failure record for ${item.document_type}/${item.document_id}:`, logError);
        }
        
        results.details.push({
          id: item.id,
          documentType: item.document_type,
          documentId: item.document_id,
          success: false,
          retryCount: item.retry_count,
          error: error.message || 'Unknown error'
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error processing failed generations:', error);
    throw error;
  }
}

/**
 * Normalize document type string
 * This should be imported from a shared location, but is duplicated here for clarity
 */
function normalizeDocumentType(type: string): DocumentType {
  const normalizedType = type.toLowerCase();
  
  if (normalizedType === 'invoice') {
    return DocumentType.INVOICE;
  } else if (normalizedType === 'estimate') {
    return DocumentType.ESTIMATE;
  } else if (normalizedType === 'purchaseorder' || normalizedType === 'purchase-order' || normalizedType === 'purchase_order') {
    return DocumentType.PURCHASE_ORDER;
  } else {
    throw createPDFError(
      PDFErrorType.VALIDATION_ERROR,
      `Invalid document type: ${type}`
    );
  }
}
