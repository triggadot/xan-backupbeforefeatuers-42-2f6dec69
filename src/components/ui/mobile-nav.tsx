import { ShowAt } from '@/hooks/use-responsive';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

interface MobileNavProps {
  items: NavItem[];
  className?: string;
}

/**
 * A touch-friendly bottom navigation bar for mobile devices
 */
export function MobileNav({ items, className }: MobileNavProps) {
  const location = useLocation();
  
  return (
    <ShowAt breakpoint="lg" below>
      <motion.div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t py-2 px-4",
          className
        )}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <nav className="flex justify-around items-center">
          {items.map((item, index) => {
            const isActive = location.pathname === item.href || 
                           (item.href !== '/' && location.pathname.startsWith(item.href));
            
            return (
              <Link 
                key={index} 
                to={item.href}
                className={cn(
                  "flex flex-col items-center px-2 py-1 rounded-lg touch-manipulation transition-colors",
                  "relative active:bg-muted/60",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  {isActive && (
                    <motion.div 
                      className="absolute -inset-1 bg-primary/10 rounded-full"
                      layoutId="activeNavIndicator"
                      transition={{ type: "spring", duration: 0.3 }}
                    />
                  )}
                  <div className="relative z-10">
                    {item.icon}
                  </div>
                </div>
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </motion.div>
    </ShowAt>
  );
}

/**
 * A specialized mobile nav item for actions like "add new" that appear in the center
 */
export function MobileNavAction({ 
  icon, 
  label, 
  onClick,
  className
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center px-2 py-1 touch-manipulation transition-transform active:scale-95",
        className
      )}
    >
      <div className="bg-primary text-primary-foreground p-3 rounded-full shadow-md">
        {icon}
      </div>
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
} 