
import React, { ReactNode } from 'react';
import { GlMapping } from '@/types/glsync';
import { Card, CardContent } from '@/components/ui/card';

interface SyncContainerProps {
  children: ReactNode;
  className?: string;
  mapping?: GlMapping;
  onSyncComplete?: () => void;
  title?: string;
}

const SyncContainer = ({ 
  children, 
  className = '', 
  mapping, 
  onSyncComplete,
  title 
}: SyncContainerProps) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {title && (
        <h2 className="text-2xl font-semibold">{title}</h2>
      )}
      {children}
    </div>
  );
};

export default SyncContainer;
