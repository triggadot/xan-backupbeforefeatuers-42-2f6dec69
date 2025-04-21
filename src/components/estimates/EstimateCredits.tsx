
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EstimateCreditData } from '@/types/estimates';

interface EstimateCreditsProps {
  credits: Array<EstimateCreditData & { id: string }>;
}

export function EstimateCredits({ credits }: EstimateCreditsProps) {
  if (!credits || credits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credits History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No credits have been recorded for this estimate.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credits History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="hidden md:table-cell">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {credits.map((credit) => (
              <TableRow key={credit.id}>
                <TableCell>{credit.date ? format(new Date(credit.date), 'MMM d, yyyy') : 'N/A'}</TableCell>
                <TableCell>${credit.amount.toFixed(2)}</TableCell>
                <TableCell>{credit.paymentType || 'N/A'}</TableCell>
                <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                  {credit.notes || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
