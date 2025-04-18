import type { Message } from '@/types/message-types';
import { Card, CardContent } from '@/components/ui/card';
import { formatFileSize, getMediaType } from '@/utils/mediaUtils';

interface PublicMediaCardProps {
  message: Message;
}

export function PublicMediaCard({ message }: PublicMediaCardProps) {
  const mediaType = getMediaType(message.mimeType);
  return (
    <Card className="overflow-hidden shadow-md">
      <CardContent className="p-0">
        {mediaType === 'image' && message.publicUrl && (
          <img
            src={message.publicUrl}
            alt={message.caption ?? 'Image'}
            className="w-full h-64 object-cover"
            loading="lazy"
          />
        )}
        {mediaType === 'video' && message.publicUrl && (
          <video
            src={message.publicUrl}
            controls
            className="w-full h-64 object-cover"
          />
        )}
      </CardContent>
      <div className="p-4">
        <div className="font-semibold truncate mb-1">{message.caption ?? 'Untitled'}</div>
        <div className="text-xs text-gray-500">
          {message.fileSize && formatFileSize(Number(message.fileSize))}
        </div>
      </div>
    </Card>
  );
}
