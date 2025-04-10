
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  mobileBottomSpace?: boolean;
  fluid?: boolean;
}

/**
 * Container component that provides consistent padding and max-width
 * with a special option for adding bottom padding on mobile for navigation bars
 * and a fluid option for full-width containers with minimal padding
 */
export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, mobileBottomSpace = false, fluid = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full mx-auto",
          fluid 
            ? "px-2 sm:px-3 lg:px-4" // Reduced padding for fluid containers
            : "px-3 sm:px-4 lg:px-6", // Standard padding with responsive scaling
          !fluid && "max-w-7xl", // Only add max-width if not fluid
          mobileBottomSpace && "pb-20 md:pb-0", // Extra bottom padding on mobile for nav bar
          className
        )}
        {...props}
      />
    );
  }
);

Container.displayName = "Container";
