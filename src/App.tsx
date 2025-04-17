import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  // Core pages
  Auth,
  Index,
  NotFound,
  
  // Dashboard pages
  ModernDashboard,
  DataManagement,
  Sync,
  
  // Demo pages
  ResponsiveExamples,
  TableDemo,
  SidebarDemo,
  
  // Account pages
  Accounts,
  AccountDetail,
  AccountOverview,
  
  // Expense pages
  ExpensesPage,
  CreateExpensePage,
  ExpenseDetailPage,
  EditExpensePage
} from '@/pages';

// Missing from barrel file
import MappingView from '@/pages/sync-glide/MappingView';

// These will eventually be moved to dedicated folders with barrel files
import EstimateDetailPage from '@/pages/estimates/EstimateDetail';
import NewEstimates from '@/pages/estimates/Estimates';
import InvoiceDetailPage from '@/pages/invoices/InvoiceDetail';
import NewInvoices from '@/pages/invoices/Invoices';
import ProductsPage from '@/pages/products/Products';
import ProductDetailPage from '@/pages/products/ProductDetail';
import PurchaseOrderDetailPage from '@/pages/purchase-orders/PurchaseOrderDetail';
import NewPurchaseOrders from '@/pages/purchase-orders/PurchaseOrders';
import UnpaidInventoryPage from '@/pages/products/UnpaidInventory';

// Import our new card-based invoice pages
import InvoiceCardPage from '@/pages/invoices/InvoiceCardPage';
import InvoiceCardDetailPage from '@/pages/invoices/InvoiceCardDetailPage';
import Layout from '@/components/layout/Layout';
import ErrorBoundary from '@/components/utils/ErrorBoundary';

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
          <Route path="expenses">
            <Route 
              index
              element={
                <ProtectedRoute>
                  <ExpensesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="new" 
              element={
                <ProtectedRoute>
                  <CreateExpensePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path=":id" 
              element={
                <ProtectedRoute>
                  <ExpenseDetailPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path=":id/edit" 
              element={
                <ProtectedRoute>
                  <EditExpensePage />
                </ProtectedRoute>
              } 
            />
          </Route>
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
