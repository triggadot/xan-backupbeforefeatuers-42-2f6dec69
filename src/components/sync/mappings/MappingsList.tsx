
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, RefreshCw, ArrowUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mapping } from '@/types/syncLog';
import { AddMappingButton } from './AddMappingButton';

export default function MappingsList() {
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Mapping>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchMappings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gl_mappings')
        .select(`
          id,
          connection_id,
          glide_table,
          glide_table_display_name,
          supabase_table,
          column_mappings,
          sync_direction,
          enabled,
          created_at,
          updated_at,
          gl_connections (
            app_name
          )
        `)
        .order(sortField, { ascending: sortDirection === 'asc' });
      
      if (error) throw error;
      
      // Transform the data to include the app_name from the joined table
      const transformedData = data.map(item => ({
        ...item,
        app_name: item.gl_connections?.app_name || 'Unknown App'
      }));
      
      setMappings(transformedData);
    } catch (error) {
      console.error('Error fetching mappings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch mappings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMappings();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('mappings-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'gl_mappings' },
        fetchMappings
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sortField, sortDirection]);

  const handleSort = (field: keyof Mapping) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewMapping = (id: string) => {
    navigate(`/sync/mappings/${id}`);
  };

  const filteredMappings = mappings.filter(mapping => 
    mapping.glide_table_display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.supabase_table.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.app_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search mappings..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchMappings} className="h-9">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <AddMappingButton />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort('glide_table_display_name')} className="cursor-pointer">
                  <div className="flex items-center">
                    Glide Table
                    {sortField === 'glide_table_display_name' && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('supabase_table')} className="cursor-pointer">
                  <div className="flex items-center">
                    Supabase Table
                    {sortField === 'supabase_table' && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('app_name')} className="cursor-pointer">
                  <div className="flex items-center">
                    App
                    {sortField === 'app_name' && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-center">Direction</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredMappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No mappings found matching your search.' : 'No mappings found. Create your first mapping to start synchronizing data.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMappings.map((mapping) => (
                  <TableRow key={mapping.id} className="cursor-pointer" onClick={() => handleViewMapping(mapping.id)}>
                    <TableCell className="font-medium">{mapping.glide_table_display_name}</TableCell>
                    <TableCell>{mapping.supabase_table}</TableCell>
                    <TableCell>{mapping.app_name}</TableCell>
                    <TableCell className="text-center">
                      {mapping.sync_direction === 'to_supabase' ? (
                        <Badge variant="secondary">To Supabase</Badge>
                      ) : mapping.sync_direction === 'to_glide' ? (
                        <Badge variant="secondary">To Glide</Badge>
                      ) : (
                        <Badge variant="secondary">Bidirectional</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {mapping.enabled ? (
                        <Badge variant="success">Enabled</Badge>
                      ) : (
                        <Badge variant="outline">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={(e) => {
                        e.stopPropagation();
                        handleViewMapping(mapping.id);
                      }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
