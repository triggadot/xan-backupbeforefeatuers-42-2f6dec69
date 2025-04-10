import { SidebarContent, SidebarProvider } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Toaster } from "@/components/ui/toaster";
import { useBreakpoint } from "@/hooks/use-mobile";
import { HideAt, ShowAt } from "@/hooks/use-responsive";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import MobileHeader from "./MobileHeader";
import Navbar from "./Navbar";

const Layout = () => {
  const isMobile = useBreakpoint('md');

  // Responsive container classes based on screen size
  const containerClasses = "container px-4 sm:px-6 lg:px-8 py-4 md:py-6 lg:py-8";

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
            <Suspense fallback={
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            }>
              <AnimatePresence mode="wait">
                <Outlet />
              </AnimatePresence>
            </Suspense>
          </motion.main>
        </SidebarContent>
      </div>
      <Toaster />
    </SidebarProvider>
  );
};

export default Layout;
