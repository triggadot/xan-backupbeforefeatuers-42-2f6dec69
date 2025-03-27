
import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navigationConfig } from './navigationConfig';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Package, 
  ShoppingBag, 
  AlertCircle, 
  BarChart, 
  Settings,
  RefreshCw,
  Link as LinkIcon,
  Table,
  History,
  Circle,
  ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileSidebarContentProps {
  onClose?: () => void;
}

const MobileSidebarContent: React.FC<MobileSidebarContentProps> = ({ onClose }) => {
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Function to render a Lucide icon by name
  const renderIcon = (iconName: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      dashboard: <LayoutDashboard className="h-4 w-4 mr-2" />,
      users: <Users className="h-4 w-4 mr-2" />,
      fileText: <FileText className="h-4 w-4 mr-2" />,
      package: <Package className="h-4 w-4 mr-2" />,
      shoppingBag: <ShoppingBag className="h-4 w-4 mr-2" />,
      alertCircle: <AlertCircle className="h-4 w-4 mr-2" />,
      barChart: <BarChart className="h-4 w-4 mr-2" />,
      settings: <Settings className="h-4 w-4 mr-2" />,
      refreshCw: <RefreshCw className="h-4 w-4 mr-2" />,
      link: <LinkIcon className="h-4 w-4 mr-2" />,
      table: <Table className="h-4 w-4 mr-2" />,
      history: <History className="h-4 w-4 mr-2" />,
      clipboardList: <ClipboardList className="h-4 w-4 mr-2" />
    };
    
    return iconMap[iconName] || <Circle className="h-4 w-4 mr-2" />;
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

  // Scroll active item into view
  useEffect(() => {
    const activeItem = sidebarRef.current?.querySelector('[data-active="true"]');
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [location.pathname]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };
  
  return (
    <div className="px-3 py-2 overflow-y-auto max-h-[calc(100vh-80px)]" ref={sidebarRef}>
      <motion.div 
        className="space-y-1" 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {allNavItems.map((item) => {
          const isActiveItem = isActive(item.href);
          
          return (
            <motion.div key={item.href} variants={itemVariants}>
              <Link
                to={item.href}
                onClick={handleItemClick}
                className={cn(
                  "flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all touch-manipulation",
                  isActiveItem
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted active:scale-95"
                )}
                data-active={isActiveItem ? "true" : "false"}
              >
                <span className="flex items-center">
                  {renderIcon(item.icon)}
                  <span className="truncate">{item.title}</span>
                </span>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default MobileSidebarContent;
