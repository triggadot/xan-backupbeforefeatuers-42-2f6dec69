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
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Table,
  User2,
  Users,
  X,
} from "lucide-react"

import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function MobileSidebarContent() {
  const location = useLocation()
  const { setOpen } = useSidebar()
  
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
    const Icon = item.icon
    return (
      <li key={item.title}>
        <Link
          to={item.url}
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
            isActive(item.url) ? "bg-accent text-accent-foreground" : "hover:bg-muted"
          }`}
          onClick={() => setOpen(false)}
        >
          <Icon className="h-5 w-5" />
          <span>{item.title}</span>
        </Link>
      </li>
    )
  }
  
  const renderMenuSection = (title: string, items: { title: string, url: string, icon: React.ElementType }[]) => {
    return (
      <div className="px-2 py-2">
        <h3 className="mb-1 px-3 text-xs font-medium text-muted-foreground">{title}</h3>
        <ul className="space-y-1">
          {items.map(renderMenuItem)}
        </ul>
      </div>
    )
  }
  
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-14 items-center border-b px-4">
        <Link to="/" className="flex items-center gap-2 text-primary font-semibold text-xl">
          <BarChart3 className="h-6 w-6" />
          <span>Billow</span>
        </Link>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      <div className="flex-1 overflow-auto py-2">
        {renderMenuSection("Main", mainItems)}
        {renderMenuSection("Documents", documentItems)}
        {renderMenuSection("Reports", reportItems)}
        {renderMenuSection("Administration", adminItems)}
      </div>
      
      <div className="border-t p-2">
        <ul className="space-y-1">
          <li>
            <Link
              to="/settings"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </li>
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                  <User2 className="h-5 w-5" />
                  <span>User Profile</span>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="w-full" onClick={() => setOpen(false)}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account" className="w-full" onClick={() => setOpen(false)}>Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default MobileSidebarContent 