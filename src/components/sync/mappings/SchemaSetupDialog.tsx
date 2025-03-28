
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Database, Columns } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ColumnMappingEditor } from '../ColumnMappingEditor';

interface SupabaseTable {
  table_name: string;
}

interface SchemaSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectionId: string;
  onSuccess?: () => void;
}

const SchemaSetupDialog: React.FC<SchemaSetupDialogProps> = ({ 
  open, 
  onOpenChange,
  connectionId,
  onSuccess
}) => {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<{ name: string; type: string; isPrimary: boolean }[]>([
    { name: 'glide_row_id', type: 'text', isPrimary: true },
    { name: 'created_at', type: 'timestamp with time zone', isPrimary: false },
    { name: 'updated_at', type: 'timestamp with time zone', isPrimary: false }
  ]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('create');
  const [mappingConfig, setMappingConfig] = useState({
    id: '',
    connection_id: connectionId,
    supabase_table: '',
    glide_table: '',
    glide_table_display_name: '',
    column_mappings: {},
    sync_direction: 'to_supabase'
  });
  const { toast } = useToast();

  const handleAddColumn = () => {
    setColumns([...columns, { name: '', type: 'text', isPrimary: false }]);
  };

  const handleRemoveColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const handleColumnChange = (index: number, field: 'name' | 'type' | 'isPrimary', value: string | boolean) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setColumns(newColumns);
  };

  const handleCreateTable = async () => {
    if (!tableName) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a table name',
        variant: 'destructive',
      });
      return;
    }

    if (columns.some(col => !col.name)) {
      toast({
        title: 'Invalid Column',
        description: 'All columns must have a name',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Mock API call to create table
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Table Created',
        description: `Table ${tableName} has been created successfully`
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating table:', error);
      toast({
        title: 'Error',
        description: 'Failed to create table',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loadTables = async () => {
    setIsLoadingTables(true);
    try {
      // Mock API call to load tables
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTables(['gl_products', 'gl_accounts', 'gl_invoices', 'gl_purchase_orders']);
    } catch (error) {
      console.error('Error loading tables:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tables',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTables(false);
    }
  };

  React.useEffect(() => {
    if (open) {
      loadTables();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create or Select Supabase Table</DialogTitle>
          <DialogDescription>
            Set up a new table in Supabase or select an existing one to map with Glide
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Create New Table
            </TabsTrigger>
            <TabsTrigger value="existing" className="flex items-center">
              <Columns className="h-4 w-4 mr-2" />
              Use Existing Table
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="table-name">Table Name</Label>
              <Input
                id="table-name"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="e.g., gl_custom_products"
              />
              <p className="text-sm text-muted-foreground">
                Table names should start with "gl_" for better organization
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Columns</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddColumn}
                >
                  Add Column
                </Button>
              </div>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                {columns.map((column, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input
                        value={column.name}
                        onChange={(e) => handleColumnChange(index, 'name', e.target.value)}
                        placeholder="Column name"
                        disabled={index < 3} // Disable editing for the default columns
                      />
                    </div>
                    <div className="col-span-5">
                      <Select
                        value={column.type}
                        onValueChange={(value) => handleColumnChange(index, 'type', value)}
                        disabled={index < 3} // Disable editing for the default columns
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Column type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="integer">Integer</SelectItem>
                          <SelectItem value="numeric">Numeric</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                          <SelectItem value="timestamp with time zone">Timestamp</SelectItem>
                          <SelectItem value="jsonb">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={column.isPrimary}
                        onChange={(e) => handleColumnChange(index, 'isPrimary', e.target.checked)}
                        disabled={index < 3} // Disable editing for the default columns
                      />
                    </div>
                    <div className="col-span-1">
                      {index >= 3 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveColumn(index)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="existing" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="existing-table">Select Existing Table</Label>
              <Select
                value={selectedTable}
                onValueChange={setSelectedTable}
              >
                <SelectTrigger id="existing-table">
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingTables ? (
                    <div className="flex justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    tables.map(table => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedTable && (
              <Card>
                <CardHeader>
                  <CardTitle>Configure Mapping</CardTitle>
                  <CardDescription>
                    Define how this table maps to Glide
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ColumnMappingEditor
                    mapping={{
                      ...mappingConfig,
                      supabase_table: selectedTable
                    }}
                    onUpdate={(updatedMapping) => setMappingConfig(updatedMapping)}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={activeTab === 'create' ? handleCreateTable : () => {}}
            disabled={isSaving || (activeTab === 'create' && !tableName) || (activeTab === 'existing' && !selectedTable)}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {activeTab === 'create' ? 'Create Table' : 'Use Selected Table'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SchemaSetupDialog;
