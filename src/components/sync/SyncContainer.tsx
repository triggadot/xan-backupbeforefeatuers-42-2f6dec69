
import React from 'react';

interface SyncContainerProps {
  children: React.ReactNode;
}

export function SyncContainer({ children }: SyncContainerProps) {
  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      {children}
    </div>
  );
}
