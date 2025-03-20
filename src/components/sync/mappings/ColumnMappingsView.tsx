
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GlMapping } from '@/types/glsync';

interface ColumnMappingsViewProps {
  mapping: GlMapping;
}

export function ColumnMappingsView({ mapping }: ColumnMappingsViewProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Glide Column</TableHead>
              <TableHead>Supabase Column</TableHead>
              <TableHead>Data Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(mapping.column_mappings).length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  No column mappings defined for this table.
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(mapping.column_mappings).map(([key, mapping]) => (
                <TableRow key={key}>
                  <TableCell>{mapping.glide_column_name}</TableCell>
                  <TableCell>{mapping.supabase_column_name}</TableCell>
                  <TableCell>{mapping.data_type}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
