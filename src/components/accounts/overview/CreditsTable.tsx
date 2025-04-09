import React from 'react';
import { Credit } from '@/hooks/accounts/useAccountOverview';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { AmountDisplay } from '@/components/shared/AmountDisplay';
import { format } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface CreditsTableProps {
  credits: Credit[];
}

/**
 * Displays a table of credits associated with estimates
 */
export const CreditsTable: React.FC<CreditsTableProps> = ({ credits }) => {
  if (credits.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No credits found for this account.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {credits.map(credit => (
            <TableRow key={credit.id} className="hover:bg-muted/50">
              <TableCell>
                {credit.credit_date ? format(new Date(credit.credit_date), 'MMM d, yyyy') : '-'}
              </TableCell>
              <TableCell className="max-w-md truncate">
                {credit.notes || '-'}
              </TableCell>
              <TableCell className="text-right">
                <AmountDisplay 
                  amount={credit.credit_amount || 0} 
                  variant="success" 
                />
              </TableCell>
              <TableCell>
                {credit.rowid_estimates && (
                  <Link to={`/estimates/${credit.rowid_estimates}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink size={16} />
                    </Button>
                  </Link>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
