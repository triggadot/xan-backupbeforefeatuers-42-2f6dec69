/**
 * Type definitions for PDF generation queue system
 * Matches Supabase database structure
 */
import { DocumentType } from './types.ts';

/**
 * Interface for PDF generation log entry
 * @interface PDFGenerationLog
 */
export interface PDFGenerationLog {
  /** Unique identifier for the log entry */
  id?: number;
  /** Source of the trigger (e.g., 'manual', 'queue', 'schedule', 'webhook') */
  trigger_source: string;
  /** Type of document (invoice, estimate, purchase_order) */
  document_type: string;
  /** ID of the document */
  document_id: string;
  /** Type of trigger (FUNCTION, WEBHOOK, MANUAL, QUEUE_ITEM, ERROR) */
  trigger_type: string;
  /** Error message if any */
  error_message?: string;
  /** Whether the operation was successful */
  success: boolean;
  /** Timestamp when the log was created */
  created_at?: string;
}

/**
 * Interface for PDF generation queue item
 * @interface PDFGenerationQueueItem
 */
export interface PDFGenerationQueueItem {
  /** Unique identifier for the queue item */
  id?: string;
  /** Type of document (invoice, estimate, purchase_order) */
  document_type: string;
  /** ID of the document */
  document_id: string;
  /** Timestamp when the item was created */
  created_at?: string;
  /** Timestamp when the item was processed */
  processed_at?: string;
  /** Number of processing attempts */
  attempts?: number;
  /** Whether the processing was successful */
  success?: boolean;
  /** Error message if processing failed */
  error_message?: string;
}

/**
 * Create a new queue item
 * 
 * @param {DocumentType | string} documentType - Type of document
 * @param {string} documentId - ID of the document
 * @returns {PDFGenerationQueueItem} Queue item
 */
export function createQueueItem(documentType: DocumentType | string, documentId: string): PDFGenerationQueueItem {
  return {
    document_type: typeof documentType === 'string' ? documentType : documentType,
    document_id: documentId,
    attempts: 0
  };
}

/**
 * Create a new log entry
 * 
 * @param {string} triggerSource - Source of the trigger
 * @param {string} documentType - Type of document
 * @param {string} documentId - ID of the document
 * @param {string} triggerType - Type of trigger
 * @param {boolean} success - Whether the operation was successful
 * @param {string} errorMessage - Error message if any
 * @returns {PDFGenerationLog} Log entry
 */
export function createLogEntry(
  triggerSource: string,
  documentType: string,
  documentId: string,
  triggerType: string,
  success: boolean = true,
  errorMessage?: string
): PDFGenerationLog {
  return {
    trigger_source: triggerSource,
    document_type: documentType,
    document_id: documentId,
    trigger_type: triggerType,
    success,
    error_message: errorMessage
  };
}
