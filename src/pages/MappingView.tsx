
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MappingDetails } from '@/components/sync/mappings/MappingDetails';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GlMapping } from '@/types/glsync';

export default function MappingView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: mapping, isLoading, error } = useQuery({
    queryKey: ['mapping', id],
    queryFn: async () => {
      if (!id) throw new Error('Mapping ID is required');

      const { data, error } = await supabase
        .from('gl_mappings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as GlMapping;
    },
  });

  const handleBack = () => {
    navigate('/sync');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !id) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <h3 className="text-lg font-medium">Error Loading Mapping</h3>
          <p className="text-muted-foreground mt-2">
            {error instanceof Error ? error.message : 'Invalid mapping ID'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return <MappingDetails mapping={mapping} mappingId={id} onBack={handleBack} />;
}
