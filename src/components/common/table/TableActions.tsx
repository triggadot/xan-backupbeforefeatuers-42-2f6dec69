
import React from 'react';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TableActionsProps<T> {
  row: T;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

export function TableActions<T>({ row, onEdit, onDelete }: TableActionsProps<T>) {
  if (!onEdit && !onDelete) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row);
            }}
          >
            Edit
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row);
            }}
          >
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
