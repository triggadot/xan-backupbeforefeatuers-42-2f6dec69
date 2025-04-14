/**
 * Types for the Telegram media messages table.
 */
import { ProcessingState } from './processing-states';
import { CaptionData } from './caption-data';

/**
 * Interface representing a media message record in the database.
 */
export interface MediaMessage {
  id: string; // UUID
  telegram_message_id: number; // BIGINT
  chat_id: number; // BIGINT
  chat_type?: string; // USER-DEFINED ENUM
  chat_title?: string; // TEXT
  file_unique_id?: string; // TEXT
  file_id?: string; // TEXT
  storage_path?: string; // TEXT
  public_url?: string; // TEXT
  mime_type?: string; // TEXT
  extension?: string; // TEXT
  caption?: string; // TEXT
  caption_data?: CaptionData; // JSONB
  analyzed_content?: CaptionData; // JSONB
  old_analyzed_content?: CaptionData; // JSONB - Most recent previous version
  processing_state: ProcessingState; // USER-DEFINED ENUM
  processing_started_at?: Date; // TIMESTAMP WITH TIME ZONE
  processing_completed_at?: Date; // TIMESTAMP WITH TIME ZONE
  processing_correlation_id?: string; // UUID
  media_group_id?: string; // TEXT
  message_data?: Record<string, any>; // JSONB - Complete Telegram message
  is_edited?: boolean; // BOOLEAN
  edit_date?: Date; // TIMESTAMP WITH TIME ZONE
  width?: number; // INTEGER
  height?: number; // INTEGER
  duration?: number; // INTEGER for videos/audio
  file_size?: number; // BIGINT
  storage_exists?: boolean; // BOOLEAN
  created_at: Date; // TIMESTAMP WITH TIME ZONE
  updated_at: Date; // TIMESTAMP WITH TIME ZONE
  message_type?: string; // TEXT
  media_type?: string; // TEXT
  processing_error?: string; // TEXT
  correlation_id?: string; // TEXT
  duplicate_reference_id?: string; // TEXT
  group_caption_synced?: boolean; // BOOLEAN indicating if this message's caption is synced across its group
}

/**
 * Media types that can be handled by the system.
 */
export enum MediaType {
  PHOTO = 'photo',
  VIDEO = 'video',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VOICE = 'voice',
  ANIMATION = 'animation',
  VIDEO_NOTE = 'video_note',
  STICKER = 'sticker',
}

/**
 * Parameters for creating a new media message record.
 */
export interface CreateMediaMessageParams {
  telegram_message_id: number;
  chat_id: number;
  chat_type: string;
  chat_title?: string;
  file_unique_id: string;
  file_id: string;
  storage_path?: string;
  public_url?: string;
  mime_type?: string;
  extension?: string;
  caption?: string;
  media_group_id?: string;
  message_data?: Record<string, any>;
  media_type: MediaType | string;
  width?: number;
  height?: number;
  duration?: number;
  file_size?: number;
  message_type: 'media';
  processing_state?: ProcessingState;
  correlation_id?: string;
}

/**
 * Parameters for updating an existing media message record.
 */
export interface UpdateMediaMessageParams {
  id: string;
  caption?: string;
  caption_data?: CaptionData;
  analyzed_content?: CaptionData;
  old_analyzed_content?: CaptionData;
  processing_state?: ProcessingState;
  processing_started_at?: Date;
  processing_completed_at?: Date;
  processing_correlation_id?: string;
  public_url?: string;
  storage_path?: string;
  processing_error?: string;
  is_edited?: boolean;
  edit_date?: Date;
  group_caption_synced?: boolean;
}

/**
 * Response from the upsertMediaMessage database function.
 */
export interface UpsertMediaMessageResponse {
  success: boolean;
  id: string;
  duplicateDetected?: boolean;
  captionChanged?: boolean;
  mediaGroupSynced?: boolean;
  error?: string;
}
