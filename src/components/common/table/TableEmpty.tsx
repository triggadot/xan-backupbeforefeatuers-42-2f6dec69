
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';

interface TableEmptyProps {
  colSpan: number;
  message?: string;
}

export function TableEmpty({ colSpan, message = "No data available" }: TableEmptyProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center">
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground">{message}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}
