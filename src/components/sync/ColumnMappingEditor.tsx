
import React, { useState, useEffect } from 'react';
import { Trash2, Plus, AlertTriangle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GlColumnMapping } from '@/types/glsync';
import { supabase } from '@/integrations/supabase/client';

interface ColumnMapping {
  glideColumnId: string;
  mapping: GlColumnMapping;
}

interface ColumnMappingEditorProps {
  value: Record<string, GlColumnMapping>;
  onChange: (mappings: Record<string, GlColumnMapping>) => void;
  supabaseTable: string;
  // Optional array of available glide columns from the API
  availableGlideColumns?: Array<{ id: string; name: string; type?: string }>;
}

export function ColumnMappingEditor({
  value = {},
  onChange,
  supabaseTable,
  availableGlideColumns = [],
}: ColumnMappingEditorProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [supabaseColumns, setSupabaseColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Convert the value object to array for easier manipulation
  useEffect(() => {
    const mappingsArray = Object.entries(value).map(([glideColumnId, mapping]) => ({
      glideColumnId,
      mapping,
    }));
    setMappings(mappingsArray);
  }, [value]);

  // Fetch Supabase columns when the table changes
  useEffect(() => {
    if (!supabaseTable) return;
    
    async function fetchColumns() {
      try {
        // Get columns from the current table
        const { data, error } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', supabaseTable)
          .eq('table_schema', 'public');
        
        if (error) throw error;
        
        const columns = data.map(col => col.column_name);
        setSupabaseColumns(columns);
        setError(null);
      } catch (err) {
        console.error('Error fetching table columns:', err);
        setError('Could not fetch table columns. Using default mappings.');
        // Provide at least the glide_row_id as a default mapping
        setSupabaseColumns(['glide_row_id']);
      }
    }
    
    fetchColumns();
  }, [supabaseTable]);

  const handleAddMapping = () => {
    const newMappings = [...mappings];
    
    // Default values
    const newGlideColumnId = `column_${mappings.length + 1}`;
    const existingSupabaseColumn = supabaseColumns.length > 0 ? supabaseColumns[0] : '';
    
    newMappings.push({
      glideColumnId: newGlideColumnId,
      mapping: {
        glide_column_name: newGlideColumnId,
        supabase_column_name: existingSupabaseColumn,
        data_type: 'string',
      },
    });
    
    updateMappings(newMappings);
  };

  const handleRemoveMapping = (index: number) => {
    const newMappings = [...mappings];
    newMappings.splice(index, 1);
    updateMappings(newMappings);
  };

  const handleMappingChange = (index: number, field: keyof GlColumnMapping, value: string) => {
    const newMappings = [...mappings];
    newMappings[index].mapping = {
      ...newMappings[index].mapping,
      [field]: value,
    };
    updateMappings(newMappings);
  };

  const handleGlideColumnIdChange = (index: number, value: string) => {
    const newMappings = [...mappings];
    newMappings[index].glideColumnId = value;
    
    // Also update the column name if it wasn't custom
    if (newMappings[index].mapping.glide_column_name === newMappings[index].glideColumnId) {
      newMappings[index].mapping.glide_column_name = value;
    }
    
    updateMappings(newMappings);
  };

  const updateMappings = (newMappings: ColumnMapping[]) => {
    setMappings(newMappings);
    
    // Convert array back to object format
    const mappingsObject: Record<string, GlColumnMapping> = {};
    newMappings.forEach(({ glideColumnId, mapping }) => {
      mappingsObject[glideColumnId] = mapping;
    });
    
    onChange(mappingsObject);
  };

  const dataTypeOptions = [
    { value: 'string', label: 'String' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'date-time', label: 'Date/Time' },
    { value: 'image-uri', label: 'Image URI' },
    { value: 'email-address', label: 'Email Address' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">Column Mappings</Label>
        <Badge variant="outline" className="ml-2">
          {mappings.length} mappings
        </Badge>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {mappings.length === 0 ? (
        <div className="text-center py-6 border border-dashed rounded-lg">
          <p className="text-muted-foreground mb-2">No column mappings defined</p>
          <Button onClick={handleAddMapping} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Column Mapping
          </Button>
        </div>
      ) : (
        <ScrollArea className="h-[300px] border rounded-md p-4">
          <div className="space-y-6">
            {mappings.map((mapping, index) => (
              <div key={index} className="grid gap-3 pb-4 border-b border-gray-100 last:border-0">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">Mapping {index + 1}</span>
                  <Button
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemoveMapping(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor={`glide-column-id-${index}`}>Glide Column ID</Label>
                  
                  {availableGlideColumns.length > 0 ? (
                    <Select
                      value={mapping.glideColumnId}
                      onValueChange={(value) => handleGlideColumnIdChange(index, value)}
                    >
                      <SelectTrigger id={`glide-column-id-${index}`}>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Available Columns</SelectLabel>
                          {availableGlideColumns.map((column) => (
                            <SelectItem key={column.id} value={column.id}>
                              {column.name || column.id}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`glide-column-id-${index}`}
                      value={mapping.glideColumnId}
                      onChange={(e) => handleGlideColumnIdChange(index, e.target.value)}
                      placeholder="Enter Glide column ID"
                    />
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor={`glide-column-name-${index}`}>Glide Column Name</Label>
                  <Input
                    id={`glide-column-name-${index}`}
                    value={mapping.mapping.glide_column_name}
                    onChange={(e) => handleMappingChange(index, 'glide_column_name', e.target.value)}
                    placeholder="Enter display name"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor={`supabase-column-${index}`}>Supabase Column</Label>
                  
                  {supabaseColumns.length > 0 ? (
                    <Select
                      value={mapping.mapping.supabase_column_name}
                      onValueChange={(value) => handleMappingChange(index, 'supabase_column_name', value)}
                    >
                      <SelectTrigger id={`supabase-column-${index}`}>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Available Columns</SelectLabel>
                          {supabaseColumns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`supabase-column-${index}`}
                      value={mapping.mapping.supabase_column_name}
                      onChange={(e) => handleMappingChange(index, 'supabase_column_name', e.target.value)}
                      placeholder="Enter Supabase column name"
                    />
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor={`data-type-${index}`}>Data Type</Label>
                  <Select
                    value={mapping.mapping.data_type}
                    onValueChange={(value) => handleMappingChange(index, 'data_type', value as any)}
                  >
                    <SelectTrigger id={`data-type-${index}`}>
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
            ))}
          </div>
        </ScrollArea>
      )}
      
      <Button onClick={handleAddMapping} variant="outline" size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Add Column Mapping
      </Button>
    </div>
  );
}

export default ColumnMappingEditor;
