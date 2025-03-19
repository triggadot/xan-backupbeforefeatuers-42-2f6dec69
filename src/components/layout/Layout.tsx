import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import AppSidebar from './AppSidebar';
import MobileHeader from './MobileHeader';

function MainContent() {
  const { state } = useSidebar();
  
  return (
    <div className={`flex-1 flex flex-col transition-all duration-300 ${
      state === "expanded" ? 'md:ml-64' : 'md:ml-12'
    }`}>
      {/* Desktop Navbar - hidden on mobile */}
      <Navbar />
      
      {/* Main Content Area */}
      <main className="flex-1 bg-background overflow-auto transition-all duration-300 ease-smooth">
        <div className="content-container p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function Layout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex flex-col md:flex-row w-full">
        {/* Mobile Header - visible on small screens */}
        <MobileHeader className="sticky top-0 z-50 w-full" />
        
        {/* Sidebar - hidden on mobile, visible on md screens and up */}
        <AppSidebar />
        
        {/* Main Content */}
        <MainContent />
      </div>
    </SidebarProvider>
  );
}

export default Layout;
