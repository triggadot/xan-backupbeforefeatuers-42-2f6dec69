
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GlMapping } from '@/types/glsync';
import { Badge } from '@/components/ui/badge';

interface ColumnMappingsViewProps {
  mapping: GlMapping;
}

export function ColumnMappingsView({ mapping }: ColumnMappingsViewProps) {
  // Prepare a representation of column mappings for visualization
  const columnMappingsList = Object.entries(mapping.column_mappings).map(([key, value]) => ({
    glideColumnId: key,
    ...value
  }));

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Glide Column</TableHead>
            <TableHead>Supabase Column</TableHead>
            <TableHead>Data Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {columnMappingsList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                No column mappings defined
              </TableCell>
            </TableRow>
          ) : (
            columnMappingsList.map((mapping, index) => (
              <TableRow key={index}>
                <TableCell>
                  {mapping.glideColumnId === '$rowID' ? (
                    <div className="flex items-center gap-2">
                      <span>{mapping.glide_column_name}</span>
                      <Badge variant="outline" className="text-xs">Row ID</Badge>
                    </div>
                  ) : (
                    mapping.glide_column_name
                  )}
                </TableCell>
                <TableCell>{mapping.supabase_column_name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {mapping.data_type}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
