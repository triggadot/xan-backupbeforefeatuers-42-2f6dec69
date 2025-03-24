import React, { ReactNode } from 'react';
import { GlMapping } from '@/types/glsync';

interface SyncContainerProps {
  children: ReactNode;
  className?: string;
  mapping?: GlMapping;
  onSyncComplete?: () => void;
}

const SyncContainer = ({ children, className = '', mapping, onSyncComplete }: SyncContainerProps) => {
  return (
    <div className={`space-y-6 bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
};

export default SyncContainer;
