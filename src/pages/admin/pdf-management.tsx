import React from 'react';
import { PDFFailuresManager } from '@/components/pdf/pdf-failures-manager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileText, RefreshCw, Play, BarChart, Filter } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@supabase/supabase-js';
import { usePDFMonitoring } from '@/hooks/usePDFMonitoring';
import { DocumentType } from '@/types/pdf-generation';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Admin page for PDF management
 */
// PDF Monitoring Dashboard Component
function PDFMonitoringDashboard() {
  const {
    stats,
    isLoading,
    error,
    timeRange,
    setTimeRange,
    documentTypeFilter,
    setDocumentTypeFilter,
    refresh
  } = usePDFMonitoring();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center items-center">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p>Loading PDF statistics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading PDF statistics: {error instanceof Error ? error.message : 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  // Function to render a stats card for a document type
  const renderStatsCard = (docType: DocumentType | 'overall', title: string) => {
    if (!stats) return null;
    
    const docStats = docType === 'overall' ? stats.overall : stats[docType];
    const coverageColor = docStats.pdfCoverage >= 90 ? 'bg-green-500' : 
                         docStats.pdfCoverage >= 70 ? 'bg-yellow-500' : 'bg-red-500';
    const successRateColor = docStats.recentGenerations.successRate >= 90 ? 'bg-green-500' : 
                            docStats.recentGenerations.successRate >= 70 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <Card className={docType === 'overall' ? 'border-primary' : ''}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{title}</CardTitle>
            {docType === 'overall' && (
              <Badge variant="outline" className="ml-2">Overall</Badge>
            )}
          </div>
          <CardDescription>
            {docStats.totalDocuments} total documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>PDF Coverage</span>
              <span className="font-medium">{docStats.pdfCoverage.toFixed(1)}%</span>
            </div>
            <Progress value={docStats.pdfCoverage} className={coverageColor} />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{docStats.documentsWithPDF} with PDF</span>
              <span>{docStats.documentsWithoutPDF} without PDF</span>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Recent Success Rate</span>
              <span className="font-medium">{docStats.recentGenerations.successRate.toFixed(1)}%</span>
            </div>
            <Progress value={docStats.recentGenerations.successRate} className={successRateColor} />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{docStats.recentGenerations.successful} successful</span>
              <span>{docStats.recentGenerations.failed} failed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>PDF Generation Statistics</CardTitle>
              <CardDescription>
                Monitor PDF generation coverage and success rates
              </CardDescription>
            </div>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <Select 
                  value={documentTypeFilter} 
                  onValueChange={(value) => setDocumentTypeFilter(value as any)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Document Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Document Types</SelectItem>
                    <SelectItem value={DocumentType.INVOICE}>Invoices</SelectItem>
                    <SelectItem value={DocumentType.ESTIMATE}>Estimates</SelectItem>
                    <SelectItem value={DocumentType.PURCHASE_ORDER}>Purchase Orders</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon" onClick={refresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderStatsCard('overall', 'All Documents')}
        {renderStatsCard(DocumentType.INVOICE, 'Invoices')}
        {renderStatsCard(DocumentType.ESTIMATE, 'Estimates')}
        {renderStatsCard(DocumentType.PURCHASE_ORDER, 'Purchase Orders')}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent PDF Generation Activity</CardTitle>
          <CardDescription>
            Showing most recent PDF generation events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats && stats.overall.recentGenerations.total > 0 ? (
            <div className="border rounded-md divide-y">
              {/* This would show actual log entries */}
              <div className="p-3 flex justify-between items-center bg-muted/50">
                <div className="font-medium">Document</div>
                <div className="font-medium">Status</div>
                <div className="font-medium">Timestamp</div>
              </div>
              {/* Sample log entries would be mapped here */}
              <div className="text-sm text-muted-foreground p-4 text-center">
                Detailed logs are available in the database
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No recent PDF generation activity in the selected time period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

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

      <Tabs defaultValue="monitoring" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="monitoring">Monitoring Dashboard</TabsTrigger>
          <TabsTrigger value="failures">Failure Management</TabsTrigger>
          <TabsTrigger value="actions">PDF Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-4">
          <PDFMonitoringDashboard />
        </TabsContent>

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
