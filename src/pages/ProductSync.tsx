
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { GlMapping } from '@/types/glsync';
import { MappingDetailsCard } from '@/components/sync/MappingDetailsCard';
import { SyncErrorDisplay } from '@/components/sync/SyncErrorDisplay';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useGlSyncErrors } from '@/hooks/useGlSyncErrors';

interface ProductSyncProps {}

const ProductSync: React.FC<ProductSyncProps> = () => {
  const { mappingId = '' } = useParams<{ mappingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { syncErrors, refreshErrors } = useGlSyncErrors(mappingId);
  
  const [hasRowIdMapping, setHasRowIdMapping] = useState(false);

  const { 
    data: mapping, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['glsync-mapping', mappingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gl_mappings')
        .select('*')
        .eq('id', mappingId)
        .single();
      
      if (error) throw error;
      // Explicitly cast the column_mappings field to the expected type
      return {
        ...data,
        column_mappings: data.column_mappings as unknown as Record<string, { 
          glide_column_name: string;
          supabase_column_name: string;
          data_type: 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address';
        }>
      } as GlMapping;
    },
    enabled: !!mappingId && mappingId !== ':mappingId',
    meta: {
      onError: (error: any) => {
        console.error('Error fetching mapping:', error);
        toast({
          title: 'Error fetching mapping',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  });

  const { data: connection, isLoading: isConnectionLoading } = useQuery({
    queryKey: ['glsync-connection', mapping?.connection_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gl_connections')
        .select('*')
        .eq('id', mapping?.connection_id!)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!mapping?.connection_id,
    meta: {
      onError: (error: any) => {
        console.error('Error fetching connection:', error);
        toast({
          title: 'Error fetching connection',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  });

  useEffect(() => {
    if (mappingId && mappingId !== ':mappingId') {
      console.log('Fetching mapping with ID:', mappingId);
      refetch();
    }
  }, [mappingId, refetch]);

  // Check if the mapping has $rowID explicitly mapped
  useEffect(() => {
    if (mapping) {
      // Check if there's a direct mapping from $rowID to glide_row_id
      const hasExplicitRowIdMapping = Object.entries(mapping.column_mappings).some(
        ([glideColumnId, mapping]) => glideColumnId === '$rowID' && mapping.supabase_column_name === 'glide_row_id'
      );
      
      setHasRowIdMapping(hasExplicitRowIdMapping);
    }
  }, [mapping]);

  const handleBackClick = () => {
    navigate('/sync');
  };

  const handleSyncComplete = () => {
    refetch();
    refreshErrors();
  };

  if (!mappingId || mappingId === ':mappingId') {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p>Invalid mapping ID. Please select a valid mapping.</p>
            <Button variant="outline" onClick={handleBackClick} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sync
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || isConnectionLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-5 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!mapping || !connection) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <p>Mapping not found.</p>
            <Button variant="outline" onClick={handleBackClick} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sync
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Button variant="ghost" onClick={handleBackClick}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sync
        </Button>
      </div>

      {!hasRowIdMapping && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Row ID Mapping Missing</AlertTitle>
          <AlertDescription>
            No explicit mapping from Glide's <code>$rowID</code> to <code>glide_row_id</code> is defined. 
            The system will automatically use <code>$rowID</code>, but for clarity, consider adding this mapping.
          </AlertDescription>
        </Alert>
      )}

      <MappingDetailsCard 
        mapping={mapping} 
        connectionName={connection?.app_name}
        onSyncComplete={handleSyncComplete}
      />

      <Tabs defaultValue="errors" className="mt-4">
        <TabsList>
          <TabsTrigger value="errors">Sync Errors</TabsTrigger>
          <TabsTrigger value="column-mapping">Column Mapping</TabsTrigger>
        </TabsList>
        <TabsContent value="errors">
          <div className="mt-4">
            {syncErrors.length > 0 ? (
              <SyncErrorDisplay syncErrors={syncErrors} onRefresh={refreshErrors} />
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
    </div>
  );
};

export default ProductSync;
