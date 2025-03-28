import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseTables } from '@/hooks/useSupabaseTables';
import { glSyncApi } from '@/services/glSyncApi';
import { GlMapping } from '@/types/glsync';
import { ColumnMappingEditor } from '@/components/sync/ColumnMappingEditor';

interface SchemaSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMappingCreated: (mapping: any) => void;
  connectionId: string;
  glideTable: string;
}

export const SchemaSetupDialog: React.FC<SchemaSetupDialogProps> = ({
  open,
  onOpenChange,
  onMappingCreated,
  connectionId,
  glideTable
}) => {
  const [tableName, setTableName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentMapping, setCurrentMapping] = useState<GlMapping | null>(null);
  const { toast } = useToast();
  const { tables, fetchTables } = useSupabaseTables();
  const [isExistingTable, setIsExistingTable] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleTableNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTableName(e.target.value);
  };

  const handleTableSelectChange = (value: string) => {
    setSelectedTable(value);
  };

  const handleMappingUpdate = (updatedMapping: GlMapping) => {
    setCurrentMapping(updatedMapping);
  };

  const handleCreateMapping = async () => {
    setIsLoading(true);
    try {
      if (!tableName && !isExistingTable) {
        toast({
          title: 'Error',
          description: 'Table name is required.',
          variant: 'destructive',
        });
        return;
      }

      const supabaseTable = isExistingTable ? selectedTable : tableName;

      const newMapping = {
        connection_id: connectionId,
        glide_table: glideTable,
        supabase_table: supabaseTable,
        sync_direction: 'glide_to_supabase',
        column_mappings: {}
      };

      // Optimistically set the current mapping
      setCurrentMapping(newMapping as GlMapping);

      // Call the onMappingCreated function to handle the mapping creation
      onMappingCreated(newMapping);

      toast({
        title: 'Mapping Created',
        description: `Mapping for table ${tableName} has been created successfully.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating mapping:', error);
      toast({
        title: 'Error',
        description: 'Failed to create mapping.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[80%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schema Setup</DialogTitle>
          <DialogDescription>
            Configure the schema for your new table.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="isExistingTable">Use Existing Table?</Label>
            <Select onValueChange={(value) => setIsExistingTable(value === 'true')}>
              <SelectTrigger id="isExistingTable">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">No, create a new table</SelectItem>
                <SelectItem value="true">Yes, use an existing table</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isExistingTable ? (
            <div className="space-y-2">
              <Label htmlFor="tableName">Table Name</Label>
              <Input
                id="tableName"
                value={tableName}
                onChange={handleTableNameChange}
                placeholder="Enter table name"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="existingTable">Select Existing Table</Label>
              <Select onValueChange={handleTableSelectChange}>
                <SelectTrigger id="existingTable">
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {currentMapping && (
            <ColumnMappingEditor 
              mappingId={currentMapping.id} 
              onUpdate={(updatedMapping) => handleMappingUpdate(updatedMapping)} 
            />
          )}
        </div>

        <DialogFooter>
          <Button type="submit" onClick={handleCreateMapping} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Mapping'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
