
import { Toaster } from "@/components/ui/toaster";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import Navbar from "./Navbar";
import MobileHeader from "./MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { SidebarContent, SidebarProvider } from "@/components/ui/sidebar";

const Layout = () => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <SidebarContent className="flex-1 overflow-auto bg-background">
          {isMobile ? <MobileHeader /> : <Navbar />}
          <main className="container py-4 md:py-6 lg:py-8">
            <Suspense fallback={
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            }>
              <Outlet />
            </Suspense>
          </main>
        </SidebarContent>
      </div>
      <Toaster />
    </SidebarProvider>
  );
};

export default Layout;
