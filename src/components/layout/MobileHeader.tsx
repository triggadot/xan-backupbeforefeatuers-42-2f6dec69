
import React, { useState } from "react"
import { Link } from "react-router-dom"
import { BarChart3, Menu, Search, Bell, X } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import MobileSidebarContent from "./MobileSidebarContent"
import { motion } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MobileHeaderProps {
  className?: string
}

function MobileHeader({ className }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.header 
      className={`flex h-14 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 ${className}`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              className="active:scale-95 transition-transform"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          
          <SheetContent side="left" className="p-0 w-[85%] max-w-[300px]">
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <span className="font-semibold">Billow</span>
              </div>
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
            <MobileSidebarContent onClose={() => setIsOpen(false)} />
          </SheetContent>
        </Sheet>
        
        <Link to="/" className="flex items-center gap-2 text-primary font-semibold transition-colors hover:opacity-80">
          <BarChart3 className="h-5 w-5" />
          <span>Billow</span>
        </Link>
      </div>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label="Search"
                className="active:scale-95 transition-transform"
              >
                <Search className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Search</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label="Notifications"
                className="active:scale-95 transition-transform"
              >
                <Bell className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <ModeToggle />
        
        <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
          <AvatarImage src="https://github.com/shadcn.png" alt="@user" />
          <AvatarFallback>SC</AvatarFallback>
        </Avatar>
      </div>
    </motion.header>
  )
}

export default MobileHeader 
