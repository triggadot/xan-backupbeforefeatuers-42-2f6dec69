
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import SyncLayout from '@/components/sync/SyncLayout';
import SyncOverview from '@/components/sync/overview/SyncOverview';
import ConnectionsList from '@/components/sync/connections/ConnectionsList';
import MappingsList from '@/components/sync/mappings/MappingsList';
import MappingDetails from '@/components/sync/mappings/MappingDetails';
import SyncLogs from '@/components/sync/logs/SyncLogs';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="glide-sync-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              
              <Route path="sync" element={<SyncLayout />}>
                <Route index element={<SyncOverview />} />
                <Route path="connections" element={<ConnectionsList />} />
                <Route path="mappings" element={<MappingsList />} />
                <Route path="mappings/:id" element={<MappingDetails />} />
                <Route path="logs" element={<SyncLogs />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
