/**
 * Adapter module for bridging the frontend PDF generator with edge functions
 * This enables code reuse between frontend and Supabase edge functions
 */

// Importing types and utilities from shared types
import { DocumentType, documentTypeConfig } from './shared-types';

/**
 * Format currency consistently
 * @param amount Currency amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date consistently
 * @param dateString Date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
}

/**
 * Format a date string to a short date format (MM/DD/YYYY)
 * @param dateString Date string to format
 * @returns Formatted date string or 'N/A' if date is invalid
 */
export function formatShortDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (error) {
    console.error('Error formatting short date:', error);
    return 'N/A';
  }
}

/**
 * Standardizes document type format for internal processing
 * @param type Document type string to normalize
 * @returns Normalized DocumentType enum value
 */
export function normalizeDocumentType(type: string): DocumentType {
  if (!type) {
    throw new Error('Document type is required');
  }
  
  // Normalize the input type (lowercase, no spaces)
  const normalizedInput = type.toLowerCase().trim();
  
  // Check if we have a direct match in our aliases
  if (normalizedInput in documentTypeAliases) {
    return documentTypeAliases[normalizedInput];
  }
  
  // Try matching by starting substring
  for (const [alias, docType] of Object.entries(documentTypeAliases)) {
    if (normalizedInput.startsWith(alias) || alias.startsWith(normalizedInput)) {
      return docType;
    }
  }
  
  throw new Error(`Unsupported document type: ${type}`);
}

/**
 * Convert data from edge function format to the format expected by the shared PDF generator
 * @param documentType Normalized document type
 * @param data Raw document data from the database
 * @returns Formatted data compatible with the shared PDF generator
 */
export function adaptDataForSharedGenerator(documentType: DocumentType, data: any): any {
  // Create a deep copy to avoid modifying the original
  const adaptedData = JSON.parse(JSON.stringify(data));
  
  switch (documentType) {
    case DocumentType.INVOICE:
      // Ensure invoice lines are properly formatted
      if (adaptedData.invoice_lines) {
        adaptedData.lines = adaptedData.invoice_lines.map((line: any) => ({
          ...line,
          product: line.gl_products || {}
        }));
      }
      
      // Ensure customer payments are properly formatted
      if (adaptedData.customer_payments) {
        adaptedData.customer_payments = adaptedData.customer_payments.map((payment: any) => ({
          id: payment.id,
          payment_amount: payment.payment_amount,
          date_of_payment: payment.date_of_payment,
          type_of_payment: payment.type_of_payment,
          payment_note: payment.payment_note
        }));
      }
      break;
      
    case DocumentType.PURCHASE_ORDER:
      // For purchase orders, products are the line items
      if (adaptedData.products) {
        adaptedData.lineItems = adaptedData.products.map((product: any) => ({
          id: product.id,
          quantity: product.total_qty_purchased,
          unitPrice: product.cost,
          total: (product.total_qty_purchased || 0) * (product.cost || 0),
          description: product.vendor_product_name,
          productId: product.id,
          new_product_name: product.new_product_name,
          vendor_product_name: product.vendor_product_name,
          display_name: product.display_name || product.new_product_name || product.vendor_product_name,
          unit_price: product.cost,
          notes: product.purchase_notes,
          samples: product.samples,
          fronted: product.fronted,
          category: product.category,
          total_units: product.total_qty_purchased
        }));
      }
      
      // Format vendor payments
      if (adaptedData.vendor_payments) {
        adaptedData.vendorPayments = adaptedData.vendor_payments.map((payment: any) => ({
          id: payment.id,
          amount: payment.payment_amount,
          date: payment.date_of_payment,
          method: payment.type_of_payment || 'Other',
          notes: payment.vendor_purchase_note
        }));
      }
      break;
      
    case DocumentType.ESTIMATE:
      // Ensure estimate lines are properly formatted
      if (adaptedData.estimate_lines) {
        adaptedData.lines = adaptedData.estimate_lines.map((line: any) => ({
          ...line,
          product: line.gl_products || {}
        }));
      }
      
      // Format customer credits
      if (adaptedData.customer_credits) {
        adaptedData.customer_credits = adaptedData.customer_credits.map((credit: any) => ({
          id: credit.id,
          payment_amount: credit.payment_amount,
          date_of_payment: credit.date_of_payment,
          payment_type: credit.payment_type,
          payment_note: credit.payment_note
        }));
      }
      break;
  }
  
  return adaptedData;
}

/**
 * Generate a standardized filename for the PDF document
 * @param documentType Normalized document type
 * @param documentData Document data
 * @returns Generated filename
 */
export function generateFileName(documentType: DocumentType, documentData: any): string {
  try {
    // Get the document UID based on document type
    let documentUid = null;
    let fallbackPrefix = 'DOC#';
    
    switch (documentType) {
      case DocumentType.INVOICE:
        documentUid = documentData.invoice_uid;
        fallbackPrefix = 'INV#';
        break;
      case DocumentType.PURCHASE_ORDER:
        documentUid = documentData.purchase_order_uid;
        fallbackPrefix = 'PO#';
        break;
      case DocumentType.ESTIMATE:
        documentUid = documentData.estimate_uid;
        fallbackPrefix = documentData.is_a_sample === true ? 'SMP#' : 'EST#';
        break;
    }
    
    // If we have a valid document UID, use it directly
    if (documentUid) {
      console.log(`Using document UID for filename: ${documentUid}.pdf`);
      return `${documentUid}.pdf`;
    }
    
    // For documents without UIDs, use a fallback approach
    console.warn(`No document UID found for ${documentType}, using fallback ID`);
    
    // Use the document ID or glide_row_id as fallback
    const fallbackId = documentData?.id || documentData?.glide_row_id || 'UNKNOWNID';
    const fallbackFilename = `${fallbackPrefix}${fallbackId}.pdf`;
    
    console.log(`Using fallback filename: ${fallbackFilename}`);
    return fallbackFilename;
  } catch (error) {
    console.error('Critical error during filename generation:', error);
    // Final desperate fallback
    const fallbackId = documentData?.id || documentData?.glide_row_id || Date.now();
    return `${documentType.toLowerCase()}-${fallbackId}-ERROR.pdf`;
  }
}

/**
 * Get the storage folder path for a document type
 * @param documentType Normalized document type
 * @returns Storage folder path
 */
export function getStorageFolderPath(documentType: DocumentType): string {
  return documentTypeConfig[documentType].storageFolder;
}

/**
 * Generate the database field name to store the PDF URL
 * @param documentType Normalized document type
 * @returns Database field name
 */
export function getPdfUrlField(documentType: DocumentType): string {
  // Always use supabase_pdf_url as per project standards
  return 'supabase_pdf_url';
}
