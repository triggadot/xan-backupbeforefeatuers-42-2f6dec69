
import React from 'react';

interface DetailItemProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export const DetailItem: React.FC<DetailItemProps> = ({ 
  label, 
  value, 
  className = '' 
}) => {
  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-base">{value || 'N/A'}</p>
    </div>
  );
};
