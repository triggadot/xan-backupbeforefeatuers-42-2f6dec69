import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Sync from '@/pages/Sync';
import ProductSync from '@/pages/ProductSync';
import MappingView from '@/pages/MappingView';
import DataManagement from '@/pages/DataManagement';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster as ToastComponent } from '@/components/ui/toaster';


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
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="glide-sync-theme">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="sync" element={<Sync />}>
                  <Route index element={<Sync />} />
                  <Route path=":tab" element={<Sync />} />
                </Route>
                <Route path="sync/products/:mappingId" element={<ProductSync />} />
                <Route path="sync/mappings/:mappingId" element={<MappingView />} />
                <Route path="data-management" element={<DataManagement />} />
                
                {/* Accounts Routes */}
                <Route path="accounts" element={<Accounts />} />
                <Route path="accounts/:id" element={<AccountDetail />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <ToastComponent />
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
