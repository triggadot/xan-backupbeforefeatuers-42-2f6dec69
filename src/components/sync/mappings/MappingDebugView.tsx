
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlMapping } from '@/types/glsync';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ColumnMappingsView } from './ColumnMappingsView';

interface MappingDebugViewProps {
  mapping: GlMapping;
  onTestSync?: () => Promise<void>;
}

export function MappingDebugView({ mapping, onTestSync }: MappingDebugViewProps) {
  // Prepare a representation of column mappings for visualization
  const columnMappingsList = Object.entries(mapping.column_mappings).map(([key, value]) => ({
    glideColumnId: key,
    ...value
  }));

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-md">Mapping Configuration Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mappings">
          <TabsList>
            <TabsTrigger value="mappings">Column Mappings</TabsTrigger>
            <TabsTrigger value="json">Raw JSON</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mappings" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-2">
              This view shows how columns are mapped between Glide and Supabase.
            </div>
            
            <ColumnMappingsView 
              mapping={mapping} 
              columnMappings={mapping.column_mappings}
              onMappingUpdate={async () => onTestSync && await onTestSync()}
            />
            
            {onTestSync && (
              <Button 
                onClick={onTestSync} 
                className="mt-4"
              >
                Test Sync with this Mapping
              </Button>
            )}
          </TabsContent>
          
          <TabsContent value="json">
            <div className="text-sm text-muted-foreground mb-2">
              Raw JSON representation of the mapping configuration.
            </div>
            <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-auto text-xs">
              {JSON.stringify(mapping.column_mappings, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
