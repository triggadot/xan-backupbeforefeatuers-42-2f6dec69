import React, { useEffect, useState } from 'react';
import { GlColumnMapping } from '@/types/glsync';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { glSyncApi } from '@/services/glsync';
import { PlusCircle, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Create a more specific interface for column mapping only
interface ColumnMappingOnly {
  supabase_table: string;
  column_mappings: Record<string, GlColumnMapping>;
}

interface ColumnMappingEditorProps {
  mapping: ColumnMappingOnly;
  onUpdate: (updatedMapping: ColumnMappingOnly) => void;
}

interface SupabaseColumn {
  column_name: string;
  data_type: string;
}

const dataTypeOptions = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date-time', label: 'Date/Time' },
  { value: 'image-uri', label: 'Image URL' },
  { value: 'email-address', label: 'Email' },
];

// Changed from const to export const to properly export the component
export const ColumnMappingEditor: React.FC<ColumnMappingEditorProps> = ({ mapping, onUpdate }) => {
  const [newGlideColumnId, setNewGlideColumnId] = useState('');
  const [newGlideColumnName, setNewGlideColumnName] = useState('');
  const [newSupabaseColumnName, setNewSupabaseColumnName] = useState('');
  const [newDataType, setNewDataType] = useState<string>('string');
  const [supabaseColumns, setSupabaseColumns] = useState<SupabaseColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasRowIdMapping, setHasRowIdMapping] = useState(false);
  const { toast } = useToast();
  
  // Get the column mappings as an array for easier rendering
  const columnMappings = Object.entries(mapping.column_mappings || {}).map(
    ([glideColumnId, columnMapping]) => ({
      glideColumnId,
      ...columnMapping,
    })
  );

  // Check if there's a $rowID mapping
  useEffect(() => {
    const rowIdMapping = Object.entries(mapping.column_mappings || {}).find(
      ([glideColumnId]) => glideColumnId === '$rowID'
    );
    setHasRowIdMapping(!!rowIdMapping);
  }, [mapping.column_mappings]);

  useEffect(() => {
    async function fetchSupabaseColumns() {
      try {
        setLoading(true);
        const columns = await glSyncApi.getSupabaseTableColumns(mapping.supabase_table);
        setSupabaseColumns(columns);
      } catch (error) {
        console.error('Error fetching Supabase columns:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch Supabase table columns',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    if (mapping.supabase_table) {
      fetchSupabaseColumns();
    }
  }, [mapping.supabase_table]);

  const handleAddColumnMapping = () => {
    if (!newGlideColumnId || !newGlideColumnName || !newSupabaseColumnName) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const updatedMapping = { ...mapping };
    updatedMapping.column_mappings = {
      ...updatedMapping.column_mappings,
      [newGlideColumnId]: {
        glide_column_name: newGlideColumnName,
        supabase_column_name: newSupabaseColumnName,
        data_type: newDataType as 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address',
      },
    };

    onUpdate(updatedMapping);
    
    // Reset form
    setNewGlideColumnId('');
    setNewGlideColumnName('');
    setNewSupabaseColumnName('');
    setNewDataType('string');
  };

  const handleAddRowIdMapping = () => {
    const updatedMapping = { ...mapping };
    updatedMapping.column_mappings = {
      ...updatedMapping.column_mappings,
      ['$rowID']: {
        glide_column_name: 'Row ID',
        supabase_column_name: 'glide_row_id',
        data_type: 'string',
      },
    };

    onUpdate(updatedMapping);
    setHasRowIdMapping(true);
    
    toast({
      title: 'Success',
      description: 'Row ID mapping has been added',
    });
  };

  const handleRemoveColumnMapping = (glideColumnId: string) => {
    const updatedMapping = { ...mapping };
    const updatedColumnMappings = { ...updatedMapping.column_mappings };
    
    delete updatedColumnMappings[glideColumnId];
    updatedMapping.column_mappings = updatedColumnMappings;
    
    onUpdate(updatedMapping);
    
    if (glideColumnId === '$rowID') {
      setHasRowIdMapping(false);
    }
  };

  return (
    <div className="space-y-4">
      {!hasRowIdMapping && mapping.supabase_table === 'gl_products' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Row ID Mapping Recommended</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              For Glide synchronization, it's recommended to explicitly map Glide's <code>$rowID</code> to <code>glide_row_id</code> in Supabase.
            </p>
            <Button variant="outline" size="sm" onClick={handleAddRowIdMapping}>
              Add Row ID Mapping
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="glideColumnId">Glide Column ID</Label>
              <Input
                id="glideColumnId"
                value={newGlideColumnId}
                onChange={(e) => setNewGlideColumnId(e.target.value)}
                placeholder="Enter Glide column ID"
              />
            </div>
            <div>
              <Label htmlFor="glideColumnName">Glide Column Name</Label>
              <Input
                id="glideColumnName"
                value={newGlideColumnName}
                onChange={(e) => setNewGlideColumnName(e.target.value)}
                placeholder="Enter Glide column name"
              />
            </div>
            <div>
              <Label htmlFor="supabaseColumnName">Supabase Column</Label>
              <Select value={newSupabaseColumnName} onValueChange={setNewSupabaseColumnName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Supabase column" />
                </SelectTrigger>
                <SelectContent>
                  {supabaseColumns.map((column) => (
                    <SelectItem key={column.column_name} value={column.column_name}>
                      {column.column_name} ({column.data_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dataType">Data Type</Label>
              <Select value={newDataType} onValueChange={setNewDataType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  {dataTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            className="w-full"
            onClick={handleAddColumnMapping}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Column Mapping
          </Button>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Glide Column ID</TableHead>
              <TableHead>Glide Column Name</TableHead>
              <TableHead>Supabase Column</TableHead>
              <TableHead>Data Type</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {columnMappings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No column mappings defined
                </TableCell>
              </TableRow>
            ) : (
              columnMappings.map((columnMapping) => (
                <TableRow 
                  key={columnMapping.glideColumnId} 
                  className={columnMapping.glideColumnId === '$rowID' ? 'bg-amber-50' : ''}
                >
                  <TableCell>
                    {columnMapping.glideColumnId}
                    {columnMapping.glideColumnId === '$rowID' && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-amber-200 rounded-full">Glide ID</span>
                    )}
                  </TableCell>
                  <TableCell>{columnMapping.glide_column_name}</TableCell>
                  <TableCell>{columnMapping.supabase_column_name}</TableCell>
                  <TableCell>
                    {dataTypeOptions.find(option => option.value === columnMapping.data_type)?.label || columnMapping.data_type}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveColumnMapping(columnMapping.glideColumnId)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Export as default as well for backward compatibility
export default ColumnMappingEditor;
