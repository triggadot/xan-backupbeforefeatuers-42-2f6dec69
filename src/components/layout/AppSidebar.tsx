import React from "react"
import { Link, useLocation } from "react-router-dom"
import {
  BarChart3,
  ChevronUp, 
  ClipboardList,
  Database,
  FileCog,
  FileText,
  LayoutDashboard,
  Menu,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Table,
  User2,
  Users,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function AppSidebar() {
  const location = useLocation()
  const { state } = useSidebar()
  const isExpanded = state === "expanded"
  
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/"
    }
    return location.pathname.startsWith(path)
  }

  const mainItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Accounts",
      url: "/accounts",
      icon: Users,
    },
    {
      title: "Products",
      url: "/products",
      icon: Package,
    },
  ]

  const documentItems = [
    {
      title: "Purchase Orders",
      url: "/purchase-orders",
      icon: ShoppingCart,
    },
    {
      title: "Estimates",
      url: "/estimates",
      icon: FileCog,
    },
    {
      title: "Invoices",
      url: "/invoices",
      icon: Receipt,
    },
  ]

  const reportItems = [
    {
      title: "Reports",
      url: "/reports",
      icon: FileText,
    },
    {
      title: "Activity",
      url: "/activity",
      icon: ClipboardList,
    },
  ]

  const adminItems = [
    {
      title: "Glide Sync",
      url: "/sync",
      icon: BarChart3,
    },
    {
      title: "Database Management",
      url: "/data-management",
      icon: Database,
    },
    {
      title: "Table Demo",
      url: "/table-demo",
      icon: Table,
    },
  ]
  
  const renderMenuItem = (item: { title: string, url: string, icon: React.ElementType }) => {
    const Icon = item.icon;
    return (
      <SidebarMenuItem key={item.title}>
        <Link 
          to={item.url} 
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
            isActive(item.url) ? "bg-accent text-accent-foreground" : "hover:bg-muted"
          }`}
        >
          <Icon className="h-5 w-5" />
          {isExpanded && <span>{item.title}</span>}
        </Link>
      </SidebarMenuItem>
    )
  }
  
  const renderMenuSection = (title: string, items: { title: string, url: string, icon: React.ElementType }[]) => {
    return (
      <>
        {isExpanded && (
          <div className="px-3 py-2">
            <h3 className="mb-1 text-xs font-medium text-muted-foreground">{title}</h3>
          </div>
        )}
        {!isExpanded && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="px-3 py-2">
                  <h3 className="mb-1 text-xs font-medium text-muted-foreground">{title[0]}</h3>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">{title}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <SidebarMenu>
          {items.map(renderMenuItem)}
        </SidebarMenu>
        <SidebarSeparator />
      </>
    )
  }
  
  return (
    <Sidebar variant="sidebar" collapsible="icon" className="hidden md:flex">
      <SidebarHeader>
        <div className="flex h-14 items-center px-3">
          <Link to="/" className="flex items-center gap-2 text-primary font-semibold">
            <BarChart3 className="h-6 w-6" />
            {isExpanded && <span>Billow</span>}
          </Link>
          <div className="flex-1" />
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {renderMenuSection("Main", mainItems)}
        {renderMenuSection("Documents", documentItems)}
        {renderMenuSection("Reports", reportItems)}
        {renderMenuSection("Administration", adminItems)}
      </SidebarContent>
      
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link 
              to="/settings" 
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <Settings className="h-5 w-5" />
              {isExpanded && <span>Settings</span>}
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                  <User2 className="h-5 w-5" />
                  {isExpanded && (
                    <>
                      <span>Profile</span>
                      <ChevronUp className="ml-auto h-4 w-4" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="w-full">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account" className="w-full">Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar 