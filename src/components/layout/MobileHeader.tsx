import React from "react"
import { Link } from "react-router-dom"
import { BarChart3, Menu, Search, Bell } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import MobileSidebarContent from "./MobileSidebarContent"

interface MobileHeaderProps {
  className?: string
}

function MobileHeader({ className }: MobileHeaderProps) {
  return (
    <header className={`flex h-14 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 ${className}`}>
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          
          <SheetContent side="left" className="p-0 w-[85%] max-w-[300px]">
            <MobileSidebarContent />
          </SheetContent>
        </Sheet>
        
        <Link to="/" className="flex items-center gap-2 text-primary font-semibold">
          <BarChart3 className="h-5 w-5" />
          <span>Billow</span>
        </Link>
      </div>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Search">
          <Search className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>
        
        <ModeToggle />
        
        <Avatar className="h-8 w-8">
          <AvatarImage src="https://github.com/shadcn.png" alt="@user" />
          <AvatarFallback>SC</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}

export default MobileHeader 