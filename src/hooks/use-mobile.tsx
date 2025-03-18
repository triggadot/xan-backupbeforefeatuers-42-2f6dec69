
import * as React from "react"

// Breakpoint constants
export const BREAKPOINTS = {
  MOBILE: 640,       // Small mobile devices
  TABLET: 768,       // Tablets and large mobile devices
  DESKTOP: 1024,     // Small desktops and landscape tablets
  LARGE_DESKTOP: 1280 // Large desktops
}

/**
 * Hook to determine if the current viewport is mobile size
 * @returns boolean indicating if the viewport is mobile size
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Function to check if the viewport is mobile size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.TABLET)
    }
    
    // Run on mount
    checkMobile()
    
    // Add resize listener
    window.addEventListener('resize', checkMobile)
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  return isMobile
}

/**
 * Hook to check if the viewport matches a specific breakpoint
 * @param breakpoint The breakpoint to check against
 * @returns boolean indicating if the viewport is below the specified breakpoint
 */
export function useBreakpoint(breakpoint: number) {
  const [isBelow, setIsBelow] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Function to check if the viewport is below the breakpoint
    const checkBreakpoint = () => {
      setIsBelow(window.innerWidth < breakpoint)
    }
    
    // Run on mount
    checkBreakpoint()
    
    // Add resize listener
    window.addEventListener('resize', checkBreakpoint)
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkBreakpoint)
    }
  }, [breakpoint])

  return isBelow
}

/**
 * Hook to determine the current device type based on viewport size
 * @returns The current device type ('mobile', 'tablet', 'desktop', or 'large-desktop')
 */
export function useDeviceType() {
  const [deviceType, setDeviceType] = React.useState<'mobile' | 'tablet' | 'desktop' | 'large-desktop'>('desktop')

  React.useEffect(() => {
    // Function to determine the device type
    const checkDeviceType = () => {
      const width = window.innerWidth
      
      if (width < BREAKPOINTS.MOBILE) {
        setDeviceType('mobile')
      } else if (width < BREAKPOINTS.TABLET) {
        setDeviceType('tablet')
      } else if (width < BREAKPOINTS.DESKTOP) {
        setDeviceType('desktop')
      } else {
        setDeviceType('large-desktop')
      }
    }
    
    // Run on mount
    checkDeviceType()
    
    // Add resize listener
    window.addEventListener('resize', checkDeviceType)
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkDeviceType)
    }
  }, [])

  return deviceType
}

/**
 * Hook to get current viewport dimensions
 * @returns Object with viewport width and height
 */
export function useViewportSize() {
  const [size, setSize] = React.useState<{ width: number; height: number }>({
    width: 0,
    height: 0
  })

  React.useEffect(() => {
    // Function to update size
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    // Run on mount
    updateSize()
    
    // Add resize listener
    window.addEventListener('resize', updateSize)
    
    // Clean up
    return () => {
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  return size
}
