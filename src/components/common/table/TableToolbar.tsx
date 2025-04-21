
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, X } from 'lucide-react';

interface TableToolbarProps {
  title?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  createButtonLabel?: string;
  onCreateClick?: () => void;
}

export function TableToolbar({
  title,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search...',
  createButtonLabel = 'Create',
  onCreateClick
}: TableToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {title && <h2 className="text-lg font-semibold">{title}</h2>}
      
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 w-full sm:w-[200px] lg:w-[300px]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 rounded-full p-1 hover:bg-muted"
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Clear search</span>
            </button>
          )}
        </div>
        
        {onCreateClick && (
          <Button 
            size="sm" 
            className="whitespace-nowrap"
            onClick={onCreateClick}
          >
            <Plus className="mr-2 h-4 w-4" />
            {createButtonLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
