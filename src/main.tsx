
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Sync from './pages/Sync.tsx';
import ProductSync from './pages/ProductSync.tsx';
import DataManagement from './pages/DataManagement.tsx';
import SignIn from './pages/SignIn.tsx';
import RequireAuth from './components/RequireAuth.tsx';
import SyncLayout from './components/sync/SyncLayout.tsx';
import { AuthProvider } from './contexts/AuthProvider.tsx';
import Dashboard from './pages/Dashboard.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/auth",
    element: <SignIn />,
  },
  {
    path: "/dashboard",
    element: <RequireAuth><Dashboard /></RequireAuth>,
  },
  {
    path: "/signin",
    element: <SignIn />,
  },
  {
    path: "/sync",
    element: <RequireAuth><SyncLayout><Sync /></SyncLayout></RequireAuth>,
  },
  {
    path: "/sync/:tab",
    element: <RequireAuth><SyncLayout><Sync /></SyncLayout></RequireAuth>
  },
  {
    path: "/sync/product/:mappingId",
    element: <RequireAuth><ProductSync /></RequireAuth>,
  },
  {
    path: "/data-management",
    element: <RequireAuth><DataManagement /></RequireAuth>,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
)
