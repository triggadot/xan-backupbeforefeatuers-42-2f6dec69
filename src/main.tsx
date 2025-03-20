import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Dashboard from './pages/Dashboard.tsx'
import Accounts from './pages/Accounts.tsx'
import AccountDetail from './pages/AccountDetail.tsx'
import NewAccounts from './pages/NewAccounts.tsx'
import Invoices from './pages/Invoices.tsx'
import InvoiceDetail from './pages/InvoiceDetail.tsx'
import NewInvoice from './pages/NewInvoice.tsx'
import PurchaseOrders from './pages/PurchaseOrders.tsx'
import NewPurchaseOrder from './pages/NewPurchaseOrder.tsx'
import Estimates from './pages/Estimates.tsx'
import Settings from './pages/Settings.tsx'
import Sync from './pages/Sync.tsx'
import MappingView from './pages/MappingView.tsx'
import Layout from './components/layout/Layout.tsx'
import ProtectedRoute from './components/auth/ProtectedRoute.tsx'

const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout>
          <Dashboard />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/accounts',
    element: (
      <ProtectedRoute>
        <Layout>
          <NewAccounts />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/accounts/:id',
    element: (
      <ProtectedRoute>
        <Layout>
          <AccountDetail />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/invoices',
    element: (
      <ProtectedRoute>
        <Layout>
          <Invoices />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/invoices/:id',
    element: (
      <ProtectedRoute>
        <Layout>
          <InvoiceDetail />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/invoices/new',
    element: (
      <ProtectedRoute>
        <Layout>
          <NewInvoice />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/purchase-orders',
    element: (
      <ProtectedRoute>
        <Layout>
          <PurchaseOrders />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/purchase-orders/new',
    element: (
      <ProtectedRoute>
        <Layout>
          <NewPurchaseOrder />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/estimates',
    element: (
      <ProtectedRoute>
        <Layout>
          <Estimates />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <Layout>
          <Settings />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/sync',
    element: (
      <ProtectedRoute>
        <Layout>
          <Sync />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/sync/mappings/:id",
    element: (
      <ProtectedRoute>
        <Layout>
          <MappingView />
        </Layout>
      </ProtectedRoute>
    ),
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
)
