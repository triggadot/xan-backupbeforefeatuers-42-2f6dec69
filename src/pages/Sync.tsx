import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import SyncContainer from '@/components/sync/SyncContainer';
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
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  useEffect(() => {
    // Redirect if needed, but prevent infinite loops
    if (isRedirecting) return;
    
    try {
      if (location.pathname === '/sync' || location.pathname === '/sync/') {
        console.log('On base /sync route, redirecting to dashboard');
        setIsRedirecting(true);
        navigate('/sync/dashboard', { replace: true });
      } else if (tab && !VALID_TABS.includes(tab)) {
        console.log('Invalid tab found:', tab, 'redirecting to dashboard');
        setIsRedirecting(true);
        navigate('/sync/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [location.pathname, tab, navigate, isRedirecting]);

  // Reset redirecting state after navigation
  useEffect(() => {
    if (isRedirecting) {
      const timeout = setTimeout(() => {
        setIsRedirecting(false);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isRedirecting]);

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
    <div className="container mx-auto py-6">
      <SyncContainer>
        {renderContent()}
      </SyncContainer>
    </div>
  );
};

export default Sync;
