import * as React from "react"

// Define standard breakpoints that match Tailwind defaults
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
}

export type Breakpoint = keyof typeof BREAKPOINTS

/**
 * Hook to detect if viewport is at or below a specific breakpoint
 * @param breakpoint The breakpoint to check (defaults to 'md')
 */
export function useBreakpoint(breakpoint: Breakpoint = 'md') {
  const [isBelow, setIsBelow] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS[breakpoint] - 1}px)`)
    
    const onChange = () => {
      setIsBelow(mql.matches)
    }
    
    mql.addEventListener("change", onChange)
    setIsBelow(mql.matches)
    
    return () => mql.removeEventListener("change", onChange)
  }, [breakpoint])

  return !!isBelow
}

/**
 * Legacy hook for mobile detection (below 'md' breakpoint)
 * @deprecated Use useBreakpoint('md') instead
 */
export function useIsMobile() {
  return useBreakpoint('md')
}

/**
 * Hook to get the current active breakpoint
 */
export function useActiveBreakpoint() {
  const [activeBreakpoint, setActiveBreakpoint] = React.useState<Breakpoint>('xs')
  
  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      if (width >= BREAKPOINTS["2xl"]) return setActiveBreakpoint("2xl")
      if (width >= BREAKPOINTS.xl) return setActiveBreakpoint("xl")
      if (width >= BREAKPOINTS.lg) return setActiveBreakpoint("lg")
      if (width >= BREAKPOINTS.md) return setActiveBreakpoint("md")
      if (width >= BREAKPOINTS.sm) return setActiveBreakpoint("sm")
      return setActiveBreakpoint("xs")
    }
    
    window.addEventListener('resize', updateBreakpoint)
    updateBreakpoint()
    
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])
  
  return activeBreakpoint
}
