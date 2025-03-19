import React, { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  BarChart3,
  ChevronUp, 
  Settings,
  User2,
  X,
  ExternalLink,
  PanelLeft,
} from "lucide-react"

import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

import { 
  mainItems, 
  documentItems, 
  reportItems, 
  adminItems,
  type NavigationItem
} from "./navigationConfig"

interface MobileSidebarContentProps {
  isDesktop?: boolean
  isCollapsed?: boolean
}

function MobileSidebarContent({ isDesktop = false, isCollapsed = false }: MobileSidebarContentProps) {
  const location = useLocation()
  const { setOpen, toggleSidebar } = useSidebar()
  const [isHovering, setIsHovering] = useState(false)
  
  // Only enable hover expansion when in desktop mode
  const shouldCollapse = isCollapsed && !(isDesktop && isHovering)
  
  // Calculate width for smooth transitions
  const sidebarWidth = !shouldCollapse ? "w-64" : "w-12"
  
  // Reset hover state when isCollapsed changes (sidebar toggle)
  useEffect(() => {
    setIsHovering(false)
  }, [isCollapsed])
  
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/"
    }
    return location.pathname.startsWith(path)
  }
  
  const renderMenuItem = (item: NavigationItem) => {
    const Icon = item.icon
    return (
      <li key={item.title}>
        <Link
          to={item.url}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium w-full transition-colors",
            isActive(item.url) 
              ? "bg-accent text-accent-foreground" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          onClick={() => !isDesktop && setOpen(false)}
        >
          <Icon className="h-5 w-5 min-w-5 shrink-0" />
          <span className={cn(
            "transition-all duration-300 whitespace-nowrap",
            shouldCollapse ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          )}>
            {item.title}
          </span>
          {item.badge && (
            <Badge 
              variant="secondary" 
              className={cn(
                "ml-auto text-xs transition-all duration-300",
                shouldCollapse ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}
            >
              {item.badge}
            </Badge>
          )}
        </Link>
      </li>
    )
  }
  
  const renderMenuSection = (title: string, items: NavigationItem[]) => {
    return (
      <div className="px-2 py-2">
        <h3 className={cn(
          "mb-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider transition-all duration-300",
          shouldCollapse ? "opacity-0 h-0 overflow-hidden" : "opacity-100 h-auto"
        )}>
          {title}
        </h3>
        <ul className="space-y-1">
          {items.map(renderMenuItem)}
        </ul>
      </div>
    )
  }
  
  return (
    <div 
      className={cn(
        "flex h-full flex-col overflow-hidden transition-all duration-300", 
        sidebarWidth
      )}
      onMouseEnter={() => isDesktop && isCollapsed && setIsHovering(true)}
      onMouseLeave={() => isDesktop && setIsHovering(false)}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        <Link to="/" className="flex items-center gap-2 text-primary font-semibold">
          <BarChart3 className="h-5 w-5" />
          <span className={cn(
            "transition-all duration-300 whitespace-nowrap",
            shouldCollapse ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          )}>
            Billow
          </span>
        </Link>
        
        <div className="flex items-center gap-2">
          {isDesktop ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="h-8 w-8"
            >
              <PanelLeft className="h-4 w-4" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          ) : (
            <>
              <ModeToggle />
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={cn(
        "p-4 border-b transition-all duration-300",
        shouldCollapse ? "opacity-0 h-0 overflow-hidden" : "opacity-100 h-auto"
      )}>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://github.com/shadcn.png" alt="@user" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">John Doe</span>
            <span className="text-xs text-muted-foreground">john.doe@example.com</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                <ChevronUp className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild onClick={() => !isDesktop && setOpen(false)}>
                <Link to="/profile" className="cursor-pointer">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild onClick={() => !isDesktop && setOpen(false)}>
                <Link to="/settings" className="cursor-pointer">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-auto py-2">
        {renderMenuSection("Main", mainItems)}
        {renderMenuSection("Documents", documentItems)}
        {renderMenuSection("Reports", reportItems)}
        {renderMenuSection("Administration", adminItems)}
      </div>
      
      <div className={cn(
        "border-t p-4 text-center text-sm text-muted-foreground transition-all duration-300",
        shouldCollapse ? "opacity-0 h-0 overflow-hidden" : "opacity-100 h-auto"
      )}>
        <p>Billow Business Console v1.0</p>
      </div>
    </div>
  )
}

export default MobileSidebarContent 