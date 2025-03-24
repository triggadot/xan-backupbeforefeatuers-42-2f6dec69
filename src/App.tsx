import { Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import TableDemo from '@/pages/TableDemo';
import SidebarDemo from '@/pages/SidebarDemo';
import Accounts from '@/pages/Accounts';
import AccountDetail from '@/pages/AccountDetail';
import Sync from '@/pages/Sync';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import MappingView from '@/pages/MappingView';
import Invoices from '@/pages/Invoices';
import InvoiceDetail from '@/pages/InvoiceDetail';
import EditInvoice from '@/pages/EditInvoice';
import PurchaseOrders from '@/pages/PurchaseOrders';
import PurchaseOrderDetail from '@/pages/PurchaseOrderDetail';
import Estimates from '@/pages/Estimates';
import DataManagement from '@/pages/DataManagement';
import Index from '@/pages/Index';
import NewAccounts from '@/pages/NewAccounts';
import NewAccountDetail from '@/pages/NewAccountDetail';
import ErrorBoundary from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Index />} />
          <Route 
            path="dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="products" 
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="accounts" 
            element={
              <ProtectedRoute>
                <Accounts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="accounts/:id" 
            element={
              <ProtectedRoute>
                <AccountDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="new/accounts" 
            element={
              <ProtectedRoute>
                <NewAccounts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="new/accounts/:id" 
            element={
              <ProtectedRoute>
                <NewAccountDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="invoices" 
            element={
              <ProtectedRoute>
                <Invoices />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="invoices/:id" 
            element={
              <ProtectedRoute>
                <InvoiceDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="invoices/:id/edit" 
            element={
              <ProtectedRoute>
                <EditInvoice />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="purchase-orders" 
            element={
              <ProtectedRoute>
                <PurchaseOrders />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="purchase-orders/:id" 
            element={
              <ProtectedRoute>
                <PurchaseOrderDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="estimates" 
            element={
              <ProtectedRoute>
                <Estimates />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="data-management" 
            element={
              <ProtectedRoute>
                <DataManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* Sync Routes - Most specific routes first */}
          <Route path="sync">
            {/* This nesting ensures all /sync/* paths are handled correctly */}
            <Route 
              path="mapping/:id" 
              element={
                <ProtectedRoute>
                  <MappingView />
                </ProtectedRoute>
              } 
            />
            <Route 
              path=":tab" 
              element={
                <ProtectedRoute>
                  <Sync />
                </ProtectedRoute>
              } 
            />
            <Route 
              index
              element={
                <ProtectedRoute>
                  <Sync />
                </ProtectedRoute>
              } 
            />
          </Route>
          
          <Route path="table-demo" element={<TableDemo />} />
          <Route path="sidebar-demo" element={<SidebarDemo />} />
          <Route path="auth" element={<Auth />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
