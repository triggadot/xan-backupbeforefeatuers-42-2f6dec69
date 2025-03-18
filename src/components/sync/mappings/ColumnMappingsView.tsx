
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GlMapping } from '@/types/glsync';

interface ColumnMappingsViewProps {
  mapping: GlMapping;
}

export function ColumnMappingsView({ mapping }: ColumnMappingsViewProps) {
  const dataTypeLabels: Record<string, string> = {
    'string': 'Text',
    'number': 'Number',
    'boolean': 'Boolean',
    'date-time': 'Date/Time',
    'image-uri': 'Image URL',
    'email-address': 'Email',
  };

  const columnMappings = Object.entries(mapping.column_mappings || {}).map(
    ([glideColumnId, mappingData]) => ({
      glideColumnId,
      glideColumnName: mappingData.glide_column_name,
      supabaseColumnName: mappingData.supabase_column_name,
      dataType: mappingData.data_type,
    })
  );

  const hasRowIdMapping = columnMappings.some(
    (mapping) => mapping.glideColumnId === '$rowID' && mapping.supabaseColumnName === 'glide_row_id'
  );

  return (
    <div className="space-y-4">
      {!hasRowIdMapping && (
        <div className="p-4 border rounded-md bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <p className="text-sm font-medium">No explicit Row ID mapping found</p>
          <p className="text-sm mt-1">
            This mapping doesn't have an explicit mapping from Glide's <code>$rowID</code> to <code>glide_row_id</code>.
            The system will handle this automatically, but for clarity, consider adding this mapping.
          </p>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Glide Column ID</TableHead>
              <TableHead>Glide Column Name</TableHead>
              <TableHead>Supabase Column</TableHead>
              <TableHead>Data Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {columnMappings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No column mappings defined
                </TableCell>
              </TableRow>
            ) : (
              columnMappings.map((mapping) => (
                <TableRow key={mapping.glideColumnId} className={mapping.glideColumnId === '$rowID' ? 'bg-muted/50' : ''}>
                  <TableCell className="font-mono text-sm">
                    {mapping.glideColumnId}
                    {mapping.glideColumnId === '$rowID' && (
                      <Badge variant="outline" className="ml-2">System Column</Badge>
                    )}
                  </TableCell>
                  <TableCell>{mapping.glideColumnName}</TableCell>
                  <TableCell className="font-mono text-sm">{mapping.supabaseColumnName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {dataTypeLabels[mapping.dataType] || mapping.dataType}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
