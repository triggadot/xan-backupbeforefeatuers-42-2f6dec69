
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Package, 
  ShoppingBag, 
  AlertCircle, 
  BarChart, 
  Settings,
  ChevronLeft, 
  ChevronRight,
  Menu
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Accounts",
        href: "/accounts",
        icon: Users,
      },
      {
        title: "Invoices",
        href: "/invoices",
        icon: FileText,
      },
      {
        title: "Purchase Orders",
        href: "/purchase-orders",
        icon: Package,
      },
      {
        title: "Products",
        href: "/products",
        icon: ShoppingBag,
      },
      {
        title: "Unpaid Inventory",
        href: "/unpaid-inventory",
        icon: AlertCircle,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "Reports",
        href: "/reports",
        icon: BarChart,
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

export function GlideSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isExpanded = state === "expanded";

  return (
    <Sidebar
      variant={isMobile ? "floating" : "sidebar"}
      collapsible="icon"
      className="border-r border-border bg-sidebar"
    >
      <SidebarHeader>
        <div className="flex h-14 items-center px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            {isExpanded && <span className="text-xl">Glide Sync</span>}
          </Link>
          <div className="flex-1" />
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleSidebar}
            >
              {isExpanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          {isMobile && <SidebarTrigger />}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="px-3 py-2">
            {isExpanded && section.title && (
              <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                {section.title}
              </h3>
            )}
            <SidebarMenu>
              {section.items.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link to={item.href} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="text-xs text-muted-foreground">
          {isExpanded && (
            <p className="px-2">© 2023 Glide Sync. All rights reserved.</p>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
