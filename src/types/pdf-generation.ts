/**
 * Types for PDF generation system
 */

/**
 * Enum for PDF document types
 */
export enum DocumentType {
  INVOICE = 'invoice',
  ESTIMATE = 'estimate',
  PURCHASE_ORDER = 'purchase_order',
}

/**
 * Enum for PDF error types
 */
export enum PDFErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Interface for PDF generation failure
 */
export interface PDFGenerationFailure {
  id: number;
  document_type: string;
  document_id: string;
  error_message: string | null;
  retry_count: number;
  first_attempt: string;
  last_attempt: string;
  next_attempt: string;
  resolved: boolean;
  requires_manual_intervention: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for retry results
 */
export interface RetryResult {
  id: number;
  documentType: string;
  documentId: string;
  success: boolean;
  retryCount: number;
  requiresManualIntervention?: boolean;
  message?: string;
  error?: string;
  url?: string;
}

/**
 * Interface for PDF generation options
 */
export interface PDFGenerationOptions {
  forceRegenerate?: boolean;
  overwriteExisting?: boolean;
}

/**
 * Interface for PDF scan options
 */
export interface PDFScanOptions {
  batchSize?: number;
  forceRegenerate?: boolean;
  overwriteExisting?: boolean;
}

/**
 * Interface for PDF retry options
 */
export interface PDFRetryOptions {
  maxRetries?: number;
  batchSize?: number;
}
