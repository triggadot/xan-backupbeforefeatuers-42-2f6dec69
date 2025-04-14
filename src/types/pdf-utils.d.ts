/**
 * PDF Utility Type Definitions
 * 
 * This file contains TypeScript type definitions for the PDF utility functions
 * used throughout the application for generating, storing, and managing PDFs.
 * 
 * @deprecated Use types from pdf.unified.ts instead for all new development.
 * This file will be removed in a future update. All new code should use the
 * standardized types and interfaces from pdf.unified.ts.
 * 
 * MIGRATION GUIDE:
 * - Import DocumentType from pdf.unified.ts instead of pdf-utils.d.ts
 * - Use the standardized interfaces in pdf.unified.ts for document types
 * - Use the date handling utilities in pdf.unified.ts for consistent date formatting
 * - Use the property normalization utilities for consistent property access
 */

import { jsPDF } from 'jspdf';
import { DocumentType, LegacyDocumentTypeString } from './pdf.unified';

/**
 * @deprecated Use DocumentType enum from pdf.unified.ts instead
 */
export { DocumentType, LegacyDocumentTypeString };

/**
 * Supported document tables in the database
 * @deprecated Use documentTypeConfig from pdf.unified.ts instead
 */
export type DocumentTable = 'gl_invoices' | 'gl_purchase_orders' | 'gl_estimates';

/**
 * Supported storage folders for PDFs
 * @deprecated Use documentTypeConfig from pdf.unified.ts instead
 */
export type StorageFolder = 'Invoices' | 'PurchaseOrders' | 'Estimates';

/**
 * Mapping between document types and their corresponding database tables
 * @deprecated Use documentTypeConfig from pdf.unified.ts instead
 */
export interface DocumentTableMap {
  invoice: 'gl_invoices';
  purchaseOrder: 'gl_purchase_orders';
  estimate: 'gl_estimates';
}

/**
 * Mapping between document types and their corresponding storage folders
 * @deprecated Use documentTypeConfig from pdf.unified.ts instead
 */
export interface StorageFolderMap {
  invoice: 'Invoices';
  purchaseOrder: 'PurchaseOrders';
  estimate: 'Estimates';
}

/**
 * Base document interface with common properties
 */
export interface BaseDocument {
  id: string;
  glide_row_id: string;
  supabase_pdf_url?: string;
  [key: string]: any;
}

/**
 * Invoice document interface
 */
export interface Invoice extends BaseDocument {
  invoice_uid: string;
  invoice_order_date: string | Date;
  rowid_accounts?: string;
  total_amount?: number;
}

/**
 * Purchase Order document interface
 */
export interface PurchaseOrder extends BaseDocument {
  purchase_order_uid: string;
  po_date?: string | Date;
  rowid_accounts?: string;
  total_amount?: number;
}

/**
 * Estimate document interface
 */
export interface Estimate extends BaseDocument {
  estimate_uid: string;
  estimate_date?: string | Date;
  rowid_accounts?: string;
  total_amount?: number;
}

/**
 * Result of a PDF generation operation
 */
export interface PDFGenerationResult {
  success: boolean;
  pdfUrl: string | null;
  error?: string;
  documentId: string;
  documentType: DocumentType;
}

/**
 * Result of a batch PDF generation operation
 */
export interface BatchPDFGenerationResult {
  totalDocuments: number;
  successCount: number;
  failureCount: number;
  results: PDFGenerationResult[];
}

/**
 * Options for PDF generation
 */
export interface PDFGenerationOptions {
  saveLocally?: boolean;
  updateDatabase?: boolean;
  customFileName?: string;
}

/**
 * PDF job status for batch operations
 */
export type PDFJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * PDF batch job definition
 */
export interface PDFBatchJob {
  id: string;
  documentType: DocumentType;
  documentIds: string[];
  status: PDFJobStatus;
  progress: number;
  results?: PDFGenerationResult[];
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

/**
 * Document summary for batch operations UI
 */
export interface DocumentSummary {
  id: string;
  name: string;
  date?: string | Date;
  selected?: boolean;
}

/**
 * Generates a PDF for an invoice
 * 
 * @param invoice - The invoice data to generate a PDF for
 * @returns A jsPDF document instance or null if generation fails
 */
export function generateInvoicePDF(invoice: Invoice): jsPDF | null;

/**
 * Generates a PDF for a purchase order
 * 
 * @param purchaseOrder - The purchase order data to generate a PDF for
 * @returns A jsPDF document instance or null if generation fails
 */
export function generatePurchaseOrderPDF(purchaseOrder: PurchaseOrder): jsPDF | null;

/**
 * Generates a PDF for an estimate
 * 
 * @param estimate - The estimate data to generate a PDF for
 * @returns A jsPDF document instance or null if generation fails
 */
export function generateEstimatePDF(estimate: Estimate): jsPDF | null;

/**
 * Generates a PDF based on document type
 * 
 * @param documentType - The type of document to generate a PDF for
 * @param document - The document data
 * @returns A jsPDF document instance or null if generation fails
 * 
 * @example
 * ```typescript
 * const pdf = generatePDF('invoice', invoiceData);
 * if (pdf) {
 *   pdf.save('invoice.pdf');
 * }
 * ```
 */
export function generatePDF(
  documentType: DocumentType,
  document: Invoice | PurchaseOrder | Estimate
): jsPDF | null;

/**
 * Uploads a PDF to Supabase storage
 * 
 * @param doc - The jsPDF document to upload
 * @param folderName - The folder to store the PDF in
 * @param fileName - The name to give the PDF file
 * @returns Promise resolving to the URL of the uploaded PDF or null if upload fails
 * 
 * @example
 * ```typescript
 * const pdf = generateInvoicePDF(invoice);
 * if (pdf) {
 *   const url = await uploadPDFToStorage(pdf, 'Invoices', `invoice_${invoice.invoice_uid}.pdf`);
 *   console.log('PDF uploaded to:', url);
 * }
 * ```
 */
export function uploadPDFToStorage(
  doc: jsPDF,
  folderName: StorageFolder,
  fileName: string
): Promise<string | null>;

/**
 * Generates and stores a PDF for an invoice
 * 
 * @param invoice - The invoice data
 * @param saveLocally - Whether to also save the PDF locally
 * @returns Promise resolving to the URL of the uploaded PDF or null if generation/upload fails
 */
export function generateAndStoreInvoicePDF(
  invoice: Invoice,
  saveLocally?: boolean
): Promise<string | null>;

/**
 * Generates and stores a PDF for a purchase order
 * 
 * @param purchaseOrder - The purchase order data
 * @param saveLocally - Whether to also save the PDF locally
 * @returns Promise resolving to the URL of the uploaded PDF or null if generation/upload fails
 */
export function generateAndStorePurchaseOrderPDF(
  purchaseOrder: PurchaseOrder,
  saveLocally?: boolean
): Promise<string | null>;

/**
 * Generates and stores a PDF for an estimate
 * 
 * @param estimate - The estimate data
 * @param saveLocally - Whether to also save the PDF locally
 * @returns Promise resolving to the URL of the uploaded PDF or null if generation/upload fails
 */
export function generateAndStoreEstimatePDF(
  estimate: Estimate,
  saveLocally?: boolean
): Promise<string | null>;

/**
 * Updates a document's PDF link in the database
 * 
 * @param table - The database table to update
 * @param id - The ID of the document to update
 * @param pdfUrl - The URL of the PDF to store
 * @returns Promise resolving to a boolean indicating success
 * 
 * @example
 * ```typescript
 * const success = await updatePDFLinkInDatabase(
 *   'gl_invoices',
 *   invoice.id,
 *   'https://example.com/path/to/pdf.pdf'
 * );
 * if (success) {
 *   console.log('Database updated successfully');
 * }
 * ```
 */
export function updatePDFLinkInDatabase(
  table: DocumentTable,
  id: string,
  pdfUrl: string
): Promise<boolean>;

/**
 * Generates and stores a PDF for any supported document type
 * 
 * This is the main function to use for PDF generation as it handles
 * the entire workflow of generating, storing, and updating the database.
 * 
 * @param type - The type of document to generate a PDF for
 * @param data - The document data
 * @param saveLocally - Whether to also save the PDF locally
 * @returns Promise resolving to the URL of the uploaded PDF or null if generation/upload fails
 * 
 * @example
 * ```typescript
 * // Generate and store an invoice PDF
 * const pdfUrl = await generateAndStorePDF('invoice', invoice);
 * if (pdfUrl) {
 *   console.log('PDF generated and stored at:', pdfUrl);
 * }
 * 
 * // Generate, store, and download a purchase order PDF
 * const pdfUrl = await generateAndStorePDF('purchaseOrder', purchaseOrder, true);
 * ```
 */
export function generateAndStorePDF(
  type: DocumentType,
  data: Invoice | PurchaseOrder | Estimate,
  saveLocally?: boolean
): Promise<string | null>;

/**
 * Creates a batch PDF generation job
 * 
 * @param documentType - The type of documents to generate PDFs for
 * @param documentIds - Array of document IDs to generate PDFs for
 * @returns Promise resolving to the created batch job
 */
export function createPDFBatchJob(
  documentType: DocumentType,
  documentIds: string[]
): Promise<PDFBatchJob>;

/**
 * Processes a PDF batch job
 * 
 * @param job - The batch job to process
 * @returns Promise resolving to the updated batch job with results
 */
export function processPDFBatchJob(job: PDFBatchJob): Promise<PDFBatchJob>;

/**
 * Gets the status of a PDF batch job
 * 
 * @param jobId - The ID of the batch job to check
 * @returns Promise resolving to the current status of the batch job
 */
export function getPDFBatchJobStatus(jobId: string): Promise<PDFBatchJob | null>;

/**
 * Creates a ZIP file containing multiple PDFs
 * 
 * @param pdfUrls - Array of PDF URLs to include in the ZIP
 * @param zipFileName - Name for the ZIP file
 * @returns Promise resolving to a Blob containing the ZIP file
 */
export function createPDFZipArchive(
  pdfUrls: string[],
  zipFileName: string
): Promise<Blob>;
