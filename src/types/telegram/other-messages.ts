/**
 * Types for non-media Telegram messages.
 */
import { ProcessingState } from './processing-states';
import { AnalyzedContent } from './caption-data';

/**
 * Interface representing a non-media message record in the database.
 */
export interface OtherMessage {
  id: string; // UUID
  telegram_message_id: number; // BIGINT
  chat_id: number; // BIGINT
  chat_type: string; // USER-DEFINED ENUM
  chat_title?: string; // TEXT
  message_text?: string; // TEXT
  message_type: string; // TEXT
  is_edited: boolean; // BOOLEAN
  edit_date?: Date; // TIMESTAMP WITH TIME ZONE
  edit_history?: Record<string, any>[]; // JSONB
  edit_count?: number; // BIGINT
  processing_state: ProcessingState; // USER-DEFINED ENUM
  processing_started_at?: Date; // TIMESTAMP WITH TIME ZONE
  processing_completed_at?: Date; // TIMESTAMP WITH TIME ZONE
  processing_correlation_id?: string; // UUID
  analyzed_content?: AnalyzedContent; // JSONB
  old_analyzed_content?: AnalyzedContent; // JSONB
  error_message?: string; // TEXT
  created_at: Date; // TIMESTAMP WITH TIME ZONE
  updated_at: Date; // TIMESTAMP WITH TIME ZONE
  correlation_id?: string; // TEXT
  user_id?: string; // UUID
  is_forward?: boolean; // BOOLEAN
  forward_info?: Record<string, any>; // JSONB
  retry_count?: number; // INTEGER
  last_error_at?: Date; // TIMESTAMP WITH TIME ZONE
  message_data?: Record<string, any>; // JSONB - Complete Telegram message
  processing_error?: string; // TEXT
  message_url?: string; // TEXT
}

/**
 * Message types for non-media messages.
 */
export enum MessageType {
  TEXT = 'text',
  COMMAND = 'command',
  SERVICE = 'service',
  UNKNOWN = 'unknown',
}

/**
 * Parameters for creating a new non-media message record.
 */
export interface CreateOtherMessageParams {
  telegram_message_id: number;
  chat_id: number;
  chat_type: string;
  chat_title?: string;
  message_text?: string;
  message_type: MessageType | string;
  is_edited?: boolean;
  edit_date?: Date;
  message_data?: Record<string, any>;
  is_forward?: boolean;
  forward_info?: Record<string, any>;
  processing_state?: ProcessingState;
  correlation_id?: string;
  user_id?: string;
  message_url?: string;
}

/**
 * Parameters for updating an existing non-media message record.
 */
export interface UpdateOtherMessageParams {
  id: string;
  message_text?: string;
  analyzed_content?: AnalyzedContent;
  old_analyzed_content?: AnalyzedContent;
  processing_state?: ProcessingState;
  processing_started_at?: Date;
  processing_completed_at?: Date;
  processing_correlation_id?: string;
  edit_history?: Record<string, any>[];
  edit_count?: number;
  retry_count?: number;
  last_error_at?: Date;
  processing_error?: string;
  error_message?: string;
}

/**
 * Response from the upsertTextMessage database function.
 */
export interface UpsertOtherMessageResponse {
  success: boolean;
  id: string;
  error?: string;
}
