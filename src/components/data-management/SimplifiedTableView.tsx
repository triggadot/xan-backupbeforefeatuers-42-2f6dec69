import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from '@/components/ui/spinner';

/**
 * SimplifiedTableView component for displaying table data without complex interactions
 * 
 * This component provides a basic read-only view of a database table, designed as a
 * lightweight alternative to the more complex SupabaseTableView component.
 * 
 * @param {Object} props - Component props
 * @param {string} props.tableName - Name of the table to display
 * @returns {JSX.Element} Simplified table view component
 */
export default function SimplifiedTableView({ tableName }: { tableName: string }) {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  useEffect(() => {
    async function fetchData() {
      if (!tableName) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // First get the count of records
        const { count, error: countError } = await supabase
          .from(tableName as any)
          .select('*', { count: 'exact', head: true });
          
        if (countError) throw countError;
        setTotalRecords(count || 0);
        
        // Fetch data from the specified table
        const { data, error } = await supabase
          .from(tableName as any)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Extract column names from the first row
          const allColumns = Object.keys(data[0]);
          
          // Filter out system columns and prioritize important columns
          const prioritizedColumns = [
            'name', 'title', 'description', 'glide_row_id', 
            ...allColumns.filter(col => 
              !['id', 'created_at', 'updated_at'].includes(col) && 
              !col.startsWith('_') &&
              !['name', 'title', 'description', 'glide_row_id'].includes(col)
            )
          ].filter(col => allColumns.includes(col));
          
          // Limit to 8 columns for better display
          setColumns(prioritizedColumns.slice(0, 8));
          setData(data);
        } else {
          setData([]);
          setColumns([]);
        }
      } catch (err) {
        console.error('Error fetching table data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    if (tableName) {
      fetchData();
    }
  }, [tableName]);

  // Helper function to format cell values for display
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value).substring(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '');
      } catch (e) {
        return '[Complex Object]';
      }
    }
    const stringValue = String(value);
    return stringValue.length > 50 ? stringValue.substring(0, 50) + '...' : stringValue;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
        <span className="ml-2">Loading table data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-4">
          <div className="text-destructive font-medium">Error loading table data</div>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center py-8 text-muted-foreground">
            No data available in this table
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>
          Showing {data.length} of {totalRecords} records from {tableName}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">#</TableHead>
            {columns.map(column => (
              <TableHead key={column}>
                {column.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={row.id || index}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              {columns.map(column => (
                <TableCell key={column}>
                  {formatCellValue(row[column])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
