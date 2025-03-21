
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navigationConfig } from './navigationConfig';
import { icons } from 'lucide-react';

interface MobileSidebarContentProps {
  onClose?: () => void;
}

const MobileSidebarContent: React.FC<MobileSidebarContentProps> = ({ onClose }) => {
  const location = useLocation();
  
  // Function to render a Lucide icon by name
  const LucideIcon = (iconName: string) => {
    const IconComponent = (icons as any)[iconName] || (icons as any)["Circle"];
    return <IconComponent className="h-4 w-4 mr-2" />;
  };
  
  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const handleItemClick = () => {
    if (onClose) {
      onClose();
    }
  };
  
  // Create a flat list of navigation items from all sections
  const allNavItems = navigationConfig.sidebarNav.flatMap(section => section.items);
  
  return (
    <div className="px-3 py-2">
      <div className="space-y-1">
        {allNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={handleItemClick}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive(item.href)
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {LucideIcon(item.icon)}
            <span className="truncate">{item.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileSidebarContent;
