import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
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
} from "@/pages";

// Missing from barrel file
import MappingView from "@/pages/sync-glide/MappingView";

// These will eventually be moved to dedicated folders with barrel files
import { ExpensesPage } from "@/pages/expenses";
import { InvoiceDetailPage, NewInvoices } from "@/pages/invoices";
import ProductsPage from "@/pages/products";
import PurchaseOrdersPage from "@/pages/purchase-orders";
import EstimatesPage from "@/pages/estimates";

// Import our new card-based invoice pages
import InvoiceCardPage from "@/pages/invoices/InvoiceCardPage";
import InvoiceCardDetailPage from "@/pages/invoices/InvoiceCardDetailPage";
import Layout from "@/components/layout/Layout";
import ErrorBoundary from "@/components/utils/ErrorBoundary";
import ShippingDashboard from "@/components/shipping/ShippingDashboard";

// Temporary placeholder component until we rebuild the pages
const PlaceholderPage = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
      <p className="text-gray-500">
        This page is being redesigned with improved UI/UX.
      </p>
    </div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ModernDashboard />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <ModernDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="responsive-examples" element={<ResponsiveExamples />} />
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
                <PurchaseOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="purchase-orders/:id"
            element={
              <ProtectedRoute>
                <PlaceholderPage />
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
                <PlaceholderPage />
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
                <EstimatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="estimates/:id"
            element={
              <ProtectedRoute>
                <PlaceholderPage />
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
          <Route
            path="expenses"
            element={
              <ProtectedRoute>
                <ExpensesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shipping"
            element={
              <ProtectedRoute>
                <ShippingDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
