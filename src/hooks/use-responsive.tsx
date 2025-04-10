
import { useEffect, useState } from "react";
import { useIsMobile } from "./use-mobile";

type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

/**
 * Responsive component to conditionally show content based on breakpoint
 * Only renders children when the current viewport is at the specified breakpoint or above
 */
export function ShowAt({ 
  children, 
  breakpoint = "md", 
  below = false 
}: { 
  children: React.ReactNode; 
  breakpoint: Breakpoint;
  below?: boolean;
}) {
  const matches = useBreakpoint(breakpoint, below);
  return matches ? <>{children}</> : null;
}

/**
 * Responsive component to conditionally hide content based on breakpoint
 * Only renders children when the current viewport is below the specified breakpoint
 */
export function HideAt({ 
  children, 
  breakpoint = "md", 
  below = false 
}: { 
  children: React.ReactNode; 
  breakpoint: Breakpoint;
  below?: boolean;
}) {
  const matches = useBreakpoint(breakpoint, below);
  return !matches ? <>{children}</> : null;
}

/**
 * Hook to detect if the current viewport matches the specified breakpoint
 * 
 * @param breakpoint - The breakpoint to check ("xs", "sm", "md", "lg", "xl", "2xl")
 * @param below - If true, matches when viewport is below the breakpoint
 *               If false, matches when viewport is at or above the breakpoint
 * @returns boolean indicating if the viewport matches the criteria
 */
export function useBreakpoint(breakpoint: Breakpoint, below = false): boolean {
  const [matches, setMatches] = useState<boolean>(false);
  
  useEffect(() => {
    const breakpoints = {
      xs: 480,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      "2xl": 1536
    };
    
    const query = below
      ? `(max-width: ${breakpoints[breakpoint] - 1}px)`
      : `(min-width: ${breakpoints[breakpoint]}px)`;
    
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    
    const handleResize = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };
    
    mediaQuery.addEventListener("change", handleResize);
    return () => mediaQuery.removeEventListener("change", handleResize);
  }, [breakpoint, below]);
  
  return matches;
}

/**
 * Hook to return the current active breakpoint name
 * @returns the current active breakpoint name
 */
export function useActiveBreakpoint(): Breakpoint {
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>("md");
  
  useEffect(() => {
    const breakpoints: [Breakpoint, number][] = [
      ["2xl", 1536],
      ["xl", 1280],
      ["lg", 1024],
      ["md", 768],
      ["sm", 640],
      ["xs", 0]
    ];
    
    const handleResize = () => {
      const width = window.innerWidth;
      for (const [name, size] of breakpoints) {
        if (width >= size) {
          setActiveBreakpoint(name);
          break;
        }
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  return activeBreakpoint;
}
