
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MappingDetails } from '@/components/sync/mappings/MappingDetails';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GlMapping } from '@/types/glide-sync/glsync';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

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
      // Explicit type casting to ensure it conforms to GlMapping
      return data as unknown as GlMapping;
    },
  });

  const handleBack = () => {
    navigate('/sync/mappings');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-9 w-32" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !id) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="py-8 text-center">
            <h3 className="text-lg font-medium mb-4">Error Loading Mapping</h3>
            <p className="text-muted-foreground mb-6">
              {error instanceof Error ? error.message : 'Invalid mapping ID'}
            </p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Mappings
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <MappingDetails mapping={mapping} mappingId={id} onBack={handleBack} />
    </motion.div>
  );
}
