// --- Frontend Message type for UI components ---
export interface Message {
  id: string;
  telegramMessageId?: string;
  chatId?: string;
  chatType?: string;
  chatTitle?: string;
  mediaGroupId?: string;
  messageCaptionId?: string;
  isOriginalCaption?: boolean;
  groupCaptionSynced?: boolean;
  caption?: string;
  fileId?: string;
  fileUniqueId?: string;
  publicUrl?: string;
  mimeType?: string;
  fileSize?: string;
  isEdited?: boolean;
  editDate?: string;
  processingState: string;
  processingStartedAt?: string;
  processingCompletedAt?: string;
  analyzedContent?: any;
  // ...repeat for all columns
}
