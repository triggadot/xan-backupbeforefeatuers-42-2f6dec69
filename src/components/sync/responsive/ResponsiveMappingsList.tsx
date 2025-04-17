import React from 'react';
import { MappingsList } from '@/components/sync/mappings/MappingsList';
import { GlMapping } from '@/types/glide-sync/glsync';
import { useIsMobile } from '@/hooks/utils/use-mobile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ResponsiveMappingsListProps {
  onEdit: (mapping: GlMapping) => void;
}

const ResponsiveMappingsList: React.FC<ResponsiveMappingsListProps> = ({ onEdit }) => {
  const isMobile = useIsMobile();
  
  return (
    <ScrollAnimation type="slide-up" className="w-full" duration={0.4}>
      <Card className="shadow-sm border">
        <CardHeader className={isMobile ? 'px-4 py-4' : 'px-6 py-5'}>
          <CardTitle className={isMobile ? 'text-lg' : 'text-xl'}>Table Mappings</CardTitle>
          <CardDescription>
            Configure how data syncs between Glide and Supabase tables
          </CardDescription>
        </CardHeader>
        <CardContent className={isMobile ? 'px-4 pb-4' : 'px-6 pb-6'}>
          <MappingsList onEdit={onEdit} />
        </CardContent>
      </Card>
    </ScrollAnimation>
  );
};

export default ResponsiveMappingsList;
