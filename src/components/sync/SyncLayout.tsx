import React, { ReactNode, useEffect } from 'react';
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
  
  console.log('==== SyncLayout Debug Info ====');
  console.log('SyncLayout rendered with tab param:', tab);
  console.log('SyncLayout current path:', location.pathname);
  
  useEffect(() => {
    // Log when component mounts with current route info
    console.log('SyncLayout mounted with route params:', {
      pathname: location.pathname,
      tabParam: tab,
      validTab: tab ? VALID_TABS.includes(tab) : false
    });
  }, [location.pathname, tab]);
  
  // Determine which tab should be active
  let activeTab = 'dashboard'; // Default tab
  
  // First check if there's a valid tab parameter
  if (tab && VALID_TABS.includes(tab)) {
    activeTab = tab;
  } 
  // If not, try to determine from the pathname
  else if (location.pathname) {
    // Check each tab path
    for (const tabItem of tabs) {
      if (location.pathname === tabItem.path || 
          location.pathname === tabItem.path + '/') {
        activeTab = tabItem.id;
        break;
      }
    }
  }
  
  console.log('SyncLayout selected tab:', activeTab);
  
  const handleTabClick = (tabId: string) => {
    const targetTab = tabs.find(t => t.id === tabId);
    if (targetTab) {
      console.log('Navigating to tab:', targetTab.path);
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
