import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlColumnMapping, GlMapping } from '@/types/glide-sync/glsync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for temporary keys

// Define possible data types for the select dropdown
const DATA_TYPES = [
  "TEXT", "VARCHAR", "INTEGER", "BIGINT", "FLOAT", "DOUBLE PRECISION",
  "NUMERIC", "BOOLEAN", "DATE", "TIMESTAMP", "TIMESTAMPTZ", "JSON", "JSONB", "UUID"
];

export interface ColumnMappingsViewProps {
  mapping: GlMapping;
  // Pass the entire mapping object for updates
  onMappingUpdate: (updatedMapping: GlMapping) => Promise<void>; 
  glideTable?: string;
  supabaseTable?: string;
}

export const ColumnMappingsView: React.FC<ColumnMappingsViewProps> = ({
  mapping,
  onMappingUpdate, // Use the passed update function
  glideTable,
  supabaseTable
}) => {
  const [isEditing, setIsEditing] = useState(false);
  // Initialize editedMappings based on the mapping prop
  const [editedMappings, setEditedMappings] = useState<Record<string, GlColumnMapping>>(mapping.column_mappings || {});

  // Update local state if the mapping prop changes externally
  useEffect(() => {
    setEditedMappings(mapping.column_mappings || {});
  }, [mapping.column_mappings]);

  const handleEditToggle = () => {
    if (!isEditing) {
      // Entering edit mode, copy current mappings
      setEditedMappings(JSON.parse(JSON.stringify(mapping.column_mappings || {}))); 
    }
    setIsEditing(!isEditing);
  };

  const handleCancel = () => {
    // Discard changes and exit edit mode
    setEditedMappings(mapping.column_mappings || {});
    setIsEditing(false);
  };

  const handleSave = async () => {
    const updatedMappingData = { ...mapping, column_mappings: editedMappings };
    try {
        // Call the provided update function
        await onMappingUpdate(updatedMappingData); 
        setIsEditing(false);
        // Optionally: show success toast
    } catch (error) {
        console.error("Failed to update mappings:", error);
        // Optionally: show error toast
    }
  };

  const handleMappingChange = (key: string, field: keyof GlColumnMapping, value: string) => {
    setEditedMappings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleAddMapping = () => {
    const newKey = `temp_${uuidv4()}`; // Use UUID for a unique temporary key
    setEditedMappings(prev => ({
      ...prev,
      [newKey]: { glide_column_name: '', supabase_column_name: '', data_type: 'TEXT' }
    }));
  };

  const handleRemoveMapping = (keyToRemove: string) => {
    setEditedMappings(prev => {
      const newState = { ...prev };
      delete newState[keyToRemove];
      return newState;
    });
  };


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Column Mappings</CardTitle>
          <div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" /> Save Changes
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={handleEditToggle}>
                <Pencil className="h-4 w-4 mr-1" /> Edit Mappings
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-2/5">Glide Column</TableHead>
                <TableHead className="w-2/5">Supabase Column</TableHead>
                <TableHead className="w-1/5">Data Type</TableHead>
                {isEditing && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(editedMappings).length === 0 && !isEditing ? (
                <TableRow>
                  <TableCell colSpan={isEditing ? 4 : 3} className="text-center h-24 text-muted-foreground">
                    No column mappings defined.
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(editedMappings).map(([key, currentMapping]) => (
                  <TableRow key={key}>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={currentMapping.glide_column_name}
                          onChange={(e) => handleMappingChange(key, 'glide_column_name', e.target.value)}
                          placeholder="Glide Column Name"
                          className="h-8"
                        />
                      ) : (
                        currentMapping.glide_column_name || <span className="text-muted-foreground italic">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={currentMapping.supabase_column_name}
                          onChange={(e) => handleMappingChange(key, 'supabase_column_name', e.target.value)}
                          placeholder="Supabase Column Name"
                          className="h-8"
                        />
                      ) : (
                        currentMapping.supabase_column_name || <span className="text-muted-foreground italic">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={currentMapping.data_type}
                          onValueChange={(value) => handleMappingChange(key, 'data_type', value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {DATA_TYPES.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        currentMapping.data_type || <span className="text-muted-foreground italic">Not set</span>
                      )}
                    </TableCell>
                    {isEditing && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemoveMapping(key)}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove mapping</span>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {isEditing && (
             <div className="p-4 border-t">
                <Button variant="outline" size="sm" onClick={handleAddMapping}>
                   Add New Mapping
                </Button>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
};
