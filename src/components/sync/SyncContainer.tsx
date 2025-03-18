
import React from 'react';
import { GlMapping } from '@/types/glsync';

export interface SyncContainerProps {
  children?: React.ReactNode;
  mapping?: GlMapping;
  onSyncComplete?: () => void;
}

export function SyncContainer({ children, mapping, onSyncComplete }: SyncContainerProps) {
  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      {children}
    </div>
  );
}
