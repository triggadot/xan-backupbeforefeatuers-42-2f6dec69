
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Function to check if the viewport is mobile size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
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
