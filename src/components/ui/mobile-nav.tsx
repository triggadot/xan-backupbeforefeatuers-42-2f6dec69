
import * as React from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

interface MobileNavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

interface MobileNavProps {
  items: MobileNavItem[];
  className?: string;
  compact?: boolean;
}

/**
 * Mobile bottom navigation bar with adjustable compactness
 */
export function MobileNav({ items, className, compact = false }: MobileNavProps) {
  const location = useLocation();
  
  return (
    <div className={cn(
      "fixed bottom-0 left-0 z-50 w-full border-t bg-background/95 backdrop-blur-sm md:hidden",
      compact ? "h-14" : "h-16",
      className
    )}>
      <div className={cn(
        "grid h-full mx-auto",
        `grid-cols-${Math.min(items.length, 5)}`,
        "max-w-lg"
      )}>
        {items.map((item, index) => {
          const isActive = location.pathname === item.href || 
                        (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={index}
              to={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-1 group touch-manipulation active:scale-95 transition-all",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center rounded-md transition-colors",
                compact ? "w-7 h-7 mb-0.5" : "w-8 h-8 mb-1",
                isActive && "bg-primary/10"
              )}>
                {item.icon}
              </div>
              <span className={cn(
                "font-medium truncate",
                compact ? "text-2xs" : "text-xs"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
