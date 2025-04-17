
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlSyncRecord, GlMapping } from '@/types/glide-sync/glsync';
import { SyncErrorDisplay } from './SyncErrorDisplay';

interface MappingTabsProps {
  mapping: GlMapping;
  syncErrors: GlSyncRecord[];
  hasRowIdMapping: boolean;
  onRefreshErrors: (includeResolved?: boolean) => Promise<void>;
}

export function MappingTabs({ mapping, syncErrors, hasRowIdMapping, onRefreshErrors }: MappingTabsProps) {
  return (
    <Tabs defaultValue="errors" className="mt-4">
      <TabsList>
        <TabsTrigger value="errors">Sync Errors</TabsTrigger>
        <TabsTrigger value="column-mapping">Column Mapping</TabsTrigger>
      </TabsList>
      <TabsContent value="errors">
        <div className="mt-4">
          {syncErrors.length > 0 ? (
            <SyncErrorDisplay syncErrors={syncErrors} onRefresh={onRefreshErrors} />
          ) : (
            <Card>
              <CardContent className="text-center p-6">
                No sync errors found.
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
      <TabsContent value="column-mapping">
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Column Mapping Details</CardTitle>
            <CardDescription>
              The mapping between Glide columns and Supabase fields.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-4">
                <p className="text-sm font-medium mb-2">Glide Row ID Mapping</p>
                <p className="text-sm text-muted-foreground">
                  Records from Glide are identified by their <code>$rowID</code> field, 
                  which is mapped to <code>glide_row_id</code> in Supabase. 
                  {!hasRowIdMapping && " This mapping is handled automatically."}
                </p>
              </div>
              
              <div className="border rounded-md">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Glide Column</th>
                      <th className="p-2 text-left">Supabase Column</th>
                      <th className="p-2 text-left">Data Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {!hasRowIdMapping && (
                      <tr className="bg-amber-50">
                        <td className="p-2 font-medium">$rowID (automatic)</td>
                        <td className="p-2">glide_row_id</td>
                        <td className="p-2">string</td>
                      </tr>
                    )}
                    {Object.entries(mapping.column_mappings).map(([glideCol, mappingObj]) => (
                      <tr key={glideCol} className="hover:bg-muted/50">
                        <td className="p-2">{mappingObj.glide_column_name} {glideCol === '$rowID' && '(ID)'}</td>
                        <td className="p-2">{mappingObj.supabase_column_name}</td>
                        <td className="p-2">{mappingObj.data_type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
