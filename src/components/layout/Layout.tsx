
import { Container } from "@/components/ui/container";
import { MobileNav } from "@/components/ui/mobile-nav";
import { SidebarContent, SidebarProvider } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Toaster } from "@/components/ui/toaster";
import { useBreakpoint } from "@/hooks/use-mobile";
import { HideAt, ShowAt } from "@/hooks/use-responsive";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, FileText, Plus, Settings, Users } from "lucide-react";
import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import MobileHeader from "./MobileHeader";
import Navbar from "./Navbar";

const Layout = () => {
  const isMobile = useBreakpoint('md');

  // Responsive container classes based on screen size
  const containerClasses = "py-3 md:py-4 lg:py-6 pb-20 md:pb-6";
  
  // Navigation items for mobile bottom nav
  const navItems = [
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Dashboard', href: '/' },
    { icon: <FileText className="h-5 w-5" />, label: 'Documents', href: '/documents' },
    { icon: <Plus className="h-5 w-5" />, label: 'Create', href: '/create' },
    { icon: <Users className="h-5 w-5" />, label: 'Customers', href: '/customers' },
    { icon: <Settings className="h-5 w-5" />, label: 'Settings', href: '/settings' },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar is hidden on mobile and shown on larger screens */}
        <HideAt breakpoint="md" below>
          <AppSidebar />
        </HideAt>
        
        <SidebarContent className="flex-1 overflow-auto bg-background">
          {/* Conditionally render the appropriate header */}
          <ShowAt breakpoint="md" below>
            <MobileHeader />
          </ShowAt>
          
          <HideAt breakpoint="md" below>
            <Navbar />
          </HideAt>
          
          <motion.main 
            className={containerClasses}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Container mobileBottomSpace fluid={isMobile}>
              <Suspense fallback={
                <div className="flex justify-center items-center h-64">
                  <Spinner size="lg" />
                </div>
              }>
                <AnimatePresence mode="wait">
                  <Outlet />
                </AnimatePresence>
              </Suspense>
            </Container>
          </motion.main>
          
          {/* Mobile bottom navigation */}
          <MobileNav items={navItems} compact={isMobile} />
        </SidebarContent>
      </div>
      <Toaster />
    </SidebarProvider>
  );
};

export default Layout;
