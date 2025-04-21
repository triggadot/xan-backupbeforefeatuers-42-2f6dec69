import { supabase } from '@/integrations/supabase/client';

// Define the structure of a cache entry
interface PDFCacheEntry {
  documentId: string;
  documentType: 'invoice' | 'purchaseOrder' | 'estimate';
  pdfUrl: string;
  lastModified: string;
  hash: string;
}

// Define the structure of the document hash input
interface DocumentHashInput {
  id: string;
  updatedAt?: string;
  // Add any other fields that would trigger a PDF regeneration when changed
  total_amount?: number;
  balance?: number;
  status?: string;
}

/**
 * Generate a simple hash for a document to determine if it has changed
 * @param document The document to hash
 * @returns A string hash representing the document state
 */
function generateDocumentHash(document: DocumentHashInput): string {
  // Create a string from the document's key properties
  const hashInput = `${document.id}-${document.updatedAt || ''}-${document.total_amount || 0}-${document.balance || 0}-${document.status || ''}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString(16);
}

/**
 * Check if a PDF exists in the cache and is still valid
 * @param documentId The ID of the document
 * @param documentType The type of document
 * @param document The document data for hash comparison
 * @returns The cached PDF URL if valid, null otherwise
 */
export async function checkPDFCache(
  documentId: string,
  documentType: 'invoice' | 'purchaseOrder' | 'estimate',
  document: DocumentHashInput
): Promise<string | null> {
  try {
    // Generate a hash for the current document state
    const currentHash = generateDocumentHash(document);
    
    // Check the cache table for this document
    const { data, error } = await supabase
      .from('pdf_cache')
      .select('pdfUrl, hash')
      .eq('documentId', documentId)
      .eq('documentType', documentType)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    // If the hash matches, the document hasn't changed
    if (data.hash === currentHash) {
      return data.pdfUrl;
    }
    
    return null;
  } catch (error) {
    console.error('Error checking PDF cache:', error);
    return null;
  }
}

/**
 * Update the PDF cache with a new entry
 * @param documentId The ID of the document
 * @param documentType The type of document
 * @param pdfUrl The URL of the generated PDF
 * @param document The document data for hash generation
 */
export async function updatePDFCache(
  documentId: string,
  documentType: 'invoice' | 'purchaseOrder' | 'estimate',
  pdfUrl: string,
  document: DocumentHashInput
): Promise<void> {
  try {
    const hash = generateDocumentHash(document);
    const now = new Date().toISOString();
    
    // Upsert the cache entry
    const { error } = await supabase
      .from('pdf_cache')
      .upsert({
        documentId,
        documentType,
        pdfUrl,
        lastModified: now,
        hash
      }, {
        onConflict: 'documentId,documentType'
      });
    
    if (error) {
      console.error('Error updating PDF cache:', error);
    }
  } catch (error) {
    console.error('Error updating PDF cache:', error);
  }
}

/**
 * Invalidate a cache entry for a specific document
 * @param documentId The ID of the document
 * @param documentType The type of document
 */
export async function invalidatePDFCache(
  documentId: string,
  documentType: 'invoice' | 'purchaseOrder' | 'estimate'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('pdf_cache')
      .delete()
      .eq('documentId', documentId)
      .eq('documentType', documentType);
    
    if (error) {
      console.error('Error invalidating PDF cache:', error);
    }
  } catch (error) {
    console.error('Error invalidating PDF cache:', error);
  }
}

/**
 * Clear old cache entries that haven't been accessed in a while
 * @param olderThan Number of days to keep cache entries
 */
export async function cleanupPDFCache(olderThan: number = 30): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThan);
    
    const { error } = await supabase
      .from('pdf_cache')
      .delete()
      .lt('lastModified', cutoffDate.toISOString());
    
    if (error) {
      console.error('Error cleaning up PDF cache:', error);
    }
  } catch (error) {
    console.error('Error cleaning up PDF cache:', error);
  }
}
