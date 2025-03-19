
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Save } from 'lucide-react';
import { GlMapping } from '@/types/glsync';
import { QueryObserverResult } from '@tanstack/react-query';

export interface ColumnMappingsViewProps {
  mapping: GlMapping;
  onSave?: () => Promise<QueryObserverResult<GlMapping, Error>>;
}

const ColumnMappingsView: React.FC<ColumnMappingsViewProps> = ({ mapping, onSave }) => {
  const columnMappings = typeof mapping.column_mappings === 'string' 
    ? JSON.parse(mapping.column_mappings) 
    : mapping.column_mappings;

  const handleSave = async () => {
    if (onSave) {
      await onSave();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md">Column Mappings</CardTitle>
        {onSave && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSave}
            className="ml-auto"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {Object.keys(columnMappings).length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Glide Column</TableHead>
                <TableHead>Supabase Column</TableHead>
                <TableHead>Data Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(columnMappings).map(([key, mapping]) => {
                const map = mapping as any;
                return (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{map.glide_column_name}</TableCell>
                    <TableCell>{map.supabase_column_name}</TableCell>
                    <TableCell>{map.data_type}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No column mappings configured.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ColumnMappingsView;
