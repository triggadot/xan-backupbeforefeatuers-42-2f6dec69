import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/toaster';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './index.css';
import { HelmetProvider } from 'react-helmet-async';

// Pages
import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import Accounts from './pages/Accounts';
import AccountDetail from './pages/AccountDetail';
import Invoices from './pages/Invoices';
import PurchaseOrders from './pages/PurchaseOrders';
import SyncLayout from './components/sync/SyncLayout';
import SyncOverview from './components/sync/overview/SyncOverview';
import ConnectionsList from './components/sync/connections/ConnectionsList';
import { MappingsList } from './components/sync/mappings/MappingsList';
import MappingDetails from './components/sync/mappings/MappingDetails';
import ProductSync from './pages/ProductSync';
import SyncLogs from './components/sync/SyncLogs';
import DataManagement from './pages/DataManagement';
import Products from './pages/Products';
import TableDemoPage from './pages/TableDemo';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

// Wrapper component for MappingsList that provides the onEdit prop
const MappingsListWrapper = () => {
  const navigate = useNavigate();
  
  const handleEditMapping = (mapping) => {
    navigate(`/sync/mappings/${mapping.id}`);
  };
  
  return <MappingsList onEdit={handleEditMapping} />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <HelmetProvider>
            <ThemeProvider defaultTheme="system" storageKey="ui-theme">
              <AuthProvider>
                <Routes>
                  <Route path="/" element={<App />}>
                    <Route index element={<Index />} />
                    <Route path="auth" element={<Auth />} />
                    
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }>
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="accounts" element={<Accounts />} />
                      <Route path="accounts/:id" element={<AccountDetail />} />
                      <Route path="invoices" element={<Invoices />} />
                      <Route path="purchase-orders" element={<PurchaseOrders />} />
                      <Route path="products" element={<Products />} />
                      <Route path="data-management" element={<DataManagement />} />
                      <Route path="table-demo" element={<TableDemoPage />} />
                      
                      <Route path="sync" element={<SyncLayout />}>
                        <Route index element={<SyncOverview />} />
                        <Route path="connections" element={<ConnectionsList />} />
                        <Route path="mappings" element={<MappingsListWrapper />} />
                        <Route path="mappings/:mappingId" element={<MappingDetails mappingId=":mappingId" />} />
                        <Route path="products/:mappingId" element={<ProductSync />} />
                        <Route path="logs" element={<SyncLogs />} />
                      </Route>
                    </Route>
                  
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
                <Toaster />
              </AuthProvider>
            </ThemeProvider>
          </HelmetProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
