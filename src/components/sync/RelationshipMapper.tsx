
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { glSyncApi } from '@/services/glSyncApi';
import { Loader2 } from 'lucide-react';

export function RelationshipMapper() {
  const [isMapping, setIsMapping] = useState(false);
  const { toast } = useToast();

  const handleMapRelationships = async () => {
    setIsMapping(true);
    try {
      // Use the mapAllRelationships function from the hook
      const success = await glSyncApi.mapAllRelationships();
      
      if (success) {
        toast({
          title: 'Success',
          description: 'Relationships mapped successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to map relationships',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error mapping relationships:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while mapping relationships',
        variant: 'destructive',
      });
    } finally {
      setIsMapping(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Relationship Mapper</CardTitle>
        <CardDescription>
          Map relationships between tables in your database. This will automatically link Glide row IDs to Supabase IDs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This tool will scan all tables with rowid_ columns and map them to their corresponding Supabase IDs.
          It's useful when you want to ensure that your database relationships are properly established.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This process may take some time depending on the size of your database.
            It will not modify any existing data, only create or update relationship mappings.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleMapRelationships}
          disabled={isMapping}
        >
          {isMapping ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mapping Relationships...
            </>
          ) : (
            'Map Relationships'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
