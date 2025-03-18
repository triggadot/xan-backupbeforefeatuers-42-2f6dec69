
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { glSyncApi } from '@/services/glsync';
import { GlMapping, GlSyncRecord } from '@/types/glsync';
import MappingDetailsCard from '@/components/sync/MappingDetailsCard';
import SyncErrorDisplay from '@/components/sync/SyncErrorDisplay';
import { useToast } from '@/components/ui/use-toast';

interface ProductSyncProps {}

const ProductSync: React.FC<ProductSyncProps> = () => {
  const { mappingId = '' } = useParams<{ mappingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [syncErrors, setSyncErrors] = useState<GlSyncRecord[]>([]);

  const { 
    data: mapping, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['glsync-mapping', mappingId],
    queryFn: () => glSyncApi.getMapping(mappingId),
    enabled: !!mappingId && mappingId !== ':mappingId',
    meta: {
      onError: (error: any) => {
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
    queryFn: () => glSyncApi.getConnection(mapping?.connection_id!),
    enabled: !!mapping?.connection_id,
    meta: {
      onError: (error: any) => {
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
      refetch();
    }
  }, [mappingId, refetch]);

  const handleBackClick = () => {
    navigate('/sync');
  };

  const handleSyncComplete = () => {
    refetch();
    fetchSyncErrors();
  };

  const fetchSyncErrors = async () => {
    if (mappingId && mappingId !== ':mappingId') {
      try {
        const errors = await glSyncApi.getSyncErrors(mappingId);
        setSyncErrors(errors);
      } catch (error: any) {
        console.error('Error fetching sync errors:', error);
        toast({
          title: 'Error fetching sync errors',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  };

  useEffect(() => {
    if (mappingId && mappingId !== ':mappingId') {
      fetchSyncErrors();
    }
  }, [mappingId]);

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

      <MappingDetailsCard 
        mapping={mapping} 
        connectionName={connection.app_name}
        onSyncComplete={handleSyncComplete}
      />

      <Tabs defaultValue="errors" className="mt-4">
        <TabsList>
          <TabsTrigger value="errors">Sync Errors</TabsTrigger>
        </TabsList>
        <TabsContent value="errors">
          <div className="mt-4">
            {syncErrors.length > 0 ? (
              <SyncErrorDisplay syncErrors={syncErrors} onRefresh={fetchSyncErrors} />
            ) : (
              <Card>
                <CardContent className="text-center p-6">
                  No sync errors found.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductSync;
