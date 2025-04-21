/**
 * @file pdf.service.ts
 * Unified PDF generation service that provides a clean API for all PDF operations.
 * This service follows the standardized approach using the pdf-backend edge function.
 */

import { supabase } from '@/integrations/supabase/client';
import { DocumentType, toLegacyDocumentTypeString, getBackendDocumentTypeKey } from '@/types/pdf.unified';
import { PDFGenerationOptions, PDFGenerationResult, validateDocumentType, validatePDFOptions } from './pdf.types';
import { Invoice, PurchaseOrder, Estimate } from '@/types/pdf-utils';

/**
 * Generates a PDF for a document using the standardized pdf-backend edge function
 * 
 * @param documentType - The type of document
 * @param documentId - The document ID
 * @param options - PDF generation options
 * @returns Promise resolving to the PDF generation result
 */
export async function generatePDF(
  documentType: DocumentType | string,
  documentId: string,
  options?: Partial<PDFGenerationOptions>
): Promise<PDFGenerationResult> {
  try {
    // Validate inputs
    if (!documentId) {
      return { 
        success: false, 
        error: 'No document ID provided',
        documentId,
        documentType: validateDocumentType(documentType)
      };
    }

    // Validate and normalize options
    const validatedOptions = validatePDFOptions(options);
    
    // Normalize document type
    const normalizedType = validateDocumentType(documentType);
    
    // Fetch document data
    const document = await fetchDocumentData(normalizedType, documentId);
    
    if (!document) {
      return { 
        success: false, 
        error: `Failed to fetch ${normalizedType} data: Document not found`,
        documentId,
        documentType: normalizedType
      };
    }
    
    // If document already has a PDF URL and we're not forcing regeneration, return it
    if (!validatedOptions.forceRegenerate && document.supabase_pdf_url) {
      console.log(`Using existing PDF URL for ${normalizedType}: ${document.supabase_pdf_url}`);
      return { 
        success: true, 
        url: document.supabase_pdf_url,
        documentId,
        documentType: normalizedType
      };
    }
    
    // Convert to backend format
    const backendType = getBackendDocumentTypeKey(normalizedType);
    
    // Call the standardized pdf-backend function
    const { data: result, error } = await supabase.functions.invoke('pdf-backend', {
      body: {
        action: 'generate',
        documentType: backendType,
        documentId,
        project_id: validatedOptions.projectId, // Explicit project ID per Glide sync pattern
        forceRegenerate: validatedOptions.forceRegenerate
      }
    });
    
    if (error) {
      console.error(`PDF generation failed for ${normalizedType}:`, error);
      return { 
        success: false, 
        error: `PDF generation failed: ${error.message}`,
        documentId,
        documentType: normalizedType
      };
    }
    
    if (result?.url) {
      console.log(`Successfully generated ${normalizedType} PDF: ${result.url}`);
      
      // Handle download if requested
      if (validatedOptions.download && result.url) {
        await downloadPDF(result.url, validatedOptions.filename || `${backendType}_${documentId}.pdf`);
      }
      
      return { 
        success: true, 
        url: result.url,
        documentId,
        documentType: normalizedType
      };
    } else {
      return { 
        success: false, 
        error: 'PDF generation failed: No URL returned',
        documentId,
        documentType: normalizedType
      };
    }
  } catch (error) {
    console.error(`Error in generatePDF for ${documentType}:`, error);
    return { 
      success: false, 
      error: `Error generating PDF: ${(error as Error).message}`,
      documentId,
      documentType: documentType as DocumentType
    };
  }
}

/**
 * Fetches document data from the database
 * 
 * @param documentType - The type of document
 * @param documentId - The document ID
 * @returns Promise resolving to the document data or null if not found
 */
async function fetchDocumentData(
  documentType: DocumentType,
  documentId: string
): Promise<Invoice | PurchaseOrder | Estimate | null> {
  try {
    let result;
    
    switch (documentType) {
      case DocumentType.INVOICE:
        result = await supabase
          .from('gl_invoices')
          .select('*')
          .eq('id', documentId)
          .single();
        break;
      case DocumentType.ESTIMATE:
        result = await supabase
          .from('gl_estimates')
          .select('*')
          .eq('id', documentId)
          .single();
        break;
      case DocumentType.PURCHASE_ORDER:
        result = await supabase
          .from('gl_purchase_orders')
          .select('*')
          .eq('id', documentId)
          .single();
        break;
      default:
        throw new Error(`Unsupported document type: ${documentType}`);
    }
    
    if (result.error) {
      console.error(`Failed to fetch ${documentType} data:`, result.error);
      return null;
    }
    
    return result.data;
  } catch (error) {
    console.error(`Error fetching document data:`, error);
    return null;
  }
}

/**
 * Downloads a PDF from a URL
 * 
 * @param url - The URL of the PDF to download
 * @param filename - The filename to use for the downloaded PDF
 */
async function downloadPDF(url: string, filename: string): Promise<void> {
  try {
    // Create a link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading PDF:', error);
  }
}

/**
 * Batch generates PDFs for multiple documents
 * 
 * @param documentType - The type of documents
 * @param documentIds - Array of document IDs
 * @param options - PDF generation options
 * @returns Promise resolving to an array of PDF generation results
 */
export async function batchGeneratePDFs(
  documentType: DocumentType | string,
  documentIds: string[],
  options?: Partial<PDFGenerationOptions>
): Promise<PDFGenerationResult[]> {
  // Validate inputs
  if (!documentIds.length) {
    return [{
      success: false,
      error: 'No document IDs provided',
      documentType: validateDocumentType(documentType)
    }];
  }
  
  // Validate and normalize options
  const validatedOptions = validatePDFOptions(options);
  
  // Normalize document type
  const normalizedType = validateDocumentType(documentType);
  
  // Convert to backend format
  const backendType = getBackendDocumentTypeKey(normalizedType);
  
  try {
    // Call the batch endpoint of pdf-backend
    const { data: result, error } = await supabase.functions.invoke('pdf-backend', {
      body: {
        action: 'batch',
        documentType: backendType,
        documentIds,
        project_id: validatedOptions.projectId, // Explicit project ID per Glide sync pattern
        forceRegenerate: validatedOptions.forceRegenerate
      }
    });
    
    if (error) {
      console.error(`Batch PDF generation failed for ${normalizedType}:`, error);
      return documentIds.map(id => ({
        success: false,
        error: `Batch PDF generation failed: ${error.message}`,
        documentId: id,
        documentType: normalizedType
      }));
    }
    
    if (result?.results) {
      console.log(`Successfully processed batch PDF generation for ${normalizedType}`);
      return result.results;
    } else {
      return documentIds.map(id => ({
        success: false,
        error: 'Batch PDF generation failed: No results returned',
        documentId: id,
        documentType: normalizedType
      }));
    }
  } catch (error) {
    console.error(`Error in batchGeneratePDFs for ${documentType}:`, error);
    return documentIds.map(id => ({
      success: false,
      error: `Error generating PDFs: ${(error as Error).message}`,
      documentId: id,
      documentType: normalizedType
    }));
  }
}
