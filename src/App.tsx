import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/layout/Layout';
import { Toaster } from "@/components/ui/toaster";
import Auth from '@/pages/Auth';
import DataManagement from '@/pages/DataManagement';
import Index from '@/pages/Index';
import MappingView from '@/pages/MappingView';
import ModernDashboard from '@/pages/ModernDashboard';
import NotFound from '@/pages/NotFound';
import ResponsiveExamples from '@/pages/ResponsiveExamples';
import SidebarDemo from '@/pages/SidebarDemo';
import Sync from '@/pages/Sync';
import TableDemo from '@/pages/TableDemo';

// Import our pages
import AccountDetail from '@/pages/AccountDetail';
import AccountOverview from '@/pages/AccountOverview';
import Accounts from '@/pages/Accounts';
import ExpensesPage from '@/pages/expenses';
import ExpenseDetailPage from '@/pages/expenses/[id]';
import EditExpensePage from '@/pages/expenses/[id]/edit';
import CreateExpensePage from '@/pages/expenses/new';
import EstimateDetailPage from '@/pages/new/EstimateDetail';
import NewEstimates from '@/pages/new/Estimates';
import InvoiceDetailPage from '@/pages/new/InvoiceDetail';
import NewInvoices from '@/pages/new/Invoices';
import ProductsPage from '@/pages/new/Products';
import ProductDetailPage from '@/pages/new/ProductDetail';
import PurchaseOrderDetailPage from '@/pages/new/PurchaseOrderDetail';
import NewPurchaseOrders from '@/pages/new/PurchaseOrders';
import UnpaidInventoryPage from '@/pages/products/UnpaidInventory';

// Import our new card-based invoice pages
import InvoiceCardPage from '@/pages/invoices/InvoiceCardPage';
import InvoiceCardDetailPage from '@/pages/invoices/InvoiceCardDetailPage';
import { Route, Routes } from 'react-router-dom';

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
            path="responsive-examples" 
            element={<ResponsiveExamples />} 
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
            path="account-overview/:accountId" 
            element={
              <ProtectedRoute>
                <AccountOverview />
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
            path="invoice-cards" 
            element={
              <ProtectedRoute>
                <InvoiceCardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="invoice-cards/:id" 
            element={
              <ProtectedRoute>
                <InvoiceCardDetailPage />
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
            path="products" 
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="products/:id" 
            element={
              <ProtectedRoute>
                <ProductDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="products/new" 
            element={
              <ProtectedRoute>
                <PlaceholderPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="unpaid-inventory" 
            element={
              <ProtectedRoute>
                <UnpaidInventoryPage />
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
            path="expenses" 
            element={
              <ProtectedRoute>
                <ExpensesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="expenses/new" 
            element={
              <ProtectedRoute>
                <CreateExpensePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="expenses/:id" 
            element={
              <ProtectedRoute>
                <ExpenseDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="expenses/:id/edit" 
            element={
              <ProtectedRoute>
                <EditExpensePage />
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
