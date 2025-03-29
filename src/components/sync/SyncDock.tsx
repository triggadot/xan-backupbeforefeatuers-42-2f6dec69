import {
  BarChart2,
  Database,
  Layers,
  Settings,
  Activity,
  FileText,
} from 'lucide-react';
import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SyncDockProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface TabItemProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const TabItem = ({ id, title, icon, isActive, onClick }: TabItemProps) => (
  <motion.div
    className={cn(
      "flex flex-col items-center justify-center p-3 rounded-lg cursor-pointer transition-colors",
      "hover:bg-accent/50 relative",
      isActive ? "bg-primary/15 border-2 border-primary shadow-sm" : "border border-border"
    )}
    onClick={onClick}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
  >
    <div className="relative p-2">
      {icon}
      {isActive && (
        <motion.div
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"
          layoutId="activeIndicator"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </div>
    <span className="text-xs font-medium mt-1 text-center">{title}</span>
  </motion.div>
);

const syncTabs = [
  {
    id: 'overview',
    title: 'Overview',
    icon: <BarChart2 className='h-5 w-5 text-primary' />,
  },
  {
    id: 'mappings',
    title: 'Mappings',
    icon: <Layers className='h-5 w-5 text-primary' />,
  },
  {
    id: 'tables',
    title: 'Tables',
    icon: <Database className='h-5 w-5 text-primary' />,
  },
  {
    id: 'activity',
    title: 'Activity',
    icon: <Activity className='h-5 w-5 text-primary' />,
  },
  {
    id: 'logs',
    title: 'Sync Logs',
    icon: <FileText className='h-5 w-5 text-primary' />,
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: <Settings className='h-5 w-5 text-primary' />,
  },
];

export function SyncDock({ activeTab, onTabChange }: SyncDockProps) {
  const handleItemClick = useCallback((tabId: string) => {
    onTabChange(tabId);
  }, [onTabChange]);

  return (
    <div className='w-full mb-6'>
      <motion.div 
        className='flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 bg-background border border-border shadow-md rounded-xl mx-auto w-fit max-w-full overflow-x-auto'
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {syncTabs.map((tab) => (
          <TabItem
            key={tab.id}
            id={tab.id}
            title={tab.title}
            icon={tab.icon}
            isActive={activeTab === tab.id}
            onClick={() => handleItemClick(tab.id)}
          />
        ))}
      </motion.div>
    </div>
  );
}
