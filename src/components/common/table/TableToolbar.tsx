
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TableToolbarProps {
  title: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  createButtonLabel?: string;
  onCreateClick?: () => void;
}

export function TableToolbar({
  title,
  searchTerm,
  onSearchChange,
  searchPlaceholder,
  createButtonLabel,
  onCreateClick,
}: TableToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      
      <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            className="pl-9"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        {onCreateClick && (
          <Button onClick={onCreateClick} className="hover-lift">
            {createButtonLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
