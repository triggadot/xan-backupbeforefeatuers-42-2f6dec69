import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, RefreshCw } from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { useTableData } from '@/hooks/useTableData';
import TableRecordDialog from '@/components/data-management/TableRecordDialog';
import { ColumnDef } from '@/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';

// Define a type for record with unknown structure but with an id
type TableRecord = Record<string, unknown> & { id: string };

interface TableDataViewProps {
  tableName: string;
  displayName: string;
  description?: string;
}

export default function TableDataView({ 
  tableName, 
  displayName,
  description
}: TableDataViewProps) {
  const { 
    data, 
    isLoading, 
    error, 
    fetchData, 
    createRecord, 
    updateRecord, 
    deleteRecord 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useTableData<TableRecord>(tableName as any);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<TableRecord | null>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dynamically generate columns from the first record or empty state
  const columns = useMemo<ColumnDef[]>(() => {
    if (data.length === 0) {
      return [
        { id: 'id', header: 'ID', accessorKey: 'id' },
        { id: 'empty', header: 'No Data', accessorKey: 'empty' }
      ];
    }

    const record = data[0];
    return Object.keys(record).map(key => ({
      id: key,
      header: key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      accessorKey: key,
      // Format date fields and limit text length
      cell: (row: TableRecord) => {
        const value = row[key];
        if (!value) return '--';
        
        // Format dates
        if (typeof value === 'string' && (
          key.includes('date') || 
          key.includes('created_at') || 
          key.includes('updated_at')
        )) {
          try {
            return new Date(value).toLocaleString();
          } catch {
            return value;
          }
        }
        
        // Truncate long text fields
        if (typeof value === 'string' && value.length > 50) {
          return `${value.substring(0, 47)}...`;
        }
        
        // Handle JSON objects
        if (typeof value === 'object' && value !== null) {
          return 'JSON data';
        }
        
        return String(value);
      }
    }));
  }, [data]);

  const handleCreate = async (values: Record<string, unknown>) => {
    await createRecord(values);
    setIsCreateDialogOpen(false);
  };

  const handleUpdate = async (values: Record<string, unknown>) => {
    if (currentRecord?.id) {
      await updateRecord(currentRecord.id, values);
      setIsEditDialogOpen(false);
      setCurrentRecord(null);
    }
  };

  const handleEdit = (record: TableRecord) => {
    setCurrentRecord(record);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (record: TableRecord) => {
    if (confirm(`Are you sure you want to delete this ${displayName}?`)) {
      await deleteRecord(record.id);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">{displayName}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" /> 
            New {displayName}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            Error: {error}
          </div>
        ) : (
          <DataTable
            data={data}
            columns={columns}
            title=""
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </CardContent>

      {/* Create Dialog */}
      <TableRecordDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title={`Create New ${displayName}`}
        record={{}}
        fields={columns}
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
      <TableRecordDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title={`Edit ${displayName}`}
        record={currentRecord || {}}
        fields={columns}
        onSubmit={handleUpdate}
      />
    </Card>
  );
}
