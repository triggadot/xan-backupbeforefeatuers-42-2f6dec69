
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ClipboardList,
  FileCog,
  FileText,
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Users,
} from 'lucide-react';
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  return (
    <SidebarComponent>
      <SidebarHeader className="flex items-center justify-center py-6">
        <Link to="/" className="flex items-center gap-2 text-primary font-semibold text-xl">
          <BarChart3 className="h-6 w-6" />
          <span>Billow</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className={isActive('/dashboard') ? 'active' : ''}>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem className={isActive('/accounts') ? 'active' : ''}>
                <SidebarMenuButton asChild>
                  <Link to="/accounts">
                    <Users className="h-5 w-5" />
                    <span>Accounts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem className={isActive('/products') ? 'active' : ''}>
                <SidebarMenuButton asChild>
                  <Link to="/products">
                    <Package className="h-5 w-5" />
                    <span>Products</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Documents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className={isActive('/purchase-orders') ? 'active' : ''}>
                <SidebarMenuButton asChild>
                  <Link to="/purchase-orders">
                    <ShoppingCart className="h-5 w-5" />
                    <span>Purchase Orders</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem className={isActive('/estimates') ? 'active' : ''}>
                <SidebarMenuButton asChild>
                  <Link to="/estimates">
                    <FileCog className="h-5 w-5" />
                    <span>Estimates</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem className={isActive('/invoices') ? 'active' : ''}>
                <SidebarMenuButton asChild>
                  <Link to="/invoices">
                    <Receipt className="h-5 w-5" />
                    <span>Invoices</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Reports</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className={isActive('/reports') ? 'active' : ''}>
                <SidebarMenuButton asChild>
                  <Link to="/reports">
                    <FileText className="h-5 w-5" />
                    <span>Reports</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem className={isActive('/activity') ? 'active' : ''}>
                <SidebarMenuButton asChild>
                  <Link to="/activity">
                    <ClipboardList className="h-5 w-5" />
                    <span>Activity</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </SidebarComponent>
  );
};

export default Sidebar;
