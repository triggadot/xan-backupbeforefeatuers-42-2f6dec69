import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, RefreshCcw, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { glSyncService } from '@/services/glsync';

export interface ColumnMappingEditorProps {
  mapping?: any;
  onUpdate: (updatedMapping: any) => void;
}

export function ColumnMappingEditor({ mapping, onUpdate }: ColumnMappingEditorProps) {
  const [columnMappings, setColumnMappings] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [glideColumns, setGlideColumns] = useState<string[]>([]);
  const [supabaseColumns, setSupabaseColumns] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (mapping) {
      setColumnMappings(mapping.column_mappings || {});
      loadTableColumns(mapping.supabase_table);
    }
  }, [mapping]);

  const loadTableColumns = async (tableName: string) => {
    if (!tableName) return;

    setIsLoading(true);
    try {
      const columns = await glSyncService.getSupabaseTableColumns(tableName);
      setSupabaseColumns(columns.map(col => col.column_name));
    } catch (error) {
      console.error('Error loading table columns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load table columns',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMapping = () => {
    setColumnMappings(prev => ({
      ...prev,
      [`mapping_${Object.keys(prev).length}`]: {
        glide_column_name: '',
        supabase_column_name: '',
        data_type: 'string'
      }
    }));
  };

  const handleRemoveMapping = (key: string) => {
    setColumnMappings(prev => {
      const newMappings = { ...prev };
      delete newMappings[key];
      return newMappings;
    });
  };

  const handleUpdateMapping = (key: string, field: string, value: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSaveMappings = () => {
    onUpdate({ ...mapping, column_mappings: columnMappings });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Column Mappings</CardTitle>
        <CardDescription>
          Define how columns in Glide map to columns in Supabase
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center my-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(columnMappings).map(([key, value]: [string, any]) => (
              <div key={key} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <Label>Glide Column</Label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    value={value.glide_column_name}
                    onChange={(e) => handleUpdateMapping(key, 'glide_column_name', e.target.value)}
                  />
                </div>
                <div className="col-span-5">
                  <Label>Supabase Column</Label>
                  <Select
                    value={value.supabase_column_name}
                    onValueChange={(val) => handleUpdateMapping(key, 'supabase_column_name', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {supabaseColumns.map(column => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Label>Type</Label>
                  <Select
                    value={value.data_type}
                    onValueChange={(val) => handleUpdateMapping(key, 'data_type', val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="date-time">Date/Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMapping(key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleAddMapping}
                className="flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Mapping
              </Button>
              <Button 
                onClick={handleSaveMappings}
                className="flex items-center"
              >
                Save Mappings
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
