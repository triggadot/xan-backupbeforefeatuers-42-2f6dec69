/**
 * Supabase DB types and conversion utilities for the messages table.
 * AUTO-GENERATED: Do not edit manually.
 */

export interface GlMessagesRecord {
  id: string;
  telegram_message_id: string | null;
  chat_id: string | null;
  chat_type: string | null;
  chat_title: string | null;
  media_group_id: string | null;
  message_caption_id: string | null;
  is_original_caption: boolean | null;
  group_caption_synced: boolean | null;
  caption: string | null;
  file_id: string | null;
  file_unique_id: string | null;
  public_url: string | null;
  mime_type: string | null;
  file_size: string | null;
  is_edited: boolean | null;
  edit_date: string | null;
  processing_state: string;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  analyzed_content: any | null;
  // ...add remaining columns as needed
}

export type GlMessagesInsert = Partial<Omit<GlMessagesRecord, 'id'>>;
export type GlMessagesUpdate = Partial<GlMessagesRecord>;

// Conversion utility: DB → frontend
import type { Message } from '../../types/message-types';

/**
 * Converts a GlMessagesRecord (DB) to a frontend Message type.
 * All nulls become undefined, all snake_case becomes camelCase.
 * @param record GlMessagesRecord from Supabase
 * @returns Message (camelCase, no nulls)
 */
import type { Message } from '../../types/message-types';

export function convertDbToFrontend(record: GlMessagesRecord): Message {
  return {
    id: record.id,
    telegramMessageId: record.telegram_message_id ?? undefined,
    chatId: record.chat_id ?? undefined,
    chatType: record.chat_type ?? undefined,
    chatTitle: record.chat_title ?? undefined,
    mediaGroupId: record.media_group_id ?? undefined,
    messageCaptionId: record.message_caption_id ?? undefined,
    isOriginalCaption: record.is_original_caption ?? undefined,
    groupCaptionSynced: record.group_caption_synced ?? undefined,
    caption: record.caption ?? undefined,
    fileId: record.file_id ?? undefined,
    fileUniqueId: record.file_unique_id ?? undefined,
    publicUrl: record.public_url ?? undefined,
    mimeType: record.mime_type ?? undefined,
    fileSize: record.file_size ?? undefined,
    isEdited: record.is_edited ?? undefined,
    editDate: record.edit_date ?? undefined,
    processingState: record.processing_state,
    processingStartedAt: record.processing_started_at ?? undefined,
    processingCompletedAt: record.processing_completed_at ?? undefined,
    analyzedContent: record.analyzed_content ?? undefined,
    telegramData: record.telegram_data ?? undefined,
    errorMessage: record.error_message ?? undefined,
    errorCode: record.error_code ?? undefined,
    storageExists: record.storage_exists ?? undefined,
    storagePath: record.storage_path ?? undefined,
    storageMetadata: record.storage_metadata ?? undefined,
    mimeTypeVerified: record.mime_type_verified ?? undefined,
    mimeTypeOriginal: record.mime_type_original ?? undefined,
    contentDisposition: record.content_disposition ?? undefined,
    storagePathStandardized: record.storage_path_standardized ?? undefined,
    duration: record.duration ?? undefined,
    width: record.width ?? undefined,
    height: record.height ?? undefined,
    userId: record.user_id ?? undefined,
    messageUrl: record.message_url ?? undefined,
    purchaseOrder: record.purchase_order ?? undefined,
    glideRowId: record.glide_row_id ?? undefined,
    createdAt: record.created_at ?? undefined,
    updatedAt: record.updated_at ?? undefined,
    deletedFromTelegram: record.deleted_from_telegram ?? undefined,
    isForward: record.is_forward ?? undefined,
    forwardCount: record.forward_count ?? undefined,
    originalMessageId: record.original_message_id ?? undefined,
    forwardFrom: record.forward_from ?? undefined,
    forwardFromChat: record.forward_from_chat ?? undefined,
    forwardChain: record.forward_chain ?? undefined,
    oldAnalyzedContent: record.old_analyzed_content ?? undefined,
    needsRedownload: record.needs_redownload ?? undefined,
    redownloadReason: record.redownload_reason ?? undefined,
    redownloadFlaggedAt: record.redownload_flagged_at ?? undefined,
    redownloadCompletedAt: record.redownload_completed_at ?? undefined,
    fileIdExpiresAt: record.file_id_expires_at ?? undefined,
    telegramDate: record.telegram_date ?? undefined,
    isBot: record.is_bot ?? undefined,
    messageType: record.message_type ?? undefined,
    fromId: record.from_id ?? undefined,
    isDuplicate: record.is_duplicate ?? undefined,
    duplicateReferenceId: record.duplicate_reference_id ?? undefined,
    redownloadAttempts: record.redownload_attempts ?? undefined,
    correlationId: record.correlation_id ?? undefined,
    retryCount: record.retry_count ?? undefined,
    lastErrorAt: record.last_error_at ?? undefined,
    editCount: record.edit_count ?? undefined,
    forwardInfo: record.forward_info ?? undefined,
    editHistory: record.edit_history ?? undefined,
    isEdit: record.is_edit ?? undefined,
    triggerSource: record.trigger_source ?? undefined,
    text: record.text ?? undefined,
    mediaType: record.media_type ?? undefined,
    extension: record.extension ?? undefined,
    messageData: record.message_data ?? undefined,
    processingError: record.processing_error ?? undefined,
    captionData: record.caption_data ?? undefined,
    messageDate: record.message_date ?? undefined,
    lastSyncedAt: record.last_synced_at ?? undefined,
    purchaseOrderUid: record.purchase_order_uid ?? undefined,
    oldNotes: record.old_notes ?? undefined,
    productSku: record.product_sku ?? undefined,
    productMatchStatus: record.product_match_status ?? undefined,
    productMatchDate: record.product_match_date ?? undefined,
    productMatchConfidence: record.product_match_confidence ?? undefined,
    matchType: record.match_type ?? undefined,
    syncSource: record.sync_source ?? undefined,
    rawContent: record.raw_content ?? undefined,
    productId: record.product_id ?? undefined,
  };
}
