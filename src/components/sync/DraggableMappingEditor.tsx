import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUpDown, Trash2, Plus, Save, Database, ArrowRight, Edit, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { useToast } from '@/hooks/utils/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mapping } from '@/types/syncLog';

/**
 * Interface for column mapping items
 */
interface ColumnMappingItem {
  id: string;
  glideColumn: string;
  supabaseColumn: string;
  dataType: string;
}

/**
 * Props for the DraggableMappingEditor component
 */
interface DraggableMappingEditorProps {
  mapping: Mapping;
  onSave: (updatedMapping: Mapping) => Promise<boolean>;
  onCancel: () => void;
  availableGlideColumns?: string[];
  availableSupabaseColumns?: string[];
}

/**
 * DraggableMappingEditor component for editing table mappings with drag and drop functionality
 * 
 * This component provides an interface for editing column mappings between Glide and Supabase
 * with drag and drop capabilities for easy reordering.
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Draggable mapping editor component
 */
export function DraggableMappingEditor({
  mapping,
  onSave,
  onCancel,
  availableGlideColumns = [],
  availableSupabaseColumns = []
}: DraggableMappingEditorProps) {
  const [editedMapping, setEditedMapping] = useState<Mapping>({ ...mapping });
  const [columnMappings, setColumnMappings] = useState<ColumnMappingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [glideColumns, setGlideColumns] = useState<string[]>(availableGlideColumns);
  const [supabaseColumns, setSupabaseColumns] = useState<string[]>(availableSupabaseColumns);
  const { toast } = useToast();

  // Initialize column mappings from the mapping prop
  useEffect(() => {
    if (mapping && mapping.column_mappings) {
      const mappingItems: ColumnMappingItem[] = Object.entries(mapping.column_mappings).map(
        ([glideColumn, details], index) => ({
          id: `mapping-${index}`,
          glideColumn,
          supabaseColumn: details.supabase_column_name,
          dataType: details.data_type || 'string'
        })
      );
      setColumnMappings(mappingItems);
    }
  }, [mapping]);

  // Fetch available columns if not provided
  useEffect(() => {
    async function fetchColumns() {
      if (availableGlideColumns.length === 0 || availableSupabaseColumns.length === 0) {
        try {
          // This would typically call an API to get available columns
          // For now, we'll just use a placeholder
          setGlideColumns(['name', 'description', 'price', 'quantity', 'category', 'created_at', 'updated_at']);
          setSupabaseColumns(['name', 'description', 'price', 'quantity', 'category', 'created_at', 'updated_at']);
        } catch (error) {
          console.error('Error fetching columns:', error);
          toast({
            title: 'Error',
            description: 'Failed to fetch available columns.',
            variant: 'destructive',
          });
        }
      }
    }
    
    fetchColumns();
  }, [availableGlideColumns, availableSupabaseColumns, toast]);

  // Handle drag end event
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(columnMappings);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setColumnMappings(items);
  };

  // Add a new column mapping
  const handleAddMapping = () => {
    const newMapping: ColumnMappingItem = {
      id: `mapping-${columnMappings.length}`,
      glideColumn: '',
      supabaseColumn: '',
      dataType: 'string'
    };
    
    setColumnMappings([...columnMappings, newMapping]);
  };

  // Remove a column mapping
  const handleRemoveMapping = (index: number) => {
    const updatedMappings = [...columnMappings];
    updatedMappings.splice(index, 1);
    setColumnMappings(updatedMappings);
  };

  // Update a column mapping
  const handleUpdateMapping = (index: number, field: keyof ColumnMappingItem, value: string) => {
    const updatedMappings = [...columnMappings];
    updatedMappings[index] = {
      ...updatedMappings[index],
      [field]: value
    };
    setColumnMappings(updatedMappings);
  };

  // Save the updated mapping
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Convert column mappings array to the expected format
      const formattedColumnMappings: Record<string, { 
        glide_column_name: string;
        supabase_column_name: string;
        data_type: string;
      }> = {};
      
      columnMappings.forEach(item => {
        if (item.glideColumn && item.supabaseColumn) {
          formattedColumnMappings[item.glideColumn] = {
            glide_column_name: item.glideColumn,
            supabase_column_name: item.supabaseColumn,
            data_type: item.dataType
          };
        }
      });
      
      const updatedMapping: Mapping = {
        ...editedMapping,
        column_mappings: formattedColumnMappings
      };
      
      const success = await onSave(updatedMapping);
      
      if (success) {
        toast({
          title: 'Success',
          description: 'Mapping updated successfully.',
        });
      }
    } catch (error) {
      console.error('Error saving mapping:', error);
      toast({
        title: 'Error',
        description: 'Failed to save mapping.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Edit Mapping: {mapping.glide_table_display_name || mapping.glide_table}</span>
          <Badge variant={mapping.enabled ? "default" : "outline"}>
            {mapping.enabled ? "Enabled" : "Disabled"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure the mapping between Glide and Supabase tables
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="columns" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Mapping Details</TabsTrigger>
            <TabsTrigger value="columns">Column Mappings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="glideTable">Glide Table</Label>
                <Input 
                  id="glideTable" 
                  value={editedMapping.glide_table} 
                  onChange={(e) => setEditedMapping({...editedMapping, glide_table: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="glideTableDisplayName">Display Name</Label>
                <Input 
                  id="glideTableDisplayName" 
                  value={editedMapping.glide_table_display_name || ''} 
                  onChange={(e) => setEditedMapping({...editedMapping, glide_table_display_name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supabaseTable">Supabase Table</Label>
                <Input 
                  id="supabaseTable" 
                  value={editedMapping.supabase_table} 
                  onChange={(e) => setEditedMapping({...editedMapping, supabase_table: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="syncDirection">Sync Direction</Label>
                <Select 
                  value={editedMapping.sync_direction} 
                  onValueChange={(value) => setEditedMapping({...editedMapping, sync_direction: value})}
                >
                  <SelectTrigger id="syncDirection">
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="glide_to_supabase">Glide to Supabase</SelectItem>
                    <SelectItem value="supabase_to_glide">Supabase to Glide</SelectItem>
                    <SelectItem value="bidirectional">Bidirectional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 pt-4">
              <Switch 
                checked={editedMapping.enabled} 
                onCheckedChange={(checked) => setEditedMapping({...editedMapping, enabled: checked})}
              />
              <Label>Enabled</Label>
            </div>
          </TabsContent>
          
          <TabsContent value="columns" className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Column Mappings</h3>
                <Button onClick={handleAddMapping} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Mapping
                </Button>
              </div>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="column-mappings">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {columnMappings.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="flex items-center space-x-2 p-2 border rounded-md bg-background"
                            >
                              <div {...provided.dragHandleProps} className="cursor-move p-2">
                                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 flex-1">
                                <Select 
                                  value={item.glideColumn} 
                                  onValueChange={(value) => handleUpdateMapping(index, 'glideColumn', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Glide Column" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {glideColumns.map(column => (
                                      <SelectItem key={column} value={column}>{column}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                
                                <div className="flex items-center justify-center">
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                                
                                <Select 
                                  value={item.supabaseColumn} 
                                  onValueChange={(value) => handleUpdateMapping(index, 'supabaseColumn', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Supabase Column" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {supabaseColumns.map(column => (
                                      <SelectItem key={column} value={column}>{column}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <Select 
                                value={item.dataType} 
                                onValueChange={(value) => handleUpdateMapping(index, 'dataType', value)}
                                className="w-24"
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="string">String</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="boolean">Boolean</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                  <SelectItem value="json">JSON</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRemoveMapping(index)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              
              {columnMappings.length === 0 && (
                <div className="text-center py-8 border rounded-md bg-muted/20">
                  <p className="text-muted-foreground">No column mappings defined</p>
                  <Button onClick={handleAddMapping} variant="outline" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Mapping
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Mapping
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
