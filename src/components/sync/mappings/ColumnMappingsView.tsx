
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GlColumnMapping, GlMapping } from '@/types/glsync';
import { Card, CardContent } from '@/components/ui/card';

export interface ColumnMappingsViewProps {
  mapping: GlMapping;
  columnMappings: Record<string, GlColumnMapping>;
  onMappingUpdate: () => Promise<void>;
  glideTable?: string;
  supabaseTable?: string;
}

export const ColumnMappingsView: React.FC<ColumnMappingsViewProps> = ({
  mapping,
  columnMappings,
  onMappingUpdate,
  glideTable,
  supabaseTable
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMappings, setEditedMappings] = useState<Record<string, GlColumnMapping>>(columnMappings);

  return (
    <div className="space-y-4">
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
    </div>
  );
};
