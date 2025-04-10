import { ModeToggle } from "@/components/mode-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useActiveBreakpoint } from "@/hooks/use-mobile"
import { motion } from "framer-motion"
import { BarChart3, Bell, ChevronLeft, Menu, Search, X } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import MobileSidebarContent from "./MobileSidebarContent"

interface MobileHeaderProps {
  className?: string
}

function MobileHeader({ className }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const activeBreakpoint = useActiveBreakpoint();
  
  // Show back button rather than menu on xs screens for better touch navigation
  const showBackButton = activeBreakpoint === 'xs';

  return (
    <motion.header 
      className={`sticky top-0 z-50 flex h-14 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 ${className}`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        {showBackButton ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Go back"
            className="active:scale-95 transition-transform mr-1"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        ) : (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className="active:scale-95 transition-transform touch-manipulation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            
            <SheetContent side="left" className="p-0 w-[85%] max-w-[300px] sm:max-w-xs">
              <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <span className="font-semibold">Billow</span>
                </div>
                <SheetClose asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 rounded-full active:scale-95 transition-transform"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </SheetClose>
              </div>
              <MobileSidebarContent onClose={() => setIsOpen(false)} />
            </SheetContent>
          </Sheet>
        )}
        
        <Link to="/" className="flex items-center gap-2 text-primary font-semibold transition-colors hover:opacity-80">
          <BarChart3 className="h-5 w-5" />
          <span>Billow</span>
        </Link>
      </div>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-1 sm:gap-2">
        {showSearch ? (
          <div className="animate-fade-in flex items-center bg-muted/50 rounded-full pr-2 mr-1">
            <input 
              type="text" 
              placeholder="Search..." 
              className="h-9 bg-transparent border-none focus:outline-none px-3 py-2 w-[120px] sm:w-[160px] text-sm"
              autoFocus
              onBlur={() => setShowSearch(false)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowSearch(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label="Search"
            className="active:scale-95 transition-transform rounded-full touch-manipulation"
            onClick={() => setShowSearch(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          aria-label="Notifications"
          className="active:scale-95 transition-transform rounded-full touch-manipulation"
        >
          <Bell className="h-5 w-5" />
        </Button>
        
        <ModeToggle />
        
        <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all touch-manipulation">
          <AvatarImage src="https://github.com/shadcn.png" alt="@user" />
          <AvatarFallback>SC</AvatarFallback>
        </Avatar>
      </div>
    </motion.header>
  )
}

export default MobileHeader 
