
import React from 'react';

interface SyncLayoutProps {
  children: React.ReactNode;
}

const SyncLayout: React.FC<SyncLayoutProps> = ({ children }) => {
  return (
    <div className="h-full flex flex-col">
      {children}
    </div>
  );
};

export default SyncLayout;
