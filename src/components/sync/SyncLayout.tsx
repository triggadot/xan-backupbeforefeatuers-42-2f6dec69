
import React, { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

interface SyncLayoutProps {
  children: ReactNode;
}

interface SyncTab {
  id: string;
  label: string;
  path: string;
}

const tabs: SyncTab[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/sync/dashboard' },
  { id: 'connections', label: 'Connections', path: '/sync/connections' },
  { id: 'mappings', label: 'Mappings', path: '/sync/mappings' },
  { id: 'logs', label: 'Logs', path: '/sync/logs' }
];

// Valid tab values for sync
const VALID_TABS = ['dashboard', 'connections', 'mappings', 'logs'];

const SyncLayout: React.FC<SyncLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tab } = useParams();
  
  // Determine which tab should be active
  let activeTab = 'dashboard'; // Default tab
  
  if (tab && VALID_TABS.includes(tab)) {
    activeTab = tab;
  } else {
    // Try to determine from the pathname
    for (const tabItem of tabs) {
      if (location.pathname === tabItem.path || location.pathname === tabItem.path + '/') {
        activeTab = tabItem.id;
        break;
      }
    }
  }
  
  const handleTabClick = (tabId: string) => {
    const targetTab = tabs.find(t => t.id === tabId);
    if (targetTab) {
      navigate(targetTab.path);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Glide Sync</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor data synchronization between Glide and Supabase
          </p>
        </div>
      </div>

      <Tabs value={activeTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 max-w-2xl">
          {tabs.map(tab => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <div className="mt-4">
          {children}
        </div>
      </Tabs>
    </div>
  );
};

export default SyncLayout;
