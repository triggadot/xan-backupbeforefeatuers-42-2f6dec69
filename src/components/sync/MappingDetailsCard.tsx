
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { GlMapping } from '@/types/glsync';
import SyncProductsButton from './SyncProductsButton';
import ProductSyncPanel from './ProductSyncPanel';

interface MappingDetailsCardProps {
  mapping: GlMapping;
  connectionName?: string | null;
  onSyncComplete?: () => void;
}

const MappingDetailsCard: React.FC<MappingDetailsCardProps> = ({ 
  mapping, 
  connectionName,
  onSyncComplete 
}) => {
  const getDirectionBadge = (direction: string) => {
    switch (direction) {
      case 'to_supabase':
        return <Badge>Glide → Supabase</Badge>;
      case 'to_glide':
        return <Badge>Supabase → Glide</Badge>;
      case 'both':
        return <Badge>Bidirectional</Badge>;
      default:
        return <Badge variant="outline">{direction}</Badge>;
    }
  };

  const columnCount = Object.keys(mapping.column_mappings).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Mapping Details</CardTitle>
            <CardDescription>{connectionName || 'Glide App'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Status</h3>
                <div className="flex items-center justify-between mt-1">
                  <Label htmlFor="mapping-enabled">Enabled</Label>
                  <Switch 
                    id="mapping-enabled" 
                    checked={mapping.enabled}
                    disabled
                  />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium">Glide Table</h3>
                <p className="text-sm text-gray-500 mt-1">{mapping.glide_table_display_name || mapping.glide_table}</p>
                <p className="text-xs text-gray-400 mt-1">ID: {mapping.glide_table}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Supabase Table</h3>
                <p className="text-sm text-gray-500 mt-1">{mapping.supabase_table}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Direction</h3>
                <div className="mt-1">
                  {getDirectionBadge(mapping.sync_direction)}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Mapped Columns</h3>
                <p className="text-sm text-gray-500 mt-1">{columnCount} columns mapped</p>
              </div>
              
              <Separator />
              
              <div>
                <SyncProductsButton 
                  mapping={mapping}
                  onSyncComplete={onSyncComplete}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="md:col-span-2">
        <ProductSyncPanel
          mapping={mapping}
          onSyncComplete={onSyncComplete}
        />
      </div>
    </div>
  );
};

export default MappingDetailsCard;
