
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Trash2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlColumnMapping, GlConnection, GlideTable } from '@/types/glsync';
import { glSyncApi } from '@/services/glSyncApi';
import { useToast } from '@/hooks/use-toast';

interface ColumnMappingEditorProps {
  connectionId: string;
  initialMappings?: Record<string, GlColumnMapping>;
  onSave: (mappings: Record<string, GlColumnMapping>) => void;
  glideTable?: string;
  supabaseTable?: string;
  onCancel?: () => void;
}

export const ColumnMappingEditor: React.FC<ColumnMappingEditorProps> = ({
  connectionId,
  initialMappings = {},
  onSave,
  glideTable,
  supabaseTable,
  onCancel
}) => {
  const [mappings, setMappings] = useState<Record<string, GlColumnMapping>>(initialMappings);
  const [glideTables, setGlideTables] = useState<GlideTable[]>([]);
  const [supabaseTables, setSupabaseTables] = useState<string[]>([]);
  const [selectedGlideTable, setSelectedGlideTable] = useState<string | undefined>(glideTable);
  const [selectedSupabaseTable, setSelectedSupabaseTable] = useState<string | undefined>(supabaseTable);
  const [glideColumns, setGlideColumns] = useState<any[]>([]);
  const [supabaseColumns, setSupabaseColumns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTables, setIsFetchingTables] = useState(false);
  const [isFetchingColumns, setIsFetchingColumns] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchGlideTables();
    fetchSupabaseTables();
  }, [connectionId]);

  useEffect(() => {
    if (selectedGlideTable) {
      fetchGlideColumns();
    }
  }, [selectedGlideTable, connectionId]);

  useEffect(() => {
    if (selectedSupabaseTable) {
      fetchSupabaseColumns();
    }
  }, [selectedSupabaseTable]);

  const fetchGlideTables = async () => {
    if (!connectionId) return;
    
    setIsFetchingTables(true);
    try {
      const result = await glSyncApi.listGlideTables(connectionId);
      if (result.success && result.tables) {
        setGlideTables(result.tables);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch Glide tables',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching Glide tables:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch Glide tables',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingTables(false);
    }
  };

  const fetchSupabaseTables = async () => {
    setIsFetchingTables(true);
    try {
      const tables = await glSyncApi.getSupabaseTables();
      setSupabaseTables(tables);
    } catch (error) {
      console.error('Error fetching Supabase tables:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch Supabase tables',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingTables(false);
    }
  };

  const fetchGlideColumns = async () => {
    if (!connectionId || !selectedGlideTable) return;
    
    setIsFetchingColumns(true);
    try {
      // Fetch Glide columns using the appropriate API endpoint
      const columns = []; // Replace with actual API call
      setGlideColumns(columns);
    } catch (error) {
      console.error('Error fetching Glide columns:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch Glide columns',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingColumns(false);
    }
  };

  const fetchSupabaseColumns = async () => {
    if (!selectedSupabaseTable) return;
    
    setIsFetchingColumns(true);
    try {
      const columns = await glSyncApi.getTableColumns(selectedSupabaseTable);
      setSupabaseColumns(columns);
    } catch (error) {
      console.error('Error fetching Supabase columns:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch Supabase columns',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingColumns(false);
    }
  };

  const handleSaveMapping = () => {
    onSave(mappings);
  };

  const addMapping = (glideColumnId: string, glideColumnName: string) => {
    setMappings(prev => ({
      ...prev,
      [glideColumnId]: {
        glide_column_name: glideColumnName,
        supabase_column_name: '',
        data_type: 'string'
      }
    }));
  };

  const updateMapping = (glideColumnId: string, field: keyof GlColumnMapping, value: string) => {
    setMappings(prev => ({
      ...prev,
      [glideColumnId]: {
        ...prev[glideColumnId],
        [field]: value
      }
    }));
  };

  const removeMapping = (glideColumnId: string) => {
    const newMappings = { ...mappings };
    delete newMappings[glideColumnId];
    setMappings(newMappings);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="glideTable">Glide Table</Label>
          <Select
            value={selectedGlideTable}
            onValueChange={setSelectedGlideTable}
            disabled={isFetchingTables || !!glideTable}
          >
            <SelectTrigger id="glideTable">
              <SelectValue placeholder="Select Glide table" />
            </SelectTrigger>
            <SelectContent>
              {glideTables.map(table => (
                <SelectItem key={table.id} value={table.id}>
                  {table.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="supabaseTable">Supabase Table</Label>
          <Select
            value={selectedSupabaseTable}
            onValueChange={setSelectedSupabaseTable}
            disabled={isFetchingTables || !!supabaseTable}
          >
            <SelectTrigger id="supabaseTable">
              <SelectValue placeholder="Select Supabase table" />
            </SelectTrigger>
            <SelectContent>
              {supabaseTables.map(table => (
                <SelectItem key={table} value={table}>
                  {table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            fetchGlideColumns();
            fetchSupabaseColumns();
          }}
          disabled={!selectedGlideTable || !selectedSupabaseTable || isFetchingColumns}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetchingColumns ? 'animate-spin' : ''}`} />
          Refresh Columns
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Column Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          {isFetchingColumns ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Glide Column</TableHead>
                  <TableHead>Supabase Column</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(mappings).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No mappings defined. Add columns to map between Glide and Supabase.
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.entries(mappings).map(([glideColumnId, mapping]) => (
                    <TableRow key={glideColumnId}>
                      <TableCell>{mapping.glide_column_name}</TableCell>
                      <TableCell>
                        <Select
                          value={mapping.supabase_column_name}
                          onValueChange={(value) => updateMapping(glideColumnId, 'supabase_column_name', value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {supabaseColumns.map((column) => (
                              <SelectItem key={column.column_name} value={column.column_name}>
                                {column.column_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.data_type}
                          onValueChange={(value) => updateMapping(glideColumnId, 'data_type', value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Data type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="date-time">Date/Time</SelectItem>
                            <SelectItem value="image-uri">Image URI</SelectItem>
                            <SelectItem value="email-address">Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMapping(glideColumnId)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSaveMapping} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Mappings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
