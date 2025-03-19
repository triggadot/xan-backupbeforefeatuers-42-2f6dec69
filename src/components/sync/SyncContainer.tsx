
import React from 'react';
import { GlMapping } from '@/types/glsync';

export interface SyncContainerProps {
  children?: React.ReactNode;
  mapping?: GlMapping;
  onSyncComplete?: () => void;
}

export function SyncContainer({ children, mapping, onSyncComplete }: SyncContainerProps) {
  return (
    <div className="w-full py-3 space-y-4">
      {children}
    </div>
  );
}
