import React from 'react';
import { PDFFailuresManager } from '@/components/new/pdf/pdf-failures-manager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileText, RefreshCw, Play } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Admin page for PDF management
 */
export default function PDFManagementPage() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanError, setScanError] = React.useState<string | null>(null);

  // Handle manual scan for missing PDFs
  const handleScanForMissingPDFs = async (forceRegenerate = false) => {
    setIsScanning(true);
    setScanError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('pdf-backend', {
        body: {
          action: 'scan',
          forceRegenerate,
          overwriteExisting: true,
          batchSize: 50
        }
      });
      
      if (error) {
        throw new Error(`Error scanning for missing PDFs: ${error.message}`);
      }
      
      toast({
        title: 'Scan Complete',
        description: `Generated ${data.successful} PDFs with ${data.failed} failures.`,
        variant: 'default',
      });
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Unknown error');
      toast({
        title: 'Scan Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">PDF Management</h1>
      </div>

      <Tabs defaultValue="failures" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="failures">Failure Management</TabsTrigger>
          <TabsTrigger value="actions">PDF Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="failures" className="space-y-4">
          <PDFFailuresManager />
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PDF Generation Actions</CardTitle>
              <CardDescription>
                Trigger manual PDF generation actions and processes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scanError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{scanError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Scan for Missing PDFs</CardTitle>
                    <CardDescription>
                      Find documents with null PDF URLs and generate them
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => handleScanForMissingPDFs(false)} 
                      disabled={isScanning}
                      className="w-full"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Scan for Missing PDFs
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Force Regenerate All PDFs</CardTitle>
                    <CardDescription>
                      Regenerate PDFs for all documents even if they already have URLs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => handleScanForMissingPDFs(true)} 
                      disabled={isScanning}
                      variant="outline"
                      className="w-full"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Force Regenerate All
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="p-4 bg-gray-50 rounded-md text-sm">
                <h3 className="font-medium mb-2">Automatic Processes</h3>
                <p className="text-gray-500 mb-2">
                  The system automatically runs the following scheduled processes:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-500">
                  <li>Every 30 minutes: Scan for documents with null PDF URLs</li>
                  <li>Every 10 minutes: Process retry of failed PDF generations</li>
                  <li>Every day at midnight: Clean up resolved failures older than 30 days</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
