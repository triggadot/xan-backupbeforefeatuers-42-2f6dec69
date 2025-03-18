
import React, { useEffect, useState } from 'react';
import { GlColumnMapping } from '@/types/glsync';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { glSyncApi } from '@/services/glsync';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface ColumnMappingEditorProps {
  mapping: {
    column_mappings: Record<string, GlColumnMapping>;
  };
  onUpdate: (updatedMapping: {
    column_mappings: Record<string, GlColumnMapping>;
  }) => void;
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

const ColumnMappingEditor: React.FC<ColumnMappingEditorProps> = ({ mapping, onUpdate }) => {
  const [newGlideColumnId, setNewGlideColumnId] = useState('');
  const [newGlideColumnName, setNewGlideColumnName] = useState('');
  const [newSupabaseColumnName, setNewSupabaseColumnName] = useState('');
  const [newDataType, setNewDataType] = useState<string>('string');
  const [supabaseColumns, setSupabaseColumns] = useState<SupabaseColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Get the column mappings as an array for easier rendering
  const columnMappings = Object.entries(mapping.column_mappings || {}).map(
    ([glideColumnId, columnMapping]) => ({
      glideColumnId,
      ...columnMapping,
    })
  );

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

  const handleRemoveColumnMapping = (glideColumnId: string) => {
    const updatedMapping = { ...mapping };
    const updatedColumnMappings = { ...updatedMapping.column_mappings };
    
    delete updatedColumnMappings[glideColumnId];
    updatedMapping.column_mappings = updatedColumnMappings;
    
    onUpdate(updatedMapping);
  };

  return (
    <div className="space-y-4">
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
                <TableRow key={columnMapping.glideColumnId}>
                  <TableCell>{columnMapping.glideColumnId}</TableCell>
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

export default ColumnMappingEditor;
