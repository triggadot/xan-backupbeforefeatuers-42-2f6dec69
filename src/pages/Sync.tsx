
import { useEffect, useState, Suspense, lazy } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import SyncContainer from '@/components/sync/SyncContainer';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from '@/components/ui/spinner';

// Lazy load the components for better performance 
const SyncDashboard = lazy(() => import('@/components/sync/SyncDashboard'));
const ConnectionsManager = lazy(() => import('@/components/sync/ConnectionsManager'));
const MappingsManager = lazy(() => import('@/components/sync/MappingsManager'));
const SyncLogs = lazy(() => import('@/components/sync/SyncLogs'));

// Valid tab values for sync
const VALID_TABS = ['dashboard', 'connections', 'mappings', 'logs'];

const Sync = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tab } = useParams();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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

  // Simulate loading for a smoother transition
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [tab]);

  const renderContent = () => {
    // If we're on the base route and not redirecting yet, show dashboard
    if ((location.pathname === '/sync' || location.pathname === '/sync/') && !tab) {
      return <SyncDashboard />;
    }
    
    // Use tab parameter to determine which component to render
    const currentTab = tab && VALID_TABS.includes(tab) ? tab : 'dashboard';
    
    // Exit animation when switching tabs
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Suspense fallback={
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          }>
            {(() => {
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
            })()}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <SyncContainer>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : (
          renderContent()
        )}
      </SyncContainer>
    </div>
  );
};

export default Sync;
