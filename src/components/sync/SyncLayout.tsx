
import React, { ReactNode } from 'react';

export interface SyncLayoutProps {
  children: ReactNode;
}

export const SyncLayout: React.FC<SyncLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 py-6 md:py-8 lg:py-10">
        {children}
      </main>
    </div>
  );
};

export default SyncLayout;
