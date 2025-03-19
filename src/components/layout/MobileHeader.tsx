import React from "react"
import { Link } from "react-router-dom"
import { BarChart3 } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import SidebarToggle from "./SidebarToggle"
import { useSidebar } from "@/components/blocks/sidebar"
import MobileSidebar from "./MobileSidebar"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface MobileHeaderProps {
  className?: string
}

function MobileHeader({ className }: MobileHeaderProps) {
  const { isOpen, toggleSidebar, setSidebarOpen } = useSidebar()

  return (
    <>
      <header className={`md:hidden flex h-14 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 ${className}`}>
        <SidebarToggle className="mr-2" />
        
        <Link to="/" className="flex items-center gap-2 text-primary font-semibold">
          <BarChart3 className="h-5 w-5" />
          <span>Billow</span>
        </Link>
        
        <div className="flex-1" />
        
        <ModeToggle />
      </header>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[85%] max-w-[300px]">
          <MobileSidebar />
        </SheetContent>
      </Sheet>
    </>
  )
}

export default MobileHeader 