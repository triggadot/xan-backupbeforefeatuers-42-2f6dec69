
// Assuming this is part of the current file, we'll add the interface definition here
// and update the component implementation to make onBack optional and fix the refreshErrors call

import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProductMapping } from '@/hooks/useProductMapping';
import { useToast } from '@/hooks/use-toast';
import MappingForm from './MappingForm';
import ColumnMappingsView from './ColumnMappingsView';
import SyncDetailsPanel from './SyncDetailsPanel';
import { useGlSyncErrors } from '@/hooks/useGlSyncErrors';
import SyncErrorsList from './SyncErrorsList';
import { GlMapping } from '@/types/glsync';

export interface MappingDetailsProps {
  mappingId: string;
  onBack?: () => void; // Make onBack optional
}

const MappingDetails: React.FC<MappingDetailsProps> = ({ mappingId, onBack }) => {
  const { mapping, connection, isLoading, error, refetch } = useProductMapping(mappingId);
  const [activeTab, setActiveTab] = useState<string>('details');
  const { toast } = useToast();
  
  const { errors, isLoading: isErrorsLoading, refetch: refreshErrors } = useGlSyncErrors(mappingId);
  
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex justify-center items-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading mapping details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mapping) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center">
            <h2 className="text-lg font-medium">Mapping not found</h2>
            <p className="text-muted-foreground mt-2">
              The requested mapping could not be found or has been deleted.
            </p>
            {onBack && (
              <Button 
                onClick={onBack}
                variant="outline" 
                className="mt-4"
              >
                Back to Mappings
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack} 
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <h1 className="text-2xl font-bold">
            {mapping.glide_table_display_name} → {mapping.supabase_table}
          </h1>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            refetch();
            refreshErrors();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="columns">Column Mappings</TabsTrigger>
          <TabsTrigger value="errors">Sync Errors {errors?.length ? `(${errors.length})` : ''}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <MappingForm 
            mapping={mapping} 
            connection={connection}
            onSave={() => refetch()}
          />
          <SyncDetailsPanel mapping={mapping} />
        </TabsContent>
        
        <TabsContent value="columns">
          <ColumnMappingsView 
            mapping={mapping as GlMapping}
            onSave={() => refetch()}
          />
        </TabsContent>
        
        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Sync Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <SyncErrorsList 
                errors={errors || []} 
                isLoading={isErrorsLoading} 
                onResolve={() => refreshErrors()}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MappingDetails;
