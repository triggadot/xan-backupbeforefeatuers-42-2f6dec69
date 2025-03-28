
import React from 'react';

interface DetailItemProps {
  label: string;
  value: React.ReactNode;
}

export const DetailItem: React.FC<DetailItemProps> = ({ label, value }) => {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span className="text-base">{value || "—"}</span>
    </div>
  );
};
