
import { Toaster } from "@/components/ui/toaster";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import Navbar from "./Navbar";
import MobileHeader from "./MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";

const Layout = () => {
  const { isMobile } = useIsMobile();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 overflow-auto">
        {isMobile ? <MobileHeader /> : <Navbar />}
        <main className="container py-4 md:py-6 lg:py-8">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
};

export default Layout;
