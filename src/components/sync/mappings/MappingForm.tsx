import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GlMapping } from '@/types/glsync';
import React, { useState } from 'react';
import { SyncDirectionSelect } from './SyncDirectionSelect';
import { SupabaseTableSelect } from './SupabaseTableSelect';
import { GlideTableSelector } from '../GlideTableSelector';
import { ConnectionSelect } from './ConnectionSelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useConnections } from '@/hooks/useConnections';
import { useGlSync } from '@/hooks/useGlSync';
import { glSyncApi } from '@/services/glSyncApi';
import { Loader2 } from 'lucide-react';
import { ColumnMappingEditor } from '@/components/sync/ColumnMappingEditor';

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
      sync_direction: 'supabase_to_glide',
      column_mappings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_interval: 3600,
      is_active: true,
      name: ''
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { connections, isLoading: isLoadingConnections } = useConnections();
  const { createMapping, updateMapping } = useGlSync();

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
        const updated = await updateMapping(mapping.id, mapping);
        if (updated) {
          toast({
            title: 'Mapping Updated',
            description: 'Mapping has been updated successfully.'
          });
          onSuccess?.(updated);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to update mapping.',
            variant: 'destructive'
          });
        }
      } else {
        const created = await createMapping(mapping);
        if (created) {
          toast({
            title: 'Mapping Created',
            description: 'New mapping has been created successfully.'
          });
          onSuccess?.(created);
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
                <Label htmlFor="name">Mapping Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={mapping.name}
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
                connectionId={mapping.connection_id}
                value={mapping.glide_table}
                onValueChange={(value) => handleSelectChange('glide_table', value)}
              />
              <SupabaseTableSelect
                value={mapping.supabase_table}
                onValueChange={(value) => handleSelectChange('supabase_table', value)}
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
                mappingId={mapping.id}
                onUpdate={() => {}}
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
};
