
import { useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import SyncLayout from '@/components/sync/SyncLayout';
import SyncDashboard from '@/components/sync/SyncDashboard';
import ConnectionsManager from '@/components/sync/ConnectionsManager';
import MappingsManager from '@/components/sync/MappingsManager';
import SyncLogs from '@/components/sync/SyncLogs';

// Valid tab values for sync
const VALID_TABS = ['dashboard', 'connections', 'mappings', 'logs'];

const Sync = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tab } = useParams();
  
  useEffect(() => {
    // Simple redirection logic for base routes
    if (location.pathname === '/sync' || location.pathname === '/sync/') {
      navigate('/sync/dashboard', { replace: true });
    } else if (tab && !VALID_TABS.includes(tab)) {
      navigate('/sync/dashboard', { replace: true });
    }
  }, [location.pathname, tab, navigate]);

  const renderContent = () => {
    // If we're on the base route and not redirecting yet, show dashboard
    if ((location.pathname === '/sync' || location.pathname === '/sync/') && !tab) {
      return <SyncDashboard />;
    }
    
    // Use tab parameter to determine which component to render
    const currentTab = tab && VALID_TABS.includes(tab) ? tab : 'dashboard';
    
    switch (currentTab) {
      case 'connections':
        return <ConnectionsManager />;
      case 'mappings':
        return <MappingsManager />;
      case 'logs':
        return <SyncLogs />;
      case 'dashboard':
      default:
        return <SyncDashboard />;
    }
  };

  return (
    <SyncLayout>
      {renderContent()}
    </SyncLayout>
  );
};

export default Sync;
