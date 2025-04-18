import type { Message } from '@/types/message-types';
import { PublicMediaCard } from './PublicMediaCard';

interface PublicMediaGalleryGridProps {
  media: Message[];
}

export function PublicMediaGalleryGrid({ media }: PublicMediaGalleryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {media.map(item => (
        <PublicMediaCard key={item.id} message={item} />
      ))}
    </div>
  );
}
