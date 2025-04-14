// Handles database trigger events for PDF generation
import { SupabaseClient } from '@supabase/supabase-js';
import { generatePDF } from './pdf-generator';
import { storePDF } from './storage-handler';
import { PDFErrorType, createPDFError } from './utils';

// Import DocumentType from types.ts to use the project's existing enum
import { DocumentType } from './types.ts';

// Use the existing normalizeDocumentType function to convert string types to DocumentType enum
import { normalizeDocumentType, documentTypeConfig } from './types.ts';

export interface TriggerPayload {
  action: 'generate' | 'scan';
  documentType: string; // Will be mapped to DocumentType enum
  documentId?: string;
  overwriteExisting?: boolean;
  batchSize?: number;
}

// Define storage result interface to match storePDF function
export interface StorageResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Handles a batch scan request to find and generate PDFs for documents with missing PDFs
 * 
 * @param supabase - Supabase client with admin privileges
 * @param options - Options for the batch operation
 */
export async function handleBatchPDFScan(
  supabase: SupabaseClient,
  options: {
    documentType?: DocumentType;
    batchSize?: number;
    overwriteExisting?: boolean;
  }
) {
  const batchSize = options.batchSize || 50;
  const overwriteExisting = options.overwriteExisting || false;
  const results = { 
    processed: 0, 
    success: 0, 
    failed: 0, 
    errors: [] as Array<{documentId: string, error: string}>
  };
  
  try {
    // If specific document type is provided, only process that type
    if (options.documentType) {
      const docs = await getMissingPDFDocuments(supabase, options.documentType, batchSize, overwriteExisting);
      const typeResults = await processBatch(supabase, options.documentType, docs, overwriteExisting);
      
      results.processed += typeResults.processed;
      results.success += typeResults.success;
      results.failed += typeResults.failed;
      results.errors = [...results.errors, ...typeResults.errors];
      
      return {
        success: true,
        results,
        message: `Processed ${results.processed} documents (${results.success} successful, ${results.failed} failed)`
      };
    }
    
    // Otherwise process all document types
    const documentTypes = Object.values(DocumentType);
    
    for (const docType of documentTypes) {
      const docsPerType = Math.floor(batchSize / documentTypes.length);
      const docs = await getMissingPDFDocuments(supabase, docType, docsPerType, overwriteExisting);
      const typeResults = await processBatch(supabase, docType, docs, overwriteExisting);
      
      results.processed += typeResults.processed;
      results.success += typeResults.success;
      results.failed += typeResults.failed;
      results.errors = [...results.errors, ...typeResults.errors];
    }
    
    return {
      success: true,
      results,
      message: `Processed ${results.processed} documents (${results.success} successful, ${results.failed} failed)`
    };
  } catch (error) {
    console.error('Error in batch PDF scan:', error);
    return {
      success: false,
      error: error.message || 'Unknown error in batch processing',
      results
    };
  }
}

/**
 * Get documents with missing PDFs for a specific type
 */
async function getMissingPDFDocuments(
  supabase: SupabaseClient,
  documentType: DocumentType,
  limit: number,
  includeExisting: boolean
) {
  // Get table name based on document type
  const tableName = getTableNameFromType(documentType);
  const documentUIDField = getDocumentUIDField(documentType);
  
  let query = supabase
    .from(tableName)
    .select('id')
    .not(documentUIDField, 'is', null);
  
  if (!includeExisting) {
    query = query.is('supabase_pdf_url', null);
  }
  
  const { data, error } = await query.limit(limit);
  
  if (error) {
    console.error(`Error fetching ${documentType} records:`, error);
    return [];
  }
  
  return data || [];
}

/**
 * Get table name from document type using the documentTypeConfig
 */
function getTableNameFromType(documentType: DocumentType): string {
  if (!documentTypeConfig[documentType]) {
    throw createPDFError(
      PDFErrorType.VALIDATION_ERROR,
      `Invalid document type: ${documentType}`
    );
  }
  
  return documentTypeConfig[documentType].tableName;
}

/**
 * Get document UID field name from config
 */
function getDocumentUIDField(documentType: DocumentType): string {
  if (!documentTypeConfig[documentType]) {
    throw createPDFError(
      PDFErrorType.VALIDATION_ERROR,
      `Invalid document type: ${documentType}`
    );
  }
  
  return documentTypeConfig[documentType].uidField;
}

/**
 * Process a batch of documents
 */
async function processBatch(
  supabase: SupabaseClient,
  documentType: DocumentType,
  documents: Array<{ id: string }>,
  overwriteExisting: boolean
) {
  const results = { 
    processed: documents.length, 
    success: 0, 
    failed: 0, 
    errors: [] as Array<{documentId: string, error: string}>
  };
  
  for (const doc of documents) {
    try {
      const result = await handleSingleDocumentGeneration(supabase, {
        documentType,
        documentId: doc.id,
        overwriteExisting
      });
      
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push({
          documentId: doc.id,
          error: result.error || 'Unknown error'
        });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        documentId: doc.id,
        error: error.message || 'Exception during processing'
      });
    }
  }
  
  return results;
}

/**
 * Handles generation of a single document PDF
 */
export async function handleSingleDocumentGeneration(
  supabase: SupabaseClient,
  options: {
    documentType: DocumentType | string;
    documentId: string;
    overwriteExisting?: boolean;
    forceRegenerate?: boolean;
  }
) {
  // Normalize the document type if it's a string
  const documentType = typeof options.documentType === 'string' 
    ? normalizeDocumentType(options.documentType) 
    : options.documentType;
  const { documentId, overwriteExisting = false, forceRegenerate = false } = options;
  
  try {
    // Get the document with all necessary data
    const document = await fetchDocumentWithData(supabase, documentType, documentId);
    
    if (!document) {
      return {
        success: false,
        error: `Document not found: ${documentType} ${documentId}`
      };
    }
    
    // Skip if document already has a PDF URL and we're not regenerating
    if (!forceRegenerate && document.supabase_pdf_url && !overwriteExisting) {
      return {
        success: true,
        url: document.supabase_pdf_url,
        message: 'PDF already exists',
        skipped: true
      };
    }
    
    // Generate PDF
    const pdfBytes = await generatePDF(documentType, document);
    
    if (!pdfBytes) {
      return {
        success: false,
        error: 'Failed to generate PDF'
      };
    }
    
    // Store PDF and update database
    const storageResult = await storePDF(supabase, documentType, documentId, pdfBytes, document);
    
    // Check if storage was successful by checking if URL exists
    if (!storageResult.url) {
      return {
        success: false,
        error: 'Failed to store PDF'
      };
    }
    
    return {
      success: true,
      url: storageResult.url,
      message: 'PDF generated and stored successfully'
    };
  } catch (error) {
    console.error(`Error generating PDF for ${documentType} ${documentId}:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error during PDF generation'
    };
  }
}

/**
 * Fetches a document with all data needed for PDF generation
 */
async function fetchDocumentWithData(supabase: SupabaseClient, documentType: DocumentType, documentId: string) {
  const tableName = getTableNameFromType(documentType);
  
  // Build query based on document type
  let query;
  
  switch (documentType) {
    case DocumentType.INVOICE:
      query = supabase
        .from(tableName)
        .select('*, gl_accounts(*), invoice_lines(*, gl_products(*))')
        .eq('id', documentId)
        .single();
      break;
    case DocumentType.ESTIMATE:
      query = supabase
        .from(tableName)
        .select('*, gl_accounts(*), estimate_lines(*, gl_products(*))')
        .eq('id', documentId)
        .single();
      break;
    case DocumentType.PURCHASE_ORDER:
      query = supabase
        .from(tableName)
        .select('*, gl_accounts(*), gl_purchase_order_lines(*, gl_products(*))')
        .eq('id', documentId)
        .single();
      break;
    default:
      throw createPDFError(
        PDFErrorType.VALIDATION_ERROR,
        `Invalid document type: ${documentType}`
      );
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error(`Error fetching ${documentType} data:`, error);
    return null;
  }
  
  return data;
}
