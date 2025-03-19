import React from "react"
import {
  ChevronUp,
  CircleFadingPlus,
  Menu,
  MessageCircle,
  Phone,
  Settings,
  User2,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const isExpanded = state === "expanded"
  
  const items = [
    {
      title: "Messages",
      url: "#",
      icon: MessageCircle,
    },
    {
      title: "Phone",
      url: "#",
      icon: Phone,
    },
    {
      title: "Status",
      url: "#",
      icon: CircleFadingPlus,
    },
  ]
  
  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
    >
      <SidebarHeader>
        <div className="flex h-14 items-center px-3">
          <div className="flex-1" />
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <div className="px-3 py-2">
          <h3 className="mb-1 text-xs font-medium text-muted-foreground">Navigate</h3>
        </div>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <a 
                href={item.url}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                <item.icon className="h-5 w-5" />
                {isExpanded && <span>{item.title}</span>}
              </a>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
              <Settings className="h-5 w-5" />
              {isExpanded && <span>Settings</span>}
            </button>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                  <User2 className="h-5 w-5" />
                  {isExpanded && (
                    <>
                      <span>Manoj Rayi</span>
                      <ChevronUp className="ml-auto h-4 w-4" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start">
                <DropdownMenuItem asChild>
                  <a href="https://github.com/rayimanoj8/" className="w-full">Account</a>
                </DropdownMenuItem>
                <DropdownMenuItem>Back Up</DropdownMenuItem>
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
} 