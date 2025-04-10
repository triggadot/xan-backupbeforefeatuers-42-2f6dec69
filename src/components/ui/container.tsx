
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  mobileBottomSpace?: boolean;
}

/**
 * Container component that provides consistent padding and max-width
 * with a special option for adding bottom padding on mobile for navigation bars
 */
export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, mobileBottomSpace = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl",
          mobileBottomSpace && "pb-24 md:pb-0", // Extra padding at bottom on mobile for nav bar
          className
        )}
        {...props}
      />
    );
  }
);

Container.displayName = "Container";
