
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from 'react-router-dom';
import { SyncDashboard } from '@/components/sync/SyncDashboard';
import { MappingsManager } from '@/components/sync/MappingsManager';
import { ConnectionsManager } from '@/components/sync/ConnectionsManager';

const Sync: React.FC = () => {
  const { tab = 'dashboard' } = useParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<string>(tab);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Sync Management</h1>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="mappings">Mappings</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <SyncDashboard />
        </TabsContent>
        
        <TabsContent value="mappings">
          <MappingsManager />
        </TabsContent>
        
        <TabsContent value="connections">
          <ConnectionsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Sync;
