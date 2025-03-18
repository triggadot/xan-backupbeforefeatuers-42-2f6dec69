
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, ArrowRight, ArrowLeft, ArrowRightLeft } from 'lucide-react';
import { GlMapping } from '@/types/glsync';
import { SyncContainer } from './SyncContainer';

interface ProductSyncPanelProps {
  mapping: GlMapping;
  onSyncComplete?: () => void;
}

const ProductSyncPanel: React.FC<ProductSyncPanelProps> = ({ mapping, onSyncComplete }) => {
  const getSyncDirectionIcon = () => {
    switch (mapping.sync_direction) {
      case 'to_supabase':
        return <ArrowRight className="h-5 w-5" />;
      case 'to_glide':
        return <ArrowLeft className="h-5 w-5" />;
      case 'both':
        return <ArrowRightLeft className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Products Sync
        </CardTitle>
        <CardDescription>
          Synchronize products between Glide and Supabase with additional validation
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Glide Table</h4>
              <p className="text-sm text-gray-500">{mapping.glide_table_display_name || mapping.glide_table}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Supabase Table</h4>
              <p className="text-sm text-gray-500">{mapping.supabase_table}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Sync Direction</h4>
            <div className="flex items-center">
              {getSyncDirectionIcon()}
              <p className="text-sm text-gray-500 ml-2">
                {mapping.sync_direction === 'to_supabase' ? 'Glide to Supabase' :
                 mapping.sync_direction === 'to_glide' ? 'Supabase to Glide' : 
                 'Bidirectional'}
              </p>
            </div>
          </div>
          
          <SyncContainer mapping={mapping} onSyncComplete={onSyncComplete} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductSyncPanel;
