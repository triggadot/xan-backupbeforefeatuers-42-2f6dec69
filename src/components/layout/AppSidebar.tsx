import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from '@/hooks/utils/use-mobile';
import { AlertCircle, BarChart, ChevronLeft, ChevronRight, ClipboardList, Database, FileText, History, Layout, LayoutDashboard, Link as LinkIcon, Package, Receipt, RefreshCw, Settings, ShoppingBag, Table, Users } from "lucide-react";
import { Link, useLocation } from 'react-router-dom';
import { navigationConfig } from './navigationConfig';

export function AppSidebar() {
  const {
    state,
    toggleSidebar
  } = useSidebar();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isExpanded = state === "expanded";

  // Function to render a Lucide icon by name
  const renderIcon = (iconName: string) => {
    const iconMap: Record<string, React.ElementType> = {
      dashboard: LayoutDashboard,
      users: Users,
      fileText: FileText,
      package: Package,
      shoppingBag: ShoppingBag,
      alertCircle: AlertCircle,
      barChart: BarChart,
      settings: Settings,
      refreshCw: RefreshCw,
      link: LinkIcon,
      table: Table,
      history: History,
      clipboardList: ClipboardList,
      database: Database,
      layout: Layout,
      receipt: Receipt
    };
    const IconComponent = iconMap[iconName] || AlertCircle;
    return <IconComponent className="h-4 w-4" />;
  };

  return <Sidebar variant={isMobile ? "floating" : "sidebar"} collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarHeader>
        <div className="flex h-14 items-center px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            {isExpanded && <span className="text-xl text-left">Xdelo</span>}
          </Link>
          <div className="flex-1" />
          {!isMobile && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
              {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>}
          {isMobile && <SidebarTrigger />}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {navigationConfig.sidebarNav.map((section, sectionIndex) => <div key={sectionIndex} className="px-3 py-2">
            {isExpanded && section.title && <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                {section.title}
              </h3>}
            <SidebarMenu>
              {section.items.map(item => {
            const isActive = location.pathname === item.href || item.href !== '/' && location.pathname.startsWith(item.href);
            return <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link to={item.href} className="flex items-center gap-2">
                        {renderIcon(item.icon)}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>;
          })}
            </SidebarMenu>
          </div>)}
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="text-xs text-muted-foreground">
          {isExpanded && <p className="px-2"> 2023 Xchange. All rights reserved.</p>}
        </div>
      </SidebarFooter>
    </Sidebar>;
}
