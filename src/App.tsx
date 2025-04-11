import { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ExpensesPage from "./pages/Expenses";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import UnpaidInventory from "./pages/UnpaidInventory";
import Accounts from "./pages/Accounts";
import Estimates from "./pages/Estimates";
import Invoices from "./pages/Invoices";
import PurchaseOrders from "./pages/PurchaseOrders";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import DataManagement from "./pages/DataManagement";
import PDFManagement from "./pages/PDFManagement";
import ResponsiveExamples from "./pages/ResponsiveExamples";
import SyncDashboard from "./pages/sync/SyncDashboard";
import SyncConnections from "./pages/sync/SyncConnections";
import SyncMappings from "./pages/sync/SyncMappings";
import SyncLogs from "./pages/sync/SyncLogs";
import SidebarDemoPage from "./pages/SidebarDemo";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="unpaid-inventory" element={<UnpaidInventory />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="estimates" element={<Estimates />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="data-management" element={<DataManagement />} />
        <Route path="admin/pdf-management" element={<PDFManagement />} />
        <Route path="responsive-examples" element={<ResponsiveExamples />} />
        <Route path="sync/dashboard" element={<SyncDashboard />} />
        <Route path="sync/connections" element={<SyncConnections />} />
        <Route path="sync/mappings" element={<SyncMappings />} />
        <Route path="sync/logs" element={<SyncLogs />} />
        <Route path="/sidebar-demo" element={<SidebarDemoPage />} />
      </Route>
    </Routes>
  );
}

export default App;
