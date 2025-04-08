import { Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ModernDashboard from '@/pages/ModernDashboard';
import Products from '@/pages/Products';
import TableDemo from '@/pages/TableDemo';
import SidebarDemo from '@/pages/SidebarDemo';
// Temporarily comment out imports for pages we'll rebuild
// import Accounts from '@/pages/Accounts';
// import AccountDetail from '@/pages/AccountDetail';
import Sync from '@/pages/Sync';
import Auth from '@/pages/Auth';
import NotFound from '@/pages/NotFound';
import MappingView from '@/pages/MappingView';
// import Invoices from '@/pages/Invoices';
// import InvoiceDetail from '@/pages/InvoiceDetail';
// import EditInvoice from '@/pages/EditInvoice';
// import PurchaseOrders from '@/pages/PurchaseOrders';
// import PurchaseOrderDetail from '@/pages/PurchaseOrderDetail';
// import Estimates from '@/pages/Estimates';
// import EstimateDetail from '@/pages/EstimateDetail';
import DataManagement from '@/pages/DataManagement';
import DataTables from '@/pages/DataTables';
import Index from '@/pages/Index';
import ErrorBoundary from '@/components/ErrorBoundary';

// Import our new pages
import NewInvoices from '@/pages/new/Invoices';
import InvoiceDetailPage from '@/pages/new/InvoiceDetail';
import NewEstimates from '@/pages/new/Estimates';
import EstimateDetailPage from '@/pages/new/EstimateDetail';
import NewPurchaseOrders from '@/pages/new/PurchaseOrders';
import PurchaseOrderDetailPage from '@/pages/new/PurchaseOrderDetail';
import Accounts from '@/pages/Accounts';
import AccountDetail from '@/pages/AccountDetail';

// Temporary placeholder component until we rebuild the pages
const PlaceholderPage = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
      <p className="text-gray-500">This page is being redesigned with improved UI/UX.</p>
    </div>
  </div>
);

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
                <ModernDashboard />
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
            path="data-tables" 
            element={
              <ProtectedRoute>
                <DataTables />
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
            path="accounts/:id/edit" 
            element={
              <ProtectedRoute>
                <AccountDetail isEditing={true} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="invoices" 
            element={
              <ProtectedRoute>
                <NewInvoices />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="invoices/:id" 
            element={
              <ProtectedRoute>
                <InvoiceDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="invoices/:id/edit" 
            element={
              <ProtectedRoute>
                <PlaceholderPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="purchase-orders" 
            element={
              <ProtectedRoute>
                <NewPurchaseOrders />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="purchase-orders/:id" 
            element={
              <ProtectedRoute>
                <PurchaseOrderDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="purchase-orders/new" 
            element={
              <ProtectedRoute>
                <PlaceholderPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="purchase-orders/:id/edit" 
            element={
              <ProtectedRoute>
                <PlaceholderPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="estimates" 
            element={
              <ProtectedRoute>
                <NewEstimates />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="estimates/:id" 
            element={
              <ProtectedRoute>
                <EstimateDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="estimates/new" 
            element={
              <ProtectedRoute>
                <PlaceholderPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="estimates/:id/edit" 
            element={
              <ProtectedRoute>
                <PlaceholderPage />
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
          
          <Route path="sync">
            <Route 
              path="mapping/:id" 
              element={
                <ProtectedRoute>
                  <MappingView />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="mappings/:id" 
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
