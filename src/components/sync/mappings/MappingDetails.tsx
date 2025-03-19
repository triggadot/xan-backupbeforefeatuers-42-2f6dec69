import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, CheckCircle, AlertTriangle, Play, Repeat, Eye, Edit, PlusCircle, Database } from 'lucide-react';
import { GlConnection, GlMapping, GlColumnMapping, GlideTable } from '@/types/glsync';
import { glSyncApi } from '@/services/glsync';
import { useTableData } from '@/hooks/useTableData';
import { useGlSync } from '@/hooks/useGlSync';
import { useGlSyncValidation } from '@/hooks/useGlSyncValidation';
import { useGlSyncStatus } from '@/hooks/useGlSyncStatus';
import { MappingValidationResult } from '@/types/glsync';
import { SyncLogsView } from '@/components/sync/SyncLogs';
import { GlideTableSelector } from '@/components/sync/GlideTableSelector';
import { CreateTableDialog } from '@/components/sync/mappings/CreateTableDialog';
import { EditTableDialog } from '@/components/sync/mappings/EditTableDialog';

interface MappingDetailsProps {
  mappingId: string;
  onBack: () => void;
}

const MappingDetails: React.FC<MappingDetailsProps> = ({ mappingId, onBack }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: connections, isLoading: isConnectionsLoading } = useTableData<GlConnection>('gl_connections');
  const { syncData, retryFailedSync, isSyncing, isRetrying, error: syncError } = useGlSync();
  const { validateMappingConfig, validating, validation } = useGlSyncValidation();
  const syncLogs = useGlSyncStatus(mappingId);

  const [mapping, setMapping] = useState<GlMapping | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSchemaDialogOpen, setIsSchemaDialogOpen] = useState(false);
  const [isEditTableDialogOpen, setIsEditTableDialogOpen] = useState(false);
  const [isNewTableDialogOpen, setIsNewTableDialogOpen] = useState(false);
  const [availableTables, setAvailableTables] = useState<GlideTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<GlideTable | null>(null);
  const [isTableListLoading, setIsTableListLoading] = useState(false);
  const [isColumnListLoading, setIsColumnListLoading] = useState(false);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, GlColumnMapping>>({});
  const [isMappingEnabled, setIsMappingEnabled] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchMapping = async () => {
      const { success, mapping: fetchedMapping } = await glSyncApi.getMappingById(mappingId);
      if (success && fetchedMapping) {
        setMapping(fetchedMapping);
        setIsMappingEnabled(fetchedMapping.enabled);
        setColumnMappings(fetchedMapping.column_mappings);
        setNotes(fetchedMapping.notes || '');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load mapping',
          variant: 'destructive',
        });
      }
    };

    fetchMapping();
  }, [mappingId, toast]);

  useEffect(() => {
    const fetchAvailableTables = async () => {
      if (!mapping?.connection_id) return;
      
      setIsTableListLoading(true);
      try {
        const { success, tables } = await glSyncApi.listGlideTables(mapping.connection_id);
        if (success && tables) {
          setAvailableTables(tables);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load tables',
            variant: 'destructive',
          });
        }
      } finally {
        setIsTableListLoading(false);
      }
    };

    if (mapping?.connection_id) {
      fetchAvailableTables();
    }
  }, [mapping?.connection_id, toast]);

  useEffect(() => {
    const fetchAvailableColumns = async () => {
      if (!mapping?.connection_id || !mapping?.glide_table) return;
      
      setIsColumnListLoading(true);
      try {
        const { success, columns } = await glSyncApi.getGlideTableColumns(mapping.connection_id, mapping.glide_table);
        if (success && columns) {
          setAvailableColumns(columns);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load columns',
            variant: 'destructive',
          });
        }
      } finally {
        setIsColumnListLoading(false);
      }
    };

    if (mapping?.connection_id && mapping?.glide_table) {
      fetchAvailableColumns();
    }
  }, [mapping?.connection_id, mapping?.glide_table, toast]);

  const handleTableChange = (tableId: string, displayName?: string) => {
    setMapping(prev => ({ ...prev, glide_table: tableId, glide_table_display_name: displayName }));
  };

  const handleColumnMappingChange = (columnName: string, mapping: GlColumnMapping) => {
    setColumnMappings(prev => ({ ...prev, [columnName]: mapping }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      if (!mapping) throw new Error('No mapping loaded');

      const updatedMapping = {
        ...mapping,
        enabled: isMappingEnabled,
        column_mappings: columnMappings,
        notes: notes,
      };

      const { success } = await glSyncApi.updateMapping(mappingId, updatedMapping);

      if (success) {
        toast({
          title: 'Success',
          description: 'Mapping updated successfully',
        });
        setMapping(updatedMapping);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update mapping',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating mapping:', error);
      toast({
        title: 'Error',
        description: 'Failed to update mapping',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    if (!mapping) return;
    await syncData(mapping.connection_id, mappingId);
  };

  const handleRetry = async () => {
    if (!mapping) return;
    await retryFailedSync(mapping.connection_id, mappingId);
  };

  const handleValidate = async () => {
    await validateMappingConfig(mappingId);
  };

  const handleNewTable = (table: GlideTable) => {
    setSelectedTable(table);
    setIsNewTableDialogOpen(true);
  };

  if (!mapping) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">{mapping.glide_table_display_name || mapping.glide_table}</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleValidate}
            disabled={validating}
          >
            {validating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Validate
              </>
            )}
          </Button>
          <Button
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={handleRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <Repeat className="h-4 w-4 mr-2" />
                Retry Failed
              </>
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {syncError && (
        <div className="mb-4">
          <p className="text-red-500">Sync Error: {syncError}</p>
        </div>
      )}

      {validation && (
        <div className="mb-4">
          {validation.isValid ? (
            <div className="flex items-center text-green-500">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mapping is valid
            </div>
          ) : (
            <div className="flex items-center text-red-500">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Mapping is invalid: {validation.message}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mapping Details</CardTitle>
            <CardDescription>Configure the mapping settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="connection">Connection</Label>
              <Select
                value={mapping.connection_id}
                onValueChange={(value) => setMapping(prev => ({ ...prev, connection_id: value }))}
                disabled={isConnectionsLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a connection" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((connection) => (
                    <SelectItem key={connection.id} value={connection.id}>
                      {connection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="glideTable">Glide Table</Label>
              <div className="flex items-center space-x-2">
                <GlideTableSelector
                  value={mapping.glide_table}
                  onTableChange={handleTableChange}
                  onAddTable={handleNewTable}
                  disabled={isTableListLoading}
                  isLoading={isTableListLoading}
                  tables={availableTables}
                />
                {mapping.glide_table && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsEditTableDialogOpen(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="supabaseTable">Supabase Table</Label>
              <Input
                id="supabaseTable"
                value={mapping.supabase_table}
                onChange={(e) => setMapping(prev => ({ ...prev, supabase_table: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="syncDirection">Sync Direction</Label>
              <Select
                value={mapping.sync_direction}
                onValueChange={(value) => setMapping(prev => ({ ...prev, sync_direction: value as "to_supabase" | "to_glide" | "both" }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to_supabase">To Supabase</SelectItem>
                  <SelectItem value="to_glide">To Glide</SelectItem>
                  <SelectItem value="both">Both Directions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="enabled">Enabled</Label>
              <Switch
                id="enabled"
                checked={isMappingEnabled}
                onCheckedChange={(checked) => setIsMappingEnabled(checked)}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this mapping"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Column Mappings</CardTitle>
            <CardDescription>Map Glide columns to Supabase columns.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableColumns.map((column) => (
              <div key={column} className="grid grid-cols-2 gap-2">
                <Label htmlFor={column}>{column}</Label>
                <Input
                  id={column}
                  value={columnMappings[column]?.supabase_column_name || ''}
                  onChange={(e) => {
                    handleColumnMappingChange(column, {
                      glide_column_name: column,
                      supabase_column_name: e.target.value,
                      data_type: 'text', // You might want to make this configurable
                    });
                  }}
                />
              </div>
            ))}
            {availableColumns.length === 0 && !isColumnListLoading && (
              <div className="text-muted-foreground">No columns available.</div>
            )}
            {isColumnListLoading && (
              <div className="flex justify-center items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading columns...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Sync Logs</CardTitle>
            <CardDescription>View recent sync logs for this mapping.</CardDescription>
          </CardHeader>
          <CardContent>
            <SyncLogsView logs={syncLogs.data} isLoading={syncLogs.isLoading} />
          </CardContent>
        </Card>
      </div>

      <CreateTableDialog
        open={isNewTableDialogOpen}
        onOpenChange={setIsNewTableDialogOpen}
        onTableCreated={(tableName) => {
          toast({
            title: 'Success',
            description: `Table ${tableName} created successfully`,
          });
          
          // Refresh tables
          glSyncApi.listGlideTables(mapping.connection_id)
            .then(({ success, tables }) => {
              if (success && tables) {
                setAvailableTables(tables);
              }
            });
          
          // Set the new table to the mapping
          setMapping(prev => ({ ...prev, glide_table: tableName }));
        }}
      />

      <EditTableDialog
        tableName={mapping.glide_table}
        open={isEditTableDialogOpen}
        onOpenChange={setIsEditTableDialogOpen}
        onSuccess={() => {
          toast({
            title: 'Success',
            description: `Table ${mapping.glide_table} updated successfully`,
          });
        }}
      />
    </div>
  );
};

export default MappingDetails;
