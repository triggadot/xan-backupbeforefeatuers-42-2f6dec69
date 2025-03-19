import React from "react"
import { Link } from "react-router-dom"
import { BarChart3, Menu } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import MobileSidebarContent from "./MobileSidebarContent"

interface MobileHeaderProps {
  className?: string
}

function MobileHeader({ className }: MobileHeaderProps) {
  const { open, setOpen } = useSidebar()

  return (
    <>
      <header className={`md:hidden flex h-14 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 ${className}`}>
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        
        <Link to="/" className="flex items-center gap-2 text-primary font-semibold">
          <BarChart3 className="h-5 w-5" />
          <span>Billow</span>
        </Link>
        
        <div className="flex-1" />
        
        <ModeToggle />
      </header>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-[85%] max-w-[300px]">
          <MobileSidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}

export default MobileHeader 