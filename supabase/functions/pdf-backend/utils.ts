/**
 * Utility functions for the PDF backend edge function
 */
import { format, parseISO } from 'date-fns';

/**
 * Error types for PDF operations
 * @enum {string}
 */
export enum PDFErrorType {
  /** Error during PDF generation */
  GENERATION_ERROR = 'GENERATION_ERROR',
  /** Error during PDF storage */
  STORAGE_ERROR = 'STORAGE_ERROR',
  /** Error during data fetching */
  FETCH_ERROR = 'FETCH_ERROR',
  /** Error during data validation */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** Unknown or unexpected error */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Interface for PDF operation errors
 * @interface PDFError
 */
export interface PDFError {
  /** Type of error that occurred */
  type: PDFErrorType;
  /** Human-readable error message */
  message: string;
  /** Additional error details for debugging */
  details?: any;
}

/**
 * Interface for PDF operation results
 * @interface PDFOperationResult
 */
export interface PDFOperationResult {
  /** Whether the operation was successful */
  success: boolean;
  /** URL of the generated PDF, if successful */
  url: string | null;
  /** Error details if the operation failed */
  error?: PDFError;
}

/**
 * Format a date as a short date string (MM/DD/YYYY)
 * 
 * @param {string | Date | null | undefined} dateInput - Date to format
 * @returns {string} Formatted date string or 'N/A' if input is invalid
 * 
 * @example
 * formatShortDate('2023-04-15');
 * // returns '04/15/2023'
 * 
 * @example
 * formatShortDate(null);
 * // returns 'N/A'
 */
export function formatShortDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'N/A';
  
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    return format(date, 'MM/dd/yyyy');
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid Date';
  }
}

/**
 * Format a currency amount using Intl.NumberFormat
 * 
 * @param {number | null | undefined} amount - Amount to format
 * @returns {string} Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56);
 * // returns '$1,234.56'
 * 
 * @example
 * formatCurrency(null);
 * // returns '$0.00'
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
 * Format a date with a custom format pattern
 * 
 * @param {string | Date | null | undefined} dateInput - Date to format
 * @param {string} formatPattern - Format pattern to use (default: 'MMMM dd, yyyy')
 * @returns {string} Formatted date string or 'N/A' if input is invalid
 * 
 * @example
 * formatDate('2023-04-15', 'MMMM dd, yyyy');
 * // returns 'April 15, 2023'
 */
export function formatDate(
  dateInput: string | Date | null | undefined,
  formatPattern: string = 'MMMM dd, yyyy'
): string {
  if (!dateInput) return 'N/A';
  
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    return format(date, formatPattern);
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid Date';
  }
}

/**
 * Create a PDF error object
 * 
 * @param {PDFErrorType} type - Error type
 * @param {string} message - Error message
 * @param {any} details - Optional error details
 * @returns {PDFError} PDF error object
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
 * 
 * @param {string} url - URL of the generated PDF
 * @returns {PDFOperationResult} Successful PDF operation result
 */
export function createPDFSuccess(url: string): PDFOperationResult {
  return {
    success: true,
    url
  };
}

/**
 * Create a failed PDF operation result
 * 
 * @param {PDFError} error - PDF error
 * @returns {PDFOperationResult} Failed PDF operation result
 */
export function createPDFFailure(error: PDFError): PDFOperationResult {
  return {
    success: false,
    url: null,
    error
  };
}

/**
 * Generate a filename for a document
 * 
 * @param {string} prefix - Document type prefix (INV, EST, PO, etc.)
 * @param {string} id - Document ID or UID
 * @returns {string} Filename with .pdf extension
 * 
 * @example
 * generateFilename('INV', '12345');
 * // returns 'INV12345.pdf'
 */
export function generateFilename(prefix: string, id: string): string {
  return `${prefix}${id}.pdf`;
}

/**
 * Safely get a string from an object, providing a default if not found
 * 
 * @param {any} obj - Object to extract value from
 * @param {string} key - Key to extract
 * @param {string} defaultValue - Default value if key not found or value is null/undefined
 * @returns {string} Extracted value or default
 */
export function safeGetString(obj: any, key: string, defaultValue: string = ''): string {
  if (!obj || obj[key] === null || obj[key] === undefined) {
    return defaultValue;
  }
  
  return String(obj[key]);
}

/**
 * Safely get a number from an object, providing a default if not found
 * 
 * @param {any} obj - Object to extract value from
 * @param {string} key - Key to extract
 * @param {number} defaultValue - Default value if key not found or value is null/undefined
 * @returns {number} Extracted value or default
 */
export function safeGetNumber(obj: any, key: string, defaultValue: number = 0): number {
  if (!obj || obj[key] === null || obj[key] === undefined) {
    return defaultValue;
  }
  
  const parsed = parseFloat(obj[key]);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safely get a boolean from an object, providing a default if not found
 * 
 * @param {any} obj - Object to extract value from
 * @param {string} key - Key to extract
 * @param {boolean} defaultValue - Default value if key not found or value is null/undefined
 * @returns {boolean} Extracted value or default
 */
export function safeGetBoolean(obj: any, key: string, defaultValue: boolean = false): boolean {
  if (!obj || obj[key] === null || obj[key] === undefined) {
    return defaultValue;
  }
  
  return Boolean(obj[key]);
}

/**
 * Truncate a string to a maximum length and add ellipsis if needed
 * 
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + '...';
}

/**
 * Split text into lines to fit within a maximum width
 * This is a simplified version of the jsPDF splitTextToSize function
 * 
 * @param {string} text - Text to split
 * @param {number} maxWidth - Maximum width in points
 * @param {number} fontSize - Font size in points
 * @returns {string[]} Array of text lines
 */
export function splitTextToLines(text: string, maxWidth: number, fontSize: number = 10): string[] {
  if (!text) return [];
  
  // Rough estimate of characters per unit width based on fontSize
  // This is a simplified approximation - actual implementations would measure text width
  const avgCharWidth = fontSize * 0.5;
  const charsPerLine = Math.floor(maxWidth / avgCharWidth);
  
  // Split text on newlines first
  const paragraphs = text.split('\n');
  const lines: string[] = [];
  
  for (const paragraph of paragraphs) {
    if (paragraph.length <= charsPerLine) {
      lines.push(paragraph);
      continue;
    }
    
    // Split long paragraphs
    let currentLine = '';
    const words = paragraph.split(' ');
    
    for (const word of words) {
      if ((currentLine + word).length <= charsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  
  return lines;
}
