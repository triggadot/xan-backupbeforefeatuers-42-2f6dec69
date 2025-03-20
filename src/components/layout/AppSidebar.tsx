
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navigationConfig } from './navigationConfig';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileSidebarContent from './MobileSidebarContent';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function AppSidebar() {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "min-h-screen border-r bg-background pb-10 transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      {isMobile ? (
        <MobileSidebarContent />
      ) : (
        <DesktopSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}
    </div>
  );
}

interface DesktopSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

function DesktopSidebar({ isCollapsed, setIsCollapsed }: DesktopSidebarProps) {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          {!isCollapsed && <span>Glide Sync</span>}
        </Link>
        <div className="flex-1"></div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {Object.entries(navigationConfig).map(([key, section]) => (
            <div key={key} className="mb-4">
              {!isCollapsed && (
                <h3 className="mb-1 px-4 text-xs font-medium text-muted-foreground">
                  {section.title}
                </h3>
              )}
              <div className="grid gap-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.href || 
                    (item.href !== '/' && location.pathname.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-secondary text-secondary-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
