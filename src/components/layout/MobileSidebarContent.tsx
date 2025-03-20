
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navigationConfig } from './navigationConfig';

interface MobileSidebarContentProps {
  onClose?: () => void;
}

const MobileSidebarContent: React.FC<MobileSidebarContentProps> = ({ onClose }) => {
  const location = useLocation();
  
  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const handleItemClick = () => {
    if (onClose) {
      onClose();
    }
  };
  
  return (
    <div className="px-3 py-2">
      <div className="space-y-1">
        {navigationConfig.sidebarNav.map((item) => (
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
            <span className="truncate">{item.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileSidebarContent;
