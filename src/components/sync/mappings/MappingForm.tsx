import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/utils/use-toast';
import { GlMapping } from '@/types/glide-sync/glsync';
import React, { useState } from 'react';
import { SyncDirectionSelect } from './SyncDirectionSelect';
import { SupabaseTableSelect } from './SupabaseTableSelect';
import GlideTableSelector from '../GlideTableSelector';
import { ConnectionSelect } from './ConnectionSelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useConnections } from '@/hooks/connections/useConnections';
import { useGlSync } from '@/hooks/gl-sync';
import { Loader2 } from 'lucide-react';
import { ColumnMappingEditor } from '@/components/sync/ColumnMappingEditor';
import { glSyncService } from '@/services/glsync';

interface MappingFormProps {
  mapping?: GlMapping;
  onCancel: () => void;
  onSuccess?: (mapping: GlMapping) => Promise<void>;
}

export const MappingForm: React.FC<MappingFormProps> = ({ mapping: initialMapping, onCancel, onSuccess }) => {
  const [mapping, setMapping] = useState<GlMapping>(
    initialMapping || {
      id: '',
      connection_id: '',
      supabase_table: '',
      glide_table: '',
      sync_direction: 'to_supabase',
      column_mappings: {},
      enabled: true,
      glide_table_display_name: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { connections, isLoading: isLoadingConnections } = useConnections();
  const { syncData, testConnection } = useGlSync();
  const [tables, setTables] = useState<any[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMapping(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setMapping(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (mapping.id) {
        // Update existing mapping
        const result = await glSyncService.updateMapping(mapping.id, mapping);
        if (result) {
          toast({
            title: 'Mapping Updated',
            description: 'Mapping has been updated successfully.'
          });
          if (onSuccess) await onSuccess(result);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to update mapping.',
            variant: 'destructive'
          });
        }
      } else {
        // Create new mapping
        const result = await glSyncService.createMapping(mapping);
        if (result) {
          toast({
            title: 'Mapping Created',
            description: 'New mapping has been created successfully.'
          });
          if (onSuccess) await onSuccess(result);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to create mapping.',
            variant: 'destructive'
          });
        }
      }
      onCancel();
    } catch (error) {
      console.error('Error during mapping operation:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loadSupabaseTables = async () => {
    setIsLoadingTables(true);
    try {
      const tablesList = await glSyncService.getSupabaseTables();
      setTables(tablesList);
    } catch (error) {
      console.error("Error loading tables:", error);
    } finally {
      setIsLoadingTables(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{initialMapping ? 'Edit Mapping' : 'Create Mapping'}</DialogTitle>
      </DialogHeader>
      <Card className="border-none shadow-none">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="glide_table_display_name">Mapping Name</Label>
                <Input
                  id="glide_table_display_name"
                  name="glide_table_display_name"
                  value={mapping.glide_table_display_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Products Sync"
                  required
                />
              </div>
              <ConnectionSelect
                connections={connections}
                value={mapping.connection_id}
                onValueChange={(value) => handleSelectChange('connection_id', value)}
                isLoading={isLoadingConnections}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlideTableSelector
                tables={[]}
                value={mapping.glide_table}
                onTableChange={(tableId, displayName) => {
                  setMapping(prev => ({
                    ...prev,
                    glide_table: tableId,
                    glide_table_display_name: displayName
                  }));
                }}
              />
              <SupabaseTableSelect
                tables={tables}
                isLoading={isLoadingTables}
                value={mapping.supabase_table}
                onValueChange={(value) => handleSelectChange('supabase_table', value)}
                onOpen={loadSupabaseTables}
              />
            </div>
            <div>
              <SyncDirectionSelect
                value={mapping.sync_direction}
                onValueChange={(value) => handleSelectChange('sync_direction', value)}
              />
            </div>
            <div>
              <ColumnMappingEditor
                mapping={mapping}
                onUpdate={(updatedMapping) => setMapping(updatedMapping)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Mapping'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DialogContent>
  );
}
