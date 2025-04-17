
import * as React from "react";
import { BREAKPOINTS, Breakpoint } from "./use-mobile";

type ResponsiveProps = {
  children: React.ReactNode;
  breakpoint: Breakpoint;
  above?: boolean;
  below?: boolean;
};

/**
 * Component that conditionally renders children based on viewport width
 * in relation to a specified breakpoint
 * 
 * @example
 * // Show content only on mobile (below md breakpoint)
 * <ShowAt breakpoint="md" below>
 *   Mobile content
 * </ShowAt>
 * 
 * @example
 * // Hide content on mobile (below md breakpoint)
 * <HideAt breakpoint="md" below>
 *   Desktop content
 * </HideAt>
 */
export function ShowAt({ children, breakpoint, above, below }: ResponsiveProps) {
  const [shouldRender, setShouldRender] = React.useState<boolean>(false);

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      const breakpointValue = BREAKPOINTS[breakpoint];

      if (above) {
        setShouldRender(width >= breakpointValue);
      } else if (below) {
        setShouldRender(width < breakpointValue);
      } else {
        // Default: at this exact breakpoint
        setShouldRender(
          width >= breakpointValue && 
          width < (BREAKPOINTS as any)[
            Object.keys(BREAKPOINTS)[
              Object.keys(BREAKPOINTS).indexOf(breakpoint) + 1
            ] || "9999"
          ]
        );
      }
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [breakpoint, above, below]);

  return shouldRender ? <>{children}</> : null;
}

/**
 * Component that conditionally hides children based on viewport width
 * in relation to a specified breakpoint
 */
export function HideAt({ children, breakpoint, above, below }: ResponsiveProps) {
  const [shouldRender, setShouldRender] = React.useState<boolean>(true);

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      const breakpointValue = BREAKPOINTS[breakpoint];

      if (above) {
        setShouldRender(width < breakpointValue);
      } else if (below) {
        setShouldRender(width >= breakpointValue);
      } else {
        // Default: hide at this exact breakpoint
        setShouldRender(
          !(width >= breakpointValue && 
          width < (BREAKPOINTS as any)[
            Object.keys(BREAKPOINTS)[
              Object.keys(BREAKPOINTS).indexOf(breakpoint) + 1
            ] || "9999"
          ])
        );
      }
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [breakpoint, above, below]);

  return shouldRender ? <>{children}</> : null;
}

/**
 * Hook to get value based on current breakpoint
 * 
 * @example
 * // Get different padding based on screen size
 * const padding = useResponsiveValue({
 *   xs: 2,
 *   sm: 4,
 *   md: 6,
 *   lg: 8,
 *   xl: 10,
 *   "2xl": 12,
 * });
 */
export function useResponsiveValue<T>(
  breakpointValues: Partial<Record<Breakpoint, T>> & { base?: T }
): T {
  const [value, setValue] = React.useState<T>(
    (breakpointValues.base || breakpointValues.xs || Object.values(breakpointValues)[0]) as T
  );

  React.useEffect(() => {
    const updateValue = () => {
      const width = window.innerWidth;
      
      // Get sorted breakpoints
      const sortedBreakpoints = Object.keys(BREAKPOINTS)
        .map(key => ({ key, value: BREAKPOINTS[key as Breakpoint] }))
        .sort((a, b) => b.value - a.value);
      
      // Find the largest breakpoint that is less than or equal to the current width
      for (const { key } of sortedBreakpoints) {
        if (width >= BREAKPOINTS[key as Breakpoint] && breakpointValues[key as Breakpoint] !== undefined) {
          setValue(breakpointValues[key as Breakpoint] as T);
          return;
        }
      }
      
      // Fallback to base or xs
      setValue((breakpointValues.base || breakpointValues.xs || Object.values(breakpointValues)[0]) as T);
    };

    updateValue();
    window.addEventListener('resize', updateValue);
    
    return () => window.removeEventListener('resize', updateValue);
  }, [breakpointValues]);

  return value;
}
