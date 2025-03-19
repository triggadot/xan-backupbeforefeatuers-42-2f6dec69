import { useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { GlConnection, GlMapping, GlideTable } from '@/types/glsync';
import { GlideTableSelector } from '@/components/sync/GlideTableSelector';
import ColumnMappingEditor from '../ColumnMappingEditor';
import { ArrowRight, ArrowLeft, ArrowRightLeft } from 'lucide-react';

interface MappingFormProps {
  mapping: Partial<GlMapping>;
  isEditing: boolean;
  connections: GlConnection[];
  glideTables: GlideTable[];
  supabaseTables: string[];
  isLoadingTables: boolean;
  selectedConnection: string;
  activeTab: string;
  availableGlideColumns: Array<{ id: string; name: string; type?: string }>;
  onConnectionChange: (connectionId: string) => void;
  onGlideTableChange: (tableId: string, displayName: string) => void;
  onSupabaseTableChange: (tableName: string) => void;
  onSyncDirectionChange: (direction: 'to_supabase' | 'to_glide' | 'both') => void;
  onEnabledChange: (enabled: boolean) => void;
  onColumnMappingsChange: (updatedMapping: {column_mappings: Record<string, any>}) => void;
  onAddGlideTable: (table: GlideTable) => void;
  onTabChange: (tab: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const MappingForm = ({
  mapping,
  isEditing,
  connections,
  glideTables,
  supabaseTables,
  isLoadingTables,
  selectedConnection,
  activeTab,
  availableGlideColumns,
  onConnectionChange,
  onGlideTableChange,
  onSupabaseTableChange,
  onSyncDirectionChange,
  onEnabledChange,
  onColumnMappingsChange,
  onAddGlideTable,
  onTabChange,
  onSubmit,
  onCancel
}: MappingFormProps) => {
  return (
    <>
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger 
            value="column-mappings"
            disabled={!mapping.supabase_table}
          >
            Column Mappings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="py-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="connection">Connection <span className="text-red-500">*</span></Label>
              <Select
                value={mapping.connection_id || ''}
                onValueChange={onConnectionChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a connection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Connections</SelectLabel>
                    {connections.map((connection) => (
                      <SelectItem key={connection.id} value={connection.id}>
                        {connection.app_name || 'Unnamed App'}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="glide_table">Glide Table <span className="text-red-500">*</span></Label>
              <GlideTableSelector
                tables={glideTables}
                value={mapping.glide_table || ''}
                onTableChange={onGlideTableChange}
                onAddTable={onAddGlideTable}
                disabled={isLoadingTables || !selectedConnection}
                isLoading={isLoadingTables}
                placeholder={isLoadingTables ? 'Loading...' : 'Select a Glide table'}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="supabase_table">Supabase Table <span className="text-red-500">*</span></Label>
              <Select
                value={mapping.supabase_table || ''}
                onValueChange={onSupabaseTableChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a Supabase table" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Supabase Tables</SelectLabel>
                    {supabaseTables.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="sync_direction">Sync Direction</Label>
              <Select
                value={mapping.sync_direction || 'to_supabase'}
                onValueChange={(value: 'to_supabase' | 'to_glide' | 'both') => onSyncDirectionChange(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to_supabase">
                    <div className="flex items-center">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Glide to Supabase
                    </div>
                  </SelectItem>
                  <SelectItem value="to_glide">
                    <div className="flex items-center">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Supabase to Glide
                    </div>
                  </SelectItem>
                  <SelectItem value="both">
                    <div className="flex items-center">
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Bidirectional
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">Enabled</Label>
              <Switch
                id="enabled"
                checked={mapping.enabled ?? true}
                onCheckedChange={onEnabledChange}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="column-mappings" className="py-4">
          <ColumnMappingEditor 
            mapping={{ 
              supabase_table: mapping.supabase_table || '',
              column_mappings: mapping.column_mappings || {}
            }}
            onUpdate={onColumnMappingsChange}
          />
        </TabsContent>
      </Tabs>
      
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {isEditing ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </>
  );
};

export default MappingForm;
