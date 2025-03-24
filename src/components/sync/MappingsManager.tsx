import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, TableProperties, Link, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MappingsList } from './mappings/MappingsList';
import { MappingDetails } from './mappings/MappingDetails';
import { GlMapping } from '@/types/glsync';
import { useRealtimeMappings } from '@/hooks/useRealtimeMappings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditTableButton } from './mappings/EditTableButton';
import { CreateTableForm } from './mappings/CreateTableForm';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseTables } from '@/hooks/useSupabaseTables';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SupabaseTableSelector } from './mappings/SupabaseTableSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SyncContainer from './SyncContainer';

const MappingsManager = () => {
  // State declarations
  const [selectedMapping, setSelectedMapping] = useState<GlMapping | null>(null);
  const [activeTab, setActiveTab] = useState('mappings');
  const [showCreateTableDialog, setShowCreateTableDialog] = useState(false);
  
  // Hooks
  const navigate = useNavigate();
  const { refreshMappings } = useRealtimeMappings();
  const { toast } = useToast();
  const { tables: supabaseTables, fetchTables, isLoading: isLoadingTables } = useSupabaseTables();
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const mappingIdFromUrl = urlParams.get('id');

  // Event handlers
  const handleViewMapping = (mapping: GlMapping) => {
    setSelectedMapping(mapping);
    navigate(`/sync/mappings?id=${mapping.id}`);
  };

  const handleBackToList = () => {
    setSelectedMapping(null);
    navigate('/sync/mappings');
  };

  const handleTableCreated = (tableName: string) => {
    setShowCreateTableDialog(false);
    fetchTables();
    toast({
      title: 'Table Created',
      description: `Table ${tableName} has been created successfully.`
    });
  };

  const handleTableUpdated = () => {
    fetchTables();
    toast({
      title: 'Success',
      description: 'Table schema has been updated.'
    });
  };

  // Effects
  useEffect(() => {
    // Initially fetch tables when component mounts
    fetchTables();
  }, [fetchTables]);

  // Render helpers
  const renderTableManagement = () => (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Table</CardTitle>
          <CardDescription>
            Create a new Supabase table for Glide integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full"
            onClick={() => setShowCreateTableDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Table
          </Button>
          
          <Dialog open={showCreateTableDialog} onOpenChange={setShowCreateTableDialog}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Supabase Table</DialogTitle>
              </DialogHeader>
              <CreateTableForm 
                onTableCreated={handleTableCreated}
                onCancel={() => setShowCreateTableDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Existing Tables</CardTitle>
          <CardDescription>
            View and modify existing Supabase tables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <SupabaseTableSelector
              tables={supabaseTables}
              value=""
              onTableChange={(tableName) => {
                console.log(`Selected table: ${tableName}`);
              }}
              filterPrefix="gl_"
              isLoading={isLoadingTables}
              placeholder="Select a table to view"
            />
            
            <EditTableButton onTableUpdated={handleTableUpdated} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Return/render component
  if (selectedMapping || mappingIdFromUrl) {
    return (
      <MappingDetails 
        mappingId={selectedMapping?.id || mappingIdFromUrl!} 
        onBack={handleBackToList}
      />
    );
  }

  return (
    <SyncContainer>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Data Integration</h2>
        <Button variant="outline" onClick={refreshMappings}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full">
          <TabsTrigger value="mappings" className="flex-1">
            <Link className="h-4 w-4 mr-2" />
            Table Mappings
          </TabsTrigger>
          <TabsTrigger value="table-management" className="flex-1">
            <TableProperties className="h-4 w-4 mr-2" />
            Table Management
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="mappings" className="space-y-4">
          <MappingsList onEdit={handleViewMapping} />
        </TabsContent>
        
        <TabsContent value="table-management" className="space-y-6">
          {renderTableManagement()}
        </TabsContent>
      </Tabs>
    </SyncContainer>
  );
};

export default MappingsManager;
