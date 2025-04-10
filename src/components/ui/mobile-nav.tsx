
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
}

/**
 * Mobile bottom navigation bar
 */
export function MobileNav({ items, className }: MobileNavProps) {
  const location = useLocation();
  
  return (
    <div className={cn(
      "fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t md:hidden",
      className
    )}>
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto">
        {items.map((item, index) => {
          const isActive = location.pathname === item.href || 
                        (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={index}
              to={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-1 group",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 mb-1 rounded-md transition-colors",
                isActive && "bg-primary/10"
              )}>
                {item.icon}
              </div>
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
