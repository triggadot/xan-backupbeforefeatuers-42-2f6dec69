
import React from 'react';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GlMapping } from '@/types/glsync';
import { AlertCircle } from 'lucide-react';

interface ColumnMappingsViewProps {
  mapping: GlMapping | null;
  error?: string;
}

export function ColumnMappingsView({ mapping, error }: ColumnMappingsViewProps) {
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardDescription className="flex items-center text-red-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 text-center text-muted-foreground">
            Unable to display column mappings due to an error.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mapping || !mapping.column_mappings) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-4 text-center text-muted-foreground">
            No column mappings data available.
          </div>
        </CardContent>
      </Card>
    );
  }

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
              Object.entries(mapping.column_mappings).map(([key, columnMapping]) => (
                <TableRow key={key}>
                  <TableCell>{columnMapping.glide_column_name}</TableCell>
                  <TableCell>{columnMapping.supabase_column_name}</TableCell>
                  <TableCell>{columnMapping.data_type}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
