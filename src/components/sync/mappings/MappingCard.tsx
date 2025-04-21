import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlMapping } from '@/types/glsync';
import { 
  Edit, 
  ToggleLeft, 
  ToggleRight, 
  Box, 
  ArrowRight, 
  ArrowLeft, 
  ArrowRightLeft,
  Layers
} from 'lucide-react';

interface MappingCardProps {
  mapping: GlMapping;
  connectionName: string;
  onEdit: (mapping: GlMapping) => void;
  onDelete: (id: string) => void;
  onToggle: (mapping: GlMapping) => void;
}

const MappingCard = ({
  mapping,
  connectionName,
  onEdit,
  onDelete,
  onToggle
}: MappingCardProps) => {
  // Helper function to get sync direction icon
  const getSyncDirectionIcon = (direction: string) => {
    switch (direction) {
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

  // Helper function to count column mappings
  const countColumnMappings = (columnMappings: Record<string, any>) => {
    return Object.keys(columnMappings).length;
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-medium">
              {connectionName}
            </h3>
            {mapping.enabled ? (
              <Badge className="bg-green-500">Enabled</Badge>
            ) : (
              <Badge variant="outline">Disabled</Badge>
            )}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <span>{mapping.glide_table_display_name || mapping.glide_table}</span>
            <span className="mx-2">
              {getSyncDirectionIcon(mapping.sync_direction)}
            </span>
            <span>{mapping.supabase_table}</span>
          </div>
          
          <div className="flex items-center mt-2 text-sm text-muted-foreground">
            <Layers className="h-4 w-4 mr-1" />
            <span>{countColumnMappings(mapping.column_mappings)} column mappings</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onToggle(mapping)}
          >
            {mapping.enabled ? (
              <>
                <ToggleRight className="h-4 w-4 mr-2" />
                Disable
              </>
            ) : (
              <>
                <ToggleLeft className="h-4 w-4 mr-2" />
                Enable
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(mapping)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MappingCard;
