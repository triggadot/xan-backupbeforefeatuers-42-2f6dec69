import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trash2, PlusCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GlColumnMapping } from '@/types/glsync';
import { useColumnMappingValidation } from '@/hooks/useColumnMappingValidation';

const dataTypeOptions = [
  { value: 'string', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date-time', label: 'Date/Time' },
  { value: 'image-uri', label: 'Image URL' },
  { value: 'email-address', label: 'Email' },
];

interface ColumnMappingFormProps {
  supabaseTable: string;
  columnMappings: Record<string, GlColumnMapping>;
  onUpdate: (columnMappings: Record<string, GlColumnMapping>) => void;
  glideColumns?: Array<{ id: string; name: string; type?: string }>;
}

const ColumnMappingForm = ({
  supabaseTable,
  columnMappings,
  onUpdate,
  glideColumns = []
}: ColumnMappingFormProps) => {
  const [newGlideColumnId, setNewGlideColumnId] = useState('');
  const [newGlideColumnName, setNewGlideColumnName] = useState('');
  const [newSupabaseColumnName, setNewSupabaseColumnName] = useState('');
  const [newDataType, setNewDataType] = useState<string>('string');
  const [supabaseColumns, setSupabaseColumns] = useState<{ column_name: string; data_type: string; }[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasRowIdMapping, setHasRowIdMapping] = useState(false);
  const [validationMessage, setValidationMessage] = useState<{ isValid: boolean; message: string } | null>(null);
  const { toast } = useToast();
  const { validateColumnMapping, suggestColumnMappings, isValidating } = useColumnMappingValidation();

  const columnMappingsArray = Object.entries(columnMappings || {}).map(
    ([glideColumnId, columnMapping]) => ({
      glideColumnId,
      ...columnMapping,
    })
  );

  useEffect(() => {
    setHasRowIdMapping(!!columnMappings['$rowID']);
    
    if (supabaseTable) {
      fetchSupabaseColumns();
      validateCurrentMappings();
    }
  }, [supabaseTable, columnMappings]);

  useEffect(() => {
    if (glideColumns.length > 0 && supabaseTable && 
        (!columnMappings || Object.keys(columnMappings).length <= 1)) {
      generateSuggestedMappings();
    }
  }, [glideColumns, supabaseTable]);

  const fetchSupabaseColumns = async () => {
    if (!supabaseTable) return;
    
    setLoading(true);
    try {
      const { data, error } = await fetch('/api/supabase/columns?table=' + supabaseTable)
        .then(res => res.json());
      
      if (error) throw new Error(error);
      setSupabaseColumns(data || []);
    } catch (error) {
      console.error('Error fetching Supabase columns:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch table columns',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateCurrentMappings = async () => {
    if (!supabaseTable || !columnMappings || Object.keys(columnMappings).length === 0) return;
    
    const result = await validateColumnMapping(supabaseTable, columnMappings);
    setValidationMessage(result);
  };

  const generateSuggestedMappings = async () => {
    if (!supabaseTable || !glideColumns.length) return;
    
    setLoading(true);
    try {
      const suggestedMappings = await suggestColumnMappings(supabaseTable, glideColumns);
      
      const updatedMappings = {
        ...suggestedMappings,
        ...columnMappings,
      };
      
      onUpdate(updatedMappings);
      toast({
        title: 'Suggested Mappings Generated',
        description: 'Column mappings have been suggested based on column names',
      });
    } catch (error) {
      console.error('Error generating suggested mappings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddColumnMapping = () => {
    if (!newGlideColumnId || !newGlideColumnName || !newSupabaseColumnName) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (columnMappings[newGlideColumnId]) {
      toast({
        title: 'Validation Error',
        description: `A mapping for "${newGlideColumnId}" already exists`,
        variant: 'destructive',
      });
      return;
    }

    const updatedMappings = {
      ...columnMappings,
      [newGlideColumnId]: {
        glide_column_name: newGlideColumnName,
        supabase_column_name: newSupabaseColumnName,
        data_type: newDataType as any,
      },
    };

    onUpdate(updatedMappings);
    
    setNewGlideColumnId('');
    setNewGlideColumnName('');
    setNewSupabaseColumnName('');
    setNewDataType('string');
  };

  const handleAddRowIdMapping = () => {
    const updatedMappings = {
      ...columnMappings,
      ['$rowID']: {
        glide_column_name: 'Row ID',
        supabase_column_name: 'glide_row_id',
        data_type: 'string' as 'string',
      },
    };

    onUpdate(updatedMappings);
    setHasRowIdMapping(true);
    
    toast({
      title: 'Success',
      description: 'Row ID mapping has been added',
    });
  };

  const handleRemoveColumnMapping = (glideColumnId: string) => {
    const updatedMappings = { ...columnMappings };
    delete updatedMappings[glideColumnId];
    
    onUpdate(updatedMappings);
    
    if (glideColumnId === '$rowID') {
      setHasRowIdMapping(false);
    }
  };

  const handleGlideColumnSelect = (id: string) => {
    if (!id) return;
    
    const column = glideColumns.find(col => col.id === id);
    if (column) {
      setNewGlideColumnId(column.id);
      setNewGlideColumnName(column.name);
      
      if (column.type) {
        let dataType = 'string';
        
        if (['number', 'integer', 'float'].includes(column.type.toLowerCase())) {
          dataType = 'number';
        } else if (['boolean', 'bool', 'checkbox'].includes(column.type.toLowerCase())) {
          dataType = 'boolean';
        } else if (['date', 'datetime', 'timestamp'].includes(column.type.toLowerCase())) {
          dataType = 'date-time';
        } else if (column.type.toLowerCase().includes('image') || column.type.toLowerCase().includes('photo')) {
          dataType = 'image-uri';
        } else if (column.type.toLowerCase().includes('email')) {
          dataType = 'email-address';
        }
        
        setNewDataType(dataType);
      }
    }
  };

  return (
    <div className="space-y-4">
      {!hasRowIdMapping && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Row ID Mapping Required</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              For Glide synchronization, it's required to map Glide's <code>$rowID</code> to <code>glide_row_id</code> in Supabase.
            </p>
            <Button variant="outline" size="sm" onClick={handleAddRowIdMapping}>
              Add Row ID Mapping
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {validationMessage && !validationMessage.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>{validationMessage.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="glideColumnId">Glide Column</Label>
              {glideColumns.length > 0 ? (
                <Select value={newGlideColumnId} onValueChange={handleGlideColumnSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Glide column" />
                  </SelectTrigger>
                  <SelectContent>
                    {glideColumns
                      .filter(col => col.id !== '$rowID' && !columnMappings[col.id])
                      .map(col => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.name} {col.type ? `(${col.type})` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="glideColumnId"
                  value={newGlideColumnId}
                  onChange={(e) => setNewGlideColumnId(e.target.value)}
                  placeholder="Enter Glide column ID"
                />
              )}
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
            disabled={!newGlideColumnId || !newGlideColumnName || !newSupabaseColumnName}
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
            {columnMappingsArray.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No column mappings defined
                </TableCell>
              </TableRow>
            ) : (
              columnMappingsArray.map((columnMapping) => (
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

export default ColumnMappingForm;
