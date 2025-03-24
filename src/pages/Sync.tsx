
import { useEffect } from 'react';
import { useNavigate, useParams, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import SyncLayout from '@/components/sync/SyncLayout';
import SyncDashboard from '@/components/sync/SyncDashboard';
import ConnectionsManager from '@/components/sync/ConnectionsManager';
import MappingsManager from '@/components/sync/MappingsManager';
import MappingDetails from './MappingDetails';
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

  return (
    <SyncLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/sync/dashboard" replace />} />
        <Route path="dashboard" element={<SyncDashboard />} />
        <Route path="connections" element={<ConnectionsManager />} />
        <Route path="mappings" element={<MappingsManager />} />
        <Route path="mappings/:id" element={<MappingDetails />} />
        <Route path="logs" element={<SyncLogs />} />
        <Route path="*" element={<Navigate to="/sync/dashboard" replace />} />
      </Routes>
    </SyncLayout>
  );
};

export default Sync;
