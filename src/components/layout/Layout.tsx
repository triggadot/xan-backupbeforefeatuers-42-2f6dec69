import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import AppSidebar from './AppSidebar';
import MobileHeader from './MobileHeader';

function MainContent() {
  const { state } = useSidebar();
  const isExpanded = state === "expanded";
  
  return (
    <div className={`flex-1 flex flex-col transition-all duration-300 md:ml-12 ${isExpanded ? 'md:ml-64' : ''}`}>
      {/* Main Content Area */}
      <main className="flex-1 bg-background overflow-auto">
        <div className="container mx-auto p-4 md:p-6 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function Layout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex flex-col md:flex-row w-full bg-background text-foreground">
        {/* Mobile Header - visible on small screens */}
        <MobileHeader className="md:hidden sticky top-0 z-50 w-full" />
        
        {/* Sidebar - unified component for both mobile and desktop */}
        <AppSidebar />
        
        {/* Main Content */}
        <MainContent />
      </div>
    </SidebarProvider>
  );
}

export default Layout;
