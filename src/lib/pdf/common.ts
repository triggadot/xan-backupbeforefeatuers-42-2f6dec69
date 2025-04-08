import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Database } from '@/integrations/supabase/types';
import { saveAs } from 'file-saver';

// The autoTable plugin adds this property to jsPDF instances
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
    autoTable: (options: {
      head?: Array<Array<string>>;
      body?: Array<Array<string | number>>;
      columns?: Array<{ header: string; dataKey: string }>;
      startY?: number;
      margin?: { top?: number; right?: number; bottom?: number; left?: number };
      styles?: any;
      headStyles?: any;
      bodyStyles?: any;
      theme?: string;
      didDrawPage?: (data: any) => void;
      didParseCell?: (data: any) => void;
      willDrawCell?: (data: any) => void;
      columnStyles?: any;
      html?: string | HTMLElement;
      data?: any;
    }) => any;
  }
}

// Common types for PDF generation
export type Account = Database['public']['Tables']['gl_accounts']['Row'];
export type Product = Database['public']['Tables']['gl_products']['Row'];

// Helper type for jspdf-autotable
export interface AutoTableColumn {
  header: string;
  dataKey: string;
}

/**
 * PDF error types for standardized error handling
 */
export enum PDFErrorType {
  FETCH_ERROR = 'FETCH_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

/**
 * Standardized PDF operation error structure
 */
export interface PDFOperationError {
  type: PDFErrorType;
  message: string;
  details?: any;
}

/**
 * Standardized PDF operation result
 */
export interface PDFOperationResult {
  success: boolean;
  url?: string;
  error?: PDFOperationError;
}

/**
 * Format currency consistently
 * 
 * @param amount - The amount to format
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56) // Returns '$1,234.56'
 * formatCurrency(null) // Returns '$0.00'
 */
export function formatCurrency(amount: number | null | undefined): string {
  const value = amount ?? 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Format date consistently
 * 
 * @param dateString - The date string to format
 * @returns Formatted date string or 'N/A' if date is invalid
 * 
 * @example
 * formatDate('2023-01-15') // Returns 'January 15, 2023'
 * formatDate('invalid') // Returns 'N/A'
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a date string to a short date format (MM/DD/YYYY)
 * 
 * @param dateString - The date string to format
 * @returns Formatted date string or 'N/A' if date is invalid
 * 
 * @example
 * formatShortDate('2023-01-15') // Returns '01/15/2023'
 * formatShortDate('invalid') // Returns 'N/A'
 */
export function formatShortDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Generate a standardized filename for PDF documents
 * 
 * @param prefix - The prefix for the filename (e.g., 'Invoice', 'PO', 'Estimate')
 * @param identifier - The unique identifier for the document
 * @param date - The date to include in the filename (optional)
 * @returns A standardized filename string
 * 
 * @example
 * generateFilename('Invoice', 'INV12345', new Date()) // Returns 'Invoice-INV12345-20230115.pdf'
 */
export function generateFilename(
  prefix: string,
  identifier: string,
  date?: Date | string
): string {
  let dateStr = '';
  
  if (date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isNaN(dateObj.getTime())) {
      dateStr = `-${dateObj.toISOString().split('T')[0].replace(/-/g, '')}`;
    }
  }
  
  // Clean the identifier (remove any special characters)
  const cleanIdentifier = identifier.replace(/[^a-zA-Z0-9]/g, '');
  
  return `${prefix}-${cleanIdentifier}${dateStr}.pdf`;
}

/**
 * Download a PDF from a URL
 * 
 * @param url - The URL of the PDF to download
 * @param fileName - The name to save the file as
 * @returns Promise resolving when download is complete
 * 
 * @example
 * await downloadPDF('https://example.com/invoice.pdf', 'Invoice-123.pdf');
 */
export async function downloadPDF(url: string, fileName: string): Promise<void> {
  try {
    // Fetch the PDF data from the URL
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // Use FileSaver.js to save the file
    saveAs(blob, fileName);
    
    console.log(`PDF downloaded successfully: ${fileName}`);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error(`Error downloading PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create a standardized table style configuration for PDF tables
 * 
 * @returns Table style configuration for jsPDF autoTable
 */
export function createTableStyles() {
  return {
    headStyles: {
      fillColor: [44, 62, 80], // Dark blue header
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240] // Light gray for alternate rows
    },
    margin: { top: 80 }
  };
}

/**
 * Add letterhead to a PDF document
 * 
 * @param doc - The jsPDF document
 * @param title - The title to display in the letterhead
 */
export function addLetterhead(doc: jsPDF, title: string): void {
  // Add letterhead
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text(title.toUpperCase(), 105, 20, { align: 'center' });
  doc.setFont(undefined, 'normal');
  
  // Add horizontal line
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);
}

/**
 * Add customer/vendor details to a PDF document
 * 
 * @param doc - The jsPDF document
 * @param label - The label for the section (e.g., 'Bill To:', 'Ship To:')
 * @param account - The account data
 * @param yPosition - The Y position to start drawing
 * @returns The updated Y position after drawing
 */
export function addAccountDetails(
  doc: jsPDF, 
  label: string, 
  account: Account | null | undefined,
  yPosition: number
): number {
  doc.setFontSize(11);
  doc.text(label, 20, yPosition);
  doc.setFont(undefined, 'bold');
  doc.text(account?.account_name || 'N/A', 20, yPosition + 10);
  doc.setFont(undefined, 'normal');
  
  return yPosition + 20;
}

/**
 * Create a PDF error result
 * 
 * @param type - The type of error
 * @param message - The error message
 * @param details - Additional error details (optional)
 * @returns A standardized error result
 */
export function createPDFError(
  type: PDFErrorType,
  message: string,
  details?: any
): PDFOperationResult {
  return {
    success: false,
    error: {
      type,
      message,
      details
    }
  };
}

/**
 * Create a successful PDF operation result
 * 
 * @param url - The URL of the generated PDF
 * @returns A standardized success result
 */
export function createPDFSuccess(url: string): PDFOperationResult {
  return {
    success: true,
    url
  };
}
