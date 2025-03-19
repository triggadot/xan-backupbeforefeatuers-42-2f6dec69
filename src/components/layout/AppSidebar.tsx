import React from "react"
import { useSidebar } from "@/components/ui/sidebar"
import MobileSidebarContent from "./MobileSidebarContent"

function AppSidebar() {
  const { state } = useSidebar()
  const isExpanded = state === "expanded"
  
  return (
    /* Desktop Sidebar */
    <div className="hidden md:block fixed top-0 bottom-0 left-0 z-30 transition-all duration-300 ease-in-out overflow-hidden border-r bg-background shadow-sm">
      <MobileSidebarContent isDesktop={true} isCollapsed={!isExpanded} />
    </div>
  )
}

export default AppSidebar 