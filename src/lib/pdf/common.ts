
import { format } from 'date-fns';

/**
 * Error types for PDF operations
 */
export enum PDFErrorType {
  GENERATION_ERROR = 'GENERATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  FETCH_ERROR = 'FETCH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Interface for PDF operation errors
 */
export interface PDFError {
  type: PDFErrorType;
  message: string;
  details?: any;
}

/**
 * Interface for PDF operation results
 */
export interface PDFOperationResult {
  success: boolean;
  url: string | null;
  error?: PDFError;
}

/**
 * Format a date as a short date string (MM/DD/YYYY)
 * @param dateInput Date to format
 * @returns Formatted date string
 */
export function formatShortDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'N/A';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return format(date, 'MM/dd/yyyy');
  } catch (e) {
    return 'Invalid Date';
  }
}

/**
 * Format a currency amount
 * @param amount Amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Get table styles for PDF generation
 * @returns Table style configuration
 */
export function createTableStyles() {
  return {
    theme: 'striped',
    headStyles: {
      fillColor: [0, 51, 102],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    bodyStyles: {
      textColor: [50, 50, 50]
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  };
}

/**
 * Add letterhead to a PDF document
 * @param doc PDF document
 * @param companyName Company name
 * @param companyInfo Company info
 */
export function addLetterhead(doc: any, companyName: string, companyInfo: string) {
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 15, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(companyInfo, 15, 28);
}

/**
 * Add account details to a PDF document
 * @param doc PDF document
 * @param accountName Account name
 * @param accountInfo Account info
 */
export function addAccountDetails(doc: any, title: string, accountName: string, accountInfo: string) {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 15, 45);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(accountName, 15, 52);
  doc.text(accountInfo, 15, 58);
}

/**
 * Generate a filename for a PDF document
 * @param prefix Prefix for the filename
 * @param id Document ID
 * @returns Generated filename
 */
export function generateFilename(prefix: string, id: string): string {
  const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
  return `${prefix}_${id}_${timestamp}.pdf`;
}

/**
 * Create a PDF error object
 * @param type Error type
 * @param message Error message
 * @param details Optional error details
 * @returns PDF error object
 */
export function createPDFError(type: PDFErrorType, message: string, details?: any): PDFError {
  return {
    type,
    message,
    details
  };
}

/**
 * Create a successful PDF operation result
 * @param url URL of the generated PDF
 * @returns Successful PDF operation result
 */
export function createPDFSuccess(url: string): PDFOperationResult {
  return {
    success: true,
    url
  };
}

/**
 * Create a failed PDF operation result
 * @param error PDF error
 * @returns Failed PDF operation result
 */
export function createPDFFailure(error: PDFError): PDFOperationResult {
  return {
    success: false,
    url: null,
    error
  };
}
