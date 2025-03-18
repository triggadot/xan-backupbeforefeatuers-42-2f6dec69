
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, ArrowLeft, ArrowRight, Database } from 'lucide-react';
import { GlMapping } from '@/types/glsync';
import SyncProductsButton from './SyncProductsButton';

interface MappingDetailsCardProps {
  mapping: GlMapping;
  connectionName: string;
  onSyncComplete?: () => void;
}

const MappingDetailsCard: React.FC<MappingDetailsCardProps> = ({ 
  mapping, 
  connectionName,
  onSyncComplete 
}) => {
  // Helper function to get the sync direction icon
  const getSyncDirectionIcon = () => {
    switch (mapping.sync_direction) {
      case 'to_supabase':
        return <ArrowRight className="h-5 w-5" />;
      case 'to_glide':
        return <ArrowLeft className="h-5 w-5" />;
      case 'both':
        return <ArrowLeftRight className="h-5 w-5" />;
      default:
        return null;
    }
  };

  // Helper function to get the sync direction text
  const getSyncDirectionText = () => {
    switch (mapping.sync_direction) {
      case 'to_supabase':
        return 'Glide → Supabase';
      case 'to_glide':
        return 'Supabase → Glide';
      case 'both':
        return 'Bidirectional';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {mapping.glide_table_display_name || mapping.glide_table}
            </CardTitle>
            <CardDescription>{connectionName}</CardDescription>
          </div>
          {mapping.enabled ? (
            <Badge className="bg-green-500">Enabled</Badge>
          ) : (
            <Badge variant="outline">Disabled</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Glide Table</h4>
              <p className="text-sm text-gray-500">{mapping.glide_table}</p>
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
              <p className="text-sm text-gray-500 ml-2">{getSyncDirectionText()}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Column Mappings</h4>
            <p className="text-sm text-gray-500">
              {Object.keys(mapping.column_mappings).length} columns mapped
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <SyncProductsButton 
          mapping={mapping} 
          onSyncComplete={onSyncComplete}
        />
      </CardFooter>
    </Card>
  );
};

export default MappingDetailsCard;
