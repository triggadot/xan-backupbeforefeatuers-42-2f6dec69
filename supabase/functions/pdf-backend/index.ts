import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { DocumentType, normalizeDocumentType, PDFErrorType, createPDFError } from './types.ts';
import { generatePDF } from './pdf-generator.ts';
import { fetchDocumentData } from './data-fetcher.ts';
import { storePDF, updateDocumentWithPdfUrl } from './storage-handler.ts';
import { processFailedGenerations } from './retry-handler.ts';

console.log('PDF Backend Function booting up');

/**
 * Main edge function serving several endpoints:
 * 
 * 1. Manual PDF generation:
 *    - Generate and store PDFs for specific documents
 *    - Request format: { action: "generate", documentType: string, documentId: string }
 * 
 * 2. Batch PDF generation:
 *    - Process multiple documents at once
 *    - Request format: { action: "batch", items: Array<{type: string, id: string}> }
 * 
 * 3. Scheduled scan for missing PDFs:
 *    - Scan tables for documents with null supabase_pdf_url fields
 *    - Request format: { action: "scan" }
 * 
 * 4. Webhook handler for database triggers:
 *    - Process PDF generation from database triggers
 *    - Accepts Supabase's webhook format with record data
 */
// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Error handling wrapper function
async function handleRequest(req, handler) {
  try {
    return await handler(req);
  } catch (error) {
    console.error('Error handling request:', error);
    
    // Determine appropriate status code based on error type
    let statusCode = 500;
    if (error.type === 'VALIDATION_ERROR') {
      statusCode = 400;
    } else if (error.type === 'AUTHENTICATION_ERROR') {
      statusCode = 401;
    } else if (error.type === 'AUTHORIZATION_ERROR') {
      statusCode = 403;
    } else if (error.type === 'NOT_FOUND_ERROR') {
      statusCode = 404;
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
        errorType: error.type || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString()
      }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

// Add a wrapper for consistent error handling
async function handleRequest(req: Request, handler: (req: Request) => Promise<Response>): Promise<Response> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();
  
  try {
    console.log(`[${requestId}] Processing ${req.method} request to ${new URL(req.url).pathname}`);
    const response = await handler(req);
    
    // Log successful completion
    const endTime = performance.now();
    console.log(`[${requestId}] Request completed successfully in ${(endTime - startTime).toFixed(2)}ms`);
    
    return response;
  } catch (error) {
    // Log error
    const endTime = performance.now();
    console.error(`[${requestId}] Request failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
    
    // Determine appropriate status code based on error type
    let statusCode = 500;
    let errorType = 'UNKNOWN_ERROR';
    
    if (error.type) {
      errorType = error.type;
      if (error.type === PDFErrorType.VALIDATION_ERROR) {
        statusCode = 400;
      } else if (error.type === PDFErrorType.AUTHENTICATION_ERROR) {
        statusCode = 401;
      } else if (error.type === PDFErrorType.AUTHORIZATION_ERROR) {
        statusCode = 403;
      } else if (error.type === PDFErrorType.NOT_FOUND_ERROR) {
        statusCode = 404;
      }
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
        errorType,
        requestId,
        timestamp: new Date().toISOString()
      }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

serve(async (req: Request) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  return await handleRequest(req, async (req) => {
    // Ensure environment variables are set
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Missing environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
      );
    }

    // Create Supabase client with service role for admin access
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Parse request body
    if (!req.body) {
      throw new Error("Request has no body.");
    }
    
    const requestData = await req.json();
    
    // Determine which action to take based on the request
    const action = requestData.action || 'generate'; // Default to single document generation
    
    switch (action) {
      case 'generate':
        // Handle single document generation
        return await handleSingleDocumentGeneration(supabaseAdmin, requestData);
        
      case 'batch':
        // Handle batch document generation
        return await handleBatchGeneration(supabaseAdmin, requestData);
        
      case 'scan':
        // Scan for documents with null PDF URLs
        // Pass options if provided
        return await handlePdfScan(supabaseAdmin, requestData || {});
        
      case 'trigger':
        // Handle webhook from database trigger
        return await handleDatabaseTrigger(supabaseAdmin, requestData);
        
      case 'retry':
        // Process retry of failed generations
        console.log('Processing retry request for failed PDF generations');
        const retryResults = await processFailedGenerations(supabaseAdmin, requestData || {});
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Retry job completed',
            results
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
        
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  });
});

/**
 * Process a single document PDF generation request
 * 
 * @param {any} supabaseAdmin - Supabase client with admin privileges
 * @param {Object} data - Request data
 * @param {string} data.documentType - Type of document (invoice, estimate, purchaseorder)
 * @param {string} data.documentId - ID of the document to generate
 * @param {boolean} [data.forceRegenerate=false] - Whether to regenerate PDF even if it exists
 * @param {boolean} [data.overwriteExisting=false] - Whether to overwrite existing PDF in storage
 * @returns {Promise<Response>} HTTP response
 */
async function handleSingleDocumentGeneration(supabaseAdmin, data) {
  // Validate request
  if (!data.documentType || !data.documentId) {
    throw new Error('Missing required parameters: documentType and documentId');
  }

  const { 
    documentType, 
    documentId, 
    forceRegenerate = false, 
    overwriteExisting = false 
  } = data;
  
  // Normalize document type
  const normalizedType = normalizeDocumentType(documentType);
  
  console.log(`Processing single document generation for ${normalizedType} ${documentId}`);
  console.log(`Force regenerate: ${forceRegenerate}, Overwrite existing: ${overwriteExisting}`);
  
  // If forceRegenerate is false, check if the document already has a PDF URL
  if (!forceRegenerate) {
    // Check if document already has a PDF URL
    const { data: existingDocument, error } = await supabaseAdmin
      .from(documentTypeConfig[normalizedType].tableName)
      .select('supabase_pdf_url')
      .eq('id', documentId)
      .single();
    
    if (!error && existingDocument?.supabase_pdf_url) {
      console.log(`Document already has PDF URL: ${existingDocument.supabase_pdf_url}`);
      return new Response(
        JSON.stringify({
          success: true,
          documentId,
          documentType: normalizedType,
          url: existingDocument.supabase_pdf_url,
          message: 'Using existing PDF URL'
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  // 1. Fetch document data with related entities
  const documentData = await fetchDocumentData(supabaseAdmin, normalizedType, documentId);
  
  // 2. Generate PDF
  const pdfBytes = await generatePDF(normalizedType, documentData);
  if (!pdfBytes) {
    throw new Error(`Failed to generate PDF for ${normalizedType} ${documentId}`);
  }
  
  // 3. Store PDF and get URL - pass overwriteExisting flag
  const { storageKey, url } = await storePDF(
    supabaseAdmin, 
    normalizedType, 
    documentData, 
    pdfBytes, 
    overwriteExisting
  );
  
  // 4. Update document with PDF URL
  await updateDocumentWithPdfUrl(supabaseAdmin, normalizedType, documentId, url);
  
  // 5. Return success response
  return new Response(
    JSON.stringify({
      success: true,
      documentId,
      documentType: normalizedType,
      url
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Process a batch PDF generation request
 * 
 * @param {any} supabaseAdmin - Supabase client with admin privileges
 * @param {Object} data - Request data
 * @param {string} [data.documentType] - Type of document for all items (invoice, estimate, purchaseorder)
 * @param {string[]} [data.documentIds] - Array of document IDs to generate
 * @param {Array<{type: string, id: string}>} [data.items] - Alternative format: Array of items with type and id
 * @param {boolean} [data.forceRegenerate=false] - Whether to regenerate PDFs even if they exist
 * @param {boolean} [data.overwriteExisting=false] - Whether to overwrite existing PDFs in storage
 * @returns {Promise<Response>} HTTP response with standardized format containing results and summary
 */
async function handleBatchGeneration(supabaseAdmin, data) {
  // Extract common parameters regardless of format
  const forceRegenerate = data.forceRegenerate ?? false;
  const overwriteExisting = data.overwriteExisting ?? false;
  
  // Use the normalizeDocumentType function imported at the top of the file
  
  // Initialize result tracking variables
  const results = [];
  let successCount = 0;
  let failedCount = 0;
  let documentsToProcess = [];
  let batchType = '';

  // Determine which format is being used and standardize processing approach
  if (data.documentType && Array.isArray(data.documentIds) && data.documentIds.length > 0) {
    // Format 1: documentType + documentIds array (newer format)
    const { documentType, documentIds } = data;
    batchType = 'new format';
    
    // Standardize to common processing format with explicitly normalized document type
    try {
      const normalizedType = normalizeDocumentType(documentType);
      documentsToProcess = documentIds.map(id => ({ 
        type: normalizedType, 
        id 
      }));
      console.log(`Normalized document type from ${documentType} to ${normalizedType}`);
    } catch (error) {
      console.error(`Error normalizing document type ${documentType}:`, error);
      throw new Error(`Invalid document type: ${documentType}`);
    }
    
    console.log(`Processing batch generation for ${documentIds.length} ${documentType} documents (new format)`);
    
    // Special logging for invoice type which has experienced issues
    if (documentType === 'invoice') {
      console.log(`⚠️ Processing INVOICE batch generation with ${documentIds.length} documents - this type has shown issues previously`);
    }
  } 
  else if (data.items && Array.isArray(data.items) && data.items.length > 0) {
    // Format 2: items array with {type, id} objects (legacy format)
    batchType = 'legacy format';
    documentsToProcess = data.items;
    console.log(`Processing batch generation for ${data.items.length} documents (legacy format)`);
    
    // Count and log document types for debugging
    const typeCounts = {};
    data.items.forEach(item => {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    });
    
    console.log('Document type breakdown:', typeCounts);
    
    // Special logging for invoice type which has experienced issues
    if (typeCounts['invoice'] > 0) {
      console.log(`⚠️ Processing INVOICE batch generation with ${typeCounts['invoice']} documents in legacy format`);
    }
  }
  else {
    // Neither format is valid
    throw new Error('Missing or invalid batch data. Requires either "items" array or "documentType" with "documentIds" array');
  }
  
  console.log(`Force regenerate: ${forceRegenerate}, Overwrite existing: ${overwriteExisting}`);
  
  // Process all documents sequentially using the same logic for either format
  for (const doc of documentsToProcess) {
    try {
      // Validate required fields
      if (!doc.type || !doc.id) {
        failedCount++;
        results.push({
          success: false,
          error: 'Missing type or id in document',
          documentType: doc.type || 'unknown',
          documentId: doc.id || 'unknown'
        });
        continue;
      }
      
      // Special handling for invoice type due to previous issues
      if (doc.type === 'invoice') {
        console.log(`Processing invoice document ${doc.id} in batch`);
      }
      
      // Process individual document using single document handler with normalized type
      let response;
      try {
        // Ensure consistent document type format by explicitly normalizing
        const normalizedType = normalizeDocumentType(doc.type);
        
        // Only log if normalization changed the type
        if (normalizedType !== doc.type) {
          console.log(`Normalized document type from ${doc.type} to ${normalizedType} for document ${doc.id}`);
        }
        
        response = await handleSingleDocumentGeneration(supabaseAdmin, {
          documentType: normalizedType,
          documentId: doc.id,
          forceRegenerate,
          overwriteExisting
        });
      } catch (error) {
        throw new Error(`Invalid document type ${doc.type} for document ${doc.id}: ${error.message}`);
      }
      
      const result = await response.json();
      results.push(result);
      
      if (result.success) {
        successCount++;
        console.log(`Successfully processed ${doc.type} ${doc.id}`);
      } else {
        failedCount++;
        console.error(`Failed to process ${doc.type} ${doc.id}: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      failedCount++;
      console.error(`Exception processing ${doc.type || 'unknown'} ${doc.id || 'unknown'}:`, error);
      
      results.push({
        success: false,
        documentId: doc.id,
        documentType: doc.type,
        error: error.message || 'Error processing document'
      });
    }
  }
  
  // Return standardized response format with consistent structure regardless of input format
  return new Response(
    JSON.stringify({
      success: true,
      results,
      summary: {
        total: documentsToProcess.length,
        success: successCount,
        failed: failedCount,
        batchType
      },
      // Include top-level counters for backward compatibility
      failed: failedCount,
      success: successCount
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Scan database for documents with null PDF URLs and generate them
 * 
 * @param {any} supabaseAdmin - Supabase client with admin privileges
 * @param {Object} options - Scan options
 * @param {number} [options.batchSize=50] - Number of documents to process in each batch
 * @param {boolean} [options.forceRegenerate=false] - Whether to regenerate PDFs even if they exist
 * @param {boolean} [options.overwriteExisting=true] - Whether to overwrite existing PDFs in storage
 * @returns {Promise<Response>} HTTP response
 */
async function handlePdfScan(supabaseAdmin, options = {}) {
  const documentTypes = [
    DocumentType.INVOICE,
    DocumentType.PURCHASE_ORDER, 
    DocumentType.ESTIMATE
  ];
  
  const results = {
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    details: []
  };
  
  // Scan each document type
  for (const docType of documentTypes) {
    let tableName;
    switch (docType) {
      case DocumentType.INVOICE:
        tableName = 'gl_invoices';
        break;
      case DocumentType.PURCHASE_ORDER:
        tableName = 'gl_purchase_orders';
        break;
      case DocumentType.ESTIMATE:
        tableName = 'gl_estimates';
        break;
    }
    
    // Determine batch size (default to 50)
    const batchSize = options.batchSize || 50;
    
    // Create query to find documents based on options
    let query = supabaseAdmin.from(tableName).select('id');
    
    // If not forcing regeneration, only get docs with null URLs
    if (!options.forceRegenerate) {
      query = query.is('supabase_pdf_url', null);
    }
    
    // Execute query with limit
    const { data: documents, error } = await query.limit(batchSize);
      
    if (error) {
      console.error(`Error scanning ${tableName}:`, error);
      results.details.push({
        documentType: docType,
        success: false,
        error: error.message
      });
      continue;
    }
    
    console.log(`Found ${documents?.length || 0} ${docType} documents with null PDF URLs`);
    
    // Process each document
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        try {
          results.totalProcessed++;
          
          // Generate PDF for document
          await handleSingleDocumentGeneration(supabaseAdmin, {
            documentType: docType,
            documentId: doc.id,
            forceRegenerate: options.forceRegenerate || false,
            overwriteExisting: options.overwriteExisting !== false // Default to true
          });
          
          // If successful, reset any failure tracking
          try {
            await supabaseAdmin.rpc('reset_pdf_generation_failure', {
              p_document_type: docType,
              p_document_id: doc.id
            });
          } catch (logError) {
            // Log but continue processing
            console.warn(`Error resetting failure tracking for ${docType} ${doc.id}:`, logError);
          }
          
          results.successful++;
          results.details.push({
            documentType: docType,
            documentId: doc.id,
            success: true
          });
        } catch (error) {
          results.failed++;
          
          // Log detailed error
          console.error(`Error generating PDF for ${docType} ${doc.id}:`, error);
          
          // Record failure for retry mechanism
          try {
            await supabaseAdmin.rpc('log_pdf_generation_failure', {
              p_document_type: docType,
              p_document_id: doc.id,
              p_error_message: error.message || 'Unknown error'
            });
          } catch (logError) {
            console.error(`Error logging failure for ${docType} ${doc.id}:`, logError);
          }
          
          results.details.push({
            documentType: docType,
            documentId: doc.id,
            success: false,
            error: error.message || 'Unknown error'
          });
        }
      }
    }
  }
  
  return new Response(
    JSON.stringify({
      success: true,
      results
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Handle webhook from database trigger
 */
async function handleDatabaseTrigger(supabaseAdmin, data) {
  // Validate webhook payload
  if (!data.type || !data.table || !data.record) {
    throw new Error('Invalid webhook payload');
  }
  
  const { type, table, record } = data;
  
  // Only process on INSERT or UPDATE
  if (type !== 'INSERT' && type !== 'UPDATE') {
    return new Response(
      JSON.stringify({
        success: true,
        message: `Ignoring trigger of type: ${type}`
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Determine document type from table name
  let documentType;
  switch (table) {
    case 'gl_invoices':
      documentType = DocumentType.INVOICE;
      break;
    case 'gl_purchase_orders':
      documentType = DocumentType.PURCHASE_ORDER;
      break;
    case 'gl_estimates':
      documentType = DocumentType.ESTIMATE;
      break;
    default:
      throw new Error(`Unsupported table for PDF generation: ${table}`);
  }
  
  // Generate PDF
  try {
    const result = await handleSingleDocumentGeneration(supabaseAdmin, {
      documentType,
      documentId: record.id
    }).then(response => response.json());
    
    return new Response(
      JSON.stringify({
        success: true,
        result
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    // Log but don't throw to ensure webhook completes
    console.error(`Error processing webhook for ${documentType} ${record.id}:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        documentId: record.id,
        documentType,
        error: error.message
      }),
      { 
        status: 200, // Still return 200 to acknowledge receipt
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
