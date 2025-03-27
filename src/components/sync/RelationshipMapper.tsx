
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { glSyncApi } from '@/services/glSyncApi';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function RelationshipMapper() {
  const [isMapping, setIsMapping] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleMapAllRelationships = async () => {
    setIsMapping(true);
    try {
      const response = await glSyncApi.mapAllRelationships();
      
      if (response.success) {
        setResult(response.result);
        toast({
          title: 'Success',
          description: `Mapped ${response.result?.total_mapped || 0} relationships across all tables.`,
        });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to map relationships',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error mapping relationships:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsMapping(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Relationship Mapper</CardTitle>
        <CardDescription>
          Map relationships between tables based on rowid_ and glide_row_id fields
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This tool will analyze all tables with rowid_ columns and update the corresponding sb_ columns 
          with the proper UUID relationships. Use this when you notice missing relationships in your data.
        </p>
        
        {result && (
          <Alert className="mb-4">
            <AlertTitle>Mapping Results</AlertTitle>
            <AlertDescription>
              <div className="text-sm">
                <p><strong>Total Mapped:</strong> {result.total_mapped}</p>
                <p><strong>Tables Processed:</strong></p>
                <ul className="list-disc pl-5 mt-2">
                  {Object.entries(result.tables_processed || {}).map(([table, count]: [string, any]) => (
                    <li key={table}>
                      {table}: {count} relationships
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleMapAllRelationships} 
          disabled={isMapping}
          className="w-full"
        >
          {isMapping ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mapping Relationships...
            </>
          ) : (
            'Map All Relationships'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
