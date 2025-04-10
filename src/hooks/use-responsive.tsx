import * as React from "react"
import { BREAKPOINTS, Breakpoint, useActiveBreakpoint, useBreakpoint } from "./use-mobile"

type ResponsiveValue<T> = {
  xs?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  "2xl"?: T
  base: T
}

/**
 * Hook to get a value based on the current breakpoint
 * @param responsiveValue Object with values for different breakpoints
 * @returns The value for the current breakpoint
 */
export function useResponsiveValue<T>(responsiveValue: ResponsiveValue<T>): T {
  const activeBreakpoint = useActiveBreakpoint()
  
  // Find the closest defined breakpoint
  const getValueForBreakpoint = (): T => {
    const breakpointOrder: Breakpoint[] = ["2xl", "xl", "lg", "md", "sm", "xs"]
    const activeIndex = breakpointOrder.indexOf(activeBreakpoint)
    
    // Look from current breakpoint down to find a defined value
    for (let i = activeIndex; i < breakpointOrder.length; i++) {
      const bp = breakpointOrder[i]
      if (responsiveValue[bp] !== undefined) {
        return responsiveValue[bp] as T
      }
    }
    
    // Fallback to base value
    return responsiveValue.base
  }
  
  return getValueForBreakpoint()
}

/**
 * Render different components based on breakpoint
 */
export function Responsive<T>({
  children,
  fallback,
}: {
  children: (bp: Breakpoint) => React.ReactNode
  fallback?: React.ReactNode
}) {
  const [isClient, setIsClient] = React.useState(false)
  const activeBreakpoint = useActiveBreakpoint()

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle SSR - render fallback or nothing on server
  if (!isClient) {
    return fallback || null
  }

  return <>{children(activeBreakpoint)}</>
}

/**
 * Show content only at specified breakpoints
 */
export function ShowAt({
  breakpoint,
  below = false,
  above = false,
  children,
}: {
  breakpoint: Breakpoint
  below?: boolean
  above?: boolean
  children: React.ReactNode
}) {
  const belowBreakpoint = useBreakpoint(breakpoint)
  const activeBreakpoint = useActiveBreakpoint()
  const breakpointValue = BREAKPOINTS[breakpoint]
  const currentValue = BREAKPOINTS[activeBreakpoint]
  
  // At exact breakpoint
  if (!below && !above && breakpoint === activeBreakpoint) {
    return <>{children}</>
  }
  
  // Below or at the specified breakpoint
  if (below && belowBreakpoint) {
    return <>{children}</>
  }
  
  // Above the specified breakpoint
  if (above && currentValue > breakpointValue) {
    return <>{children}</>
  }
  
  return null
}

/**
 * Hide content at specified breakpoints
 */
export function HideAt({
  breakpoint,
  below = false,
  above = false,
  children,
}: {
  breakpoint: Breakpoint
  below?: boolean
  above?: boolean
  children: React.ReactNode
}) {
  const belowBreakpoint = useBreakpoint(breakpoint)
  const activeBreakpoint = useActiveBreakpoint()
  const breakpointValue = BREAKPOINTS[breakpoint]
  const currentValue = BREAKPOINTS[activeBreakpoint]
  
  // At exact breakpoint
  if (!below && !above && breakpoint === activeBreakpoint) {
    return null
  }
  
  // Below or at the specified breakpoint
  if (below && belowBreakpoint) {
    return null
  }
  
  // Above the specified breakpoint
  if (above && currentValue > breakpointValue) {
    return null
  }
  
  return <>{children}</>
} 