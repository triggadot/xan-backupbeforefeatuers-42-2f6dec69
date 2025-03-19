import * as React from "react"

// This file was renamed from .ts to .tsx to support JSX syntax

type SidebarState = {
  isOpen: boolean
  isMobile: boolean
}

type SidebarContext = {
  isOpen: boolean
  isMobile: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

const SidebarContext = React.createContext<SidebarContext | undefined>(undefined)

// Simple hook to detect if we're on mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
  defaultOpen?: boolean
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: SidebarProviderProps) {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = React.useState(defaultOpen && !isMobile)
  
  // Update open state when mobile status changes
  React.useEffect(() => {
    setIsOpen(prevOpen => isMobile ? false : prevOpen)
  }, [isMobile])

  const toggleSidebar = React.useCallback(() => {
    setIsOpen(open => !open)
  }, [])
  
  const setSidebarOpen = React.useCallback((open: boolean) => {
    setIsOpen(open)
  }, [])

  const value = React.useMemo<SidebarContext>(
    () => ({
      isOpen,
      isMobile,
      toggleSidebar,
      setSidebarOpen,
    }),
    [isOpen, isMobile, toggleSidebar, setSidebarOpen]
  )

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
} 