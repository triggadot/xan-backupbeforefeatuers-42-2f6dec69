
import React from 'react';
import { GlMapping } from '@/types/glsync';

export interface SyncContainerProps {
  children?: React.ReactNode;
  mapping?: GlMapping;
  onSyncComplete?: () => void;
}

export function SyncContainer({ children, mapping, onSyncComplete }: SyncContainerProps) {
  return (
    <div className="container mx-auto py-3 space-y-4 max-w-full">
      {children}
    </div>
  );
}
