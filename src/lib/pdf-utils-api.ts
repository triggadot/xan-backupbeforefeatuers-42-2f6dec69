/**
 * @file PDF Utility Functions
 * @description TypeScript documentation for PDF generation, storage, and management functions
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Account type for PDF generation
 */
export interface Account {
  account_name?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;
  billing_country?: string;
  phone?: string;
  email?: string;
}

/**
 * Invoice type for PDF generation
 */
export interface Invoice {
  id?: string;
  glide_row_id?: string;
  invoice_uid?: string;
  invoice_number?: string;
  invoice_order_date?: string;
  due_date?: string;
  payment_status?: string;
  gl_accounts?: Account;
  lines?: InvoiceLine[];
  tax_rate?: number;
  tax_amount?: number;
  total_amount?: number;
  notes?: string;
  supabase_pdf_url?: string;
}

/**
 * Invoice line item type for PDF generation
 */
export interface InvoiceLine {
  renamed_product_name?: string;
  qty_sold?: number;
  selling_price?: number;
  line_total?: number;
  gl_products?: Product;
}

/**
 * Product type for PDF generation
 */
export interface Product {
  product_name?: string;
  product_description?: string;
  price?: number;
  sku?: string;
}

/**
 * Purchase order type for PDF generation
 */
export interface PurchaseOrder {
  id?: string;
  glide_row_id?: string;
  number?: string;
  date?: string;
  vendorName?: string;
  vendor?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  lineItems?: Array<{
    vendor_product_name?: string;
    qty?: number;
    cost?: number;
    line_total?: number;
  }>;
  status?: string;
  total_amount?: number;
  total_paid?: number;
  notes?: string;
  supabase_pdf_url?: string;
}

/**
 * Estimate type for PDF generation
 */
export interface Estimate {
  id?: string;
  glide_row_id?: string;
  estimate_uid?: string;
  estimate_number?: string;
  estimate_date?: string;
  expiration_date?: string;
  status?: string;
  gl_accounts?: Account;
  estimate_lines?: EstimateLine[];
  tax_rate?: number;
  tax_amount?: number;
  total_amount?: number;
  notes?: string;
  supabase_pdf_url?: string;
}

/**
 * Estimate line item type for PDF generation
 */
export interface EstimateLine {
  renamed_product_name?: string;
  qty?: number;
  price?: number;
  line_total?: number;
  gl_products?: Product;
}

/**
 * Helper type for jspdf-autotable
 */
export interface AutoTableColumn {
  header: string;
  dataKey: string;
}

/**
 * Document type union for PDF operations
 */
export type DocumentType = 'invoice' | 'purchaseOrder' | 'estimate';

/**
 * Format currency consistently
 * 
 * @param amount - The amount to format
 * @returns Formatted currency string
 * @example
 * // Returns "$1,234.56"
 * formatCurrency(1234.56);
 * 
 * // Returns "$0.00"
 * formatCurrency(null);
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date consistently
 * 
 * @param dateString - The date string to format
 * @returns Formatted date string (Month DD, YYYY)
 * @example
 * // Returns "January 1, 2023"
 * formatDate('2023-01-01');
 * 
 * // Returns "N/A"
 * formatDate(null);
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'N/A';
  }
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format date in MM/DD/YYYY format
 * 
 * @param dateString - The date string to format
 * @returns Formatted date string (MM/DD/YYYY)
 * @example
 * // Returns "01/01/2023"
 * formatShortDate('2023-01-01');
 * 
 * // Returns "N/A"
 * formatShortDate(null);
 */
export function formatShortDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'N/A';
  }
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Generate a PDF for an invoice
 * 
 * @param invoice - The invoice data with related account and line items
 * @returns jsPDF document object
 * @example
 * const invoice = {
 *   invoice_uid: 'INV-001',
 *   invoice_order_date: '2023-01-01',
 *   due_date: '2023-02-01',
 *   gl_accounts: {
 *     account_name: 'Acme Inc.',
 *     billing_address: '123 Main St'
 *   },
 *   lines: [
 *     {
 *       renamed_product_name: 'Product A',
 *       qty_sold: 2,
 *       selling_price: 100,
 *       line_total: 200
 *     }
 *   ],
 *   tax_rate: 10,
 *   tax_amount: 20,
 *   total_amount: 220
 * };
 * const doc = generateInvoicePDF(invoice);
 * doc.save('invoice.pdf');
 */
export function generateInvoicePDF(invoice: Invoice): jsPDF;

/**
 * Generate a PDF for a purchase order
 * 
 * @param purchaseOrder - The purchase order data with related vendor and line items
 * @returns jsPDF document object
 * @example
 * const purchaseOrder = {
 *   number: 'PO-001',
 *   date: '2023-01-01',
 *   vendorName: 'Supplier Inc.',
 *   vendor: {
 *     name: 'Supplier Inc.',
 *     address: '456 Vendor St'
 *   },
 *   lineItems: [
 *     {
 *       vendor_product_name: 'Material A',
 *       qty: 5,
 *       cost: 50,
 *       line_total: 250
 *     }
 *   ],
 *   total_amount: 250
 * };
 * const doc = generatePurchaseOrderPDF(purchaseOrder);
 * doc.save('purchase-order.pdf');
 */
export function generatePurchaseOrderPDF(purchaseOrder: PurchaseOrder): jsPDF;

/**
 * Generate a PDF for an estimate
 * 
 * @param estimate - The estimate data with related account and line items
 * @returns jsPDF document object
 * @example
 * const estimate = {
 *   estimate_uid: 'EST-001',
 *   estimate_date: '2023-01-01',
 *   expiration_date: '2023-02-01',
 *   gl_accounts: {
 *     account_name: 'Client Inc.',
 *     billing_address: '789 Client Ave'
 *   },
 *   estimate_lines: [
 *     {
 *       renamed_product_name: 'Service A',
 *       qty: 1,
 *       price: 500,
 *       line_total: 500
 *     }
 *   ],
 *   tax_rate: 8,
 *   tax_amount: 40,
 *   total_amount: 540
 * };
 * const doc = generateEstimatePDF(estimate);
 * doc.save('estimate.pdf');
 */
export function generateEstimatePDF(estimate: Estimate): jsPDF;

/**
 * Generate a PDF based on document type and data
 * 
 * @param type - The type of document ('invoice', 'purchaseOrder', or 'estimate')
 * @param data - The document data
 * @returns The generated PDF document or null if generation failed
 * @example
 * const invoice = { /* invoice data */ };
 * const doc = generatePDF('invoice', invoice);
 * if (doc) {
 *   doc.save('document.pdf');
 * }
 */
export function generatePDF(
  type: DocumentType,
  data: Invoice | PurchaseOrder | Estimate
): jsPDF | null;

/**
 * Generate a filename for a PDF document
 * 
 * @param prefix - The document type prefix (e.g., 'Invoice', 'PO', 'Estimate')
 * @param id - The document ID or UID
 * @param date - The document date
 * @returns A formatted filename string
 * @example
 * // Returns "Invoice_INV-001_2023-01-01.pdf"
 * generateFilename('Invoice', 'INV-001', '2023-01-01');
 * 
 * // Using Date object
 * generateFilename('PO', 'PO-123', new Date());
 */
export function generateFilename(prefix: string, id: string, date: Date | string): string {
  const formattedDate = typeof date === 'string' 
    ? new Date(date).toISOString().split('T')[0] 
    : date.toISOString().split('T')[0];
  
  return `${prefix}_${id}_${formattedDate}.pdf`;
}

/**
 * Store a PDF document in Supabase storage
 * 
 * @param doc - The jsPDF document to store
 * @param entityType - The type of entity ('invoice', 'purchase-order', 'estimate')
 * @param entityId - The ID of the entity
 * @param fileName - Optional custom filename
 * @returns The public URL of the stored PDF or null if storage failed
 * @example
 * const doc = generateInvoicePDF(invoice);
 * const url = await storePDFInSupabase(doc, 'invoice', invoice.id);
 * if (url) {
 *   console.log('PDF stored at:', url);
 * }
 * 
 * // With custom filename
 * const customUrl = await storePDFInSupabase(
 *   doc, 
 *   'invoice', 
 *   invoice.id, 
 *   'custom-invoice-name.pdf'
 * );
 */
export async function storePDFInSupabase(
  doc: jsPDF,
  entityType: 'invoice' | 'purchase-order' | 'estimate',
  entityId: string,
  fileName?: string
): Promise<string | null>;

/**
 * Upload a PDF to Supabase storage
 * 
 * @param doc - The jsPDF document to upload
 * @param folderName - The folder to store the PDF in (Invoices, PurchaseOrders, or Estimates)
 * @param fileName - The name of the file
 * @returns The URL of the uploaded file or null if upload failed
 * @example
 * const doc = generateInvoicePDF(invoice);
 * const url = await uploadPDFToStorage(doc, 'Invoices', 'INV-001.pdf');
 * if (url) {
 *   console.log('PDF uploaded at:', url);
 * }
 */
export async function uploadPDFToStorage(
  doc: jsPDF, 
  folderName: 'Invoices' | 'PurchaseOrders' | 'Estimates', 
  fileName: string
): Promise<string | null>;

/**
 * Generate, save locally, and upload an invoice PDF to Supabase storage
 * 
 * @param invoice - The invoice data
 * @param saveLocally - Whether to also save the PDF locally
 * @returns The URL of the uploaded file or null if upload failed
 * @example
 * const url = await generateAndStoreInvoicePDF(invoice);
 * if (url) {
 *   console.log('Invoice PDF stored at:', url);
 * }
 * 
 * // Save locally as well
 * const urlWithLocal = await generateAndStoreInvoicePDF(invoice, true);
 */
export async function generateAndStoreInvoicePDF(
  invoice: Invoice, 
  saveLocally?: boolean
): Promise<string | null>;

/**
 * Generate, save locally, and upload a purchase order PDF to Supabase storage
 * 
 * @param purchaseOrder - The purchase order data
 * @param saveLocally - Whether to also save the PDF locally
 * @returns The URL of the uploaded file or null if upload failed
 * @example
 * const url = await generateAndStorePurchaseOrderPDF(purchaseOrder);
 * if (url) {
 *   console.log('Purchase order PDF stored at:', url);
 * }
 * 
 * // Save locally as well
 * const urlWithLocal = await generateAndStorePurchaseOrderPDF(purchaseOrder, true);
 */
export async function generateAndStorePurchaseOrderPDF(
  purchaseOrder: PurchaseOrder, 
  saveLocally?: boolean
): Promise<string | null>;

/**
 * Generate, save locally, and upload an estimate PDF to Supabase storage
 * 
 * @param estimate - The estimate data
 * @param saveLocally - Whether to also save the PDF locally
 * @returns The URL of the uploaded file or null if upload failed
 * @example
 * const url = await generateAndStoreEstimatePDF(estimate);
 * if (url) {
 *   console.log('Estimate PDF stored at:', url);
 * }
 * 
 * // Save locally as well
 * const urlWithLocal = await generateAndStoreEstimatePDF(estimate, true);
 */
export async function generateAndStoreEstimatePDF(
  estimate: Estimate, 
  saveLocally?: boolean
): Promise<string | null>;

/**
 * Update the PDF link in the database after uploading
 * 
 * @param table - The table to update ('gl_invoices', 'gl_purchase_orders', or 'gl_estimates')
 * @param id - The ID of the record to update
 * @param pdfUrl - The URL of the uploaded PDF
 * @returns Whether the update was successful
 * @example
 * const doc = generateInvoicePDF(invoice);
 * const url = await uploadPDFToStorage(doc, 'Invoices', 'invoice.pdf');
 * if (url) {
 *   const updated = await updatePDFLinkInDatabase('gl_invoices', invoice.id, url);
 *   if (updated) {
 *     console.log('Database updated with PDF URL');
 *   }
 * }
 */
export async function updatePDFLinkInDatabase(
  table: 'gl_invoices' | 'gl_purchase_orders' | 'gl_estimates',
  id: string,
  pdfUrl: string
): Promise<boolean>;

/**
 * Complete workflow to generate, store, and update database with PDF link
 * 
 * @param type - The type of document ('invoice', 'purchaseOrder', 'estimate')
 * @param data - The document data
 * @param saveLocally - Whether to also save the PDF locally
 * @returns The URL of the uploaded PDF or null if any step failed
 * @example
 * // Generate, store, and update database for an invoice
 * const url = await generateAndStorePDF('invoice', invoice);
 * if (url) {
 *   console.log('Invoice PDF processed successfully:', url);
 * }
 * 
 * // With local download
 * const urlWithDownload = await generateAndStorePDF('purchaseOrder', purchaseOrder, true);
 */
export async function generateAndStorePDF(
  type: DocumentType,
  data: Invoice | PurchaseOrder | Estimate,
  saveLocally?: boolean
): Promise<string | null>;

/**
 * Hook for PDF operations including generation, storage, and downloading
 * 
 * @returns Object containing PDF operation functions and loading states
 * @example
 * function YourComponent() {
 *   const { generatePDF, downloadPDF, isGenerating } = usePDFOperations();
 *   
 *   const handleGeneratePDF = async () => {
 *     const url = await generatePDF('invoice', invoice);
 *     if (url) {
 *       console.log('PDF generated:', url);
 *     }
 *   };
 *   
 *   return (
 *     <button onClick={handleGeneratePDF} disabled={isGenerating}>
 *       {isGenerating ? 'Generating...' : 'Generate PDF'}
 *     </button>
 *   );
 * }
 */
export function usePDFOperations(): {
  generatePDF: (
    documentType: DocumentType,
    document: any,
    downloadAfterGeneration?: boolean
  ) => Promise<string | null>;
  downloadPDF: (url: string, fileName: string) => Promise<void>;
  isGenerating: boolean;
  isStoring: boolean;
};
