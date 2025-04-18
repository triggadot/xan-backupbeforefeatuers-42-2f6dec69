// Pure stateless helpers for media-related logic
import type { Message } from '../types/Message';

export function calculateAspectRatio(width?: number | null, height?: number | null): number | null {
  if (!width || !height || width === 0 || height === 0) return null;
  return width / height;
}

export function formatFileSize(bytes?: number | null, decimals: number = 2): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

export function getMediaType(mimeType?: string | null): 'image' | 'video' | 'audio' | 'document' | 'unknown' {
  if (!mimeType) return 'unknown';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('spreadsheet') || mimeType.includes('presentation')) {
    return 'document';
  }
  return 'unknown';
}

export function isVideoMessage(message: Message): boolean {
  return !!(
    message.mime_type?.startsWith('video/') ||
    (message.public_url &&
      (message.public_url.endsWith('.mp4') ||
        message.public_url.endsWith('.mov') ||
        message.public_url.endsWith('.webm') ||
        message.public_url.endsWith('.avi')))
  );
}
