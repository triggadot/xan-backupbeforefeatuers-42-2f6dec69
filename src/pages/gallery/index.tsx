import { useQuery } from '@tanstack/react-query';
import { getPublicMedia } from '@/features/public-media-gallery/api';
import { PublicMediaGalleryGrid } from '@/features/public-media-gallery';
import { Skeleton } from '@/components/ui/skeleton';

export default function PublicMediaGallery() {
  const { data, isLoading, error } = useQuery(['public-media'], getPublicMedia);

  if (isLoading) return <Skeleton className="w-full h-96" />;
  if (error) return <div className="text-red-500">Error loading media gallery.</div>;
  if (!data || data.length === 0) return <div className="text-muted-foreground">No public media found.</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Public Media Gallery</h1>
      <PublicMediaGalleryGrid media={data} />
    </div>
  );
}
