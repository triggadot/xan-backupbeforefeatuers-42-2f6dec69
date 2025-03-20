
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/format-utils';
import { AccountNew } from '@/types/accountNew';

interface AccountListProps {
  accounts: AccountNew[];
  isLoading: boolean;
  error: string | null;
}

const AccountList: React.FC<AccountListProps> = ({ accounts, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <p>Error loading accounts: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground p-4">
            <p>No accounts found. Create a new account to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTypeColor = (type: string | undefined) => {
    switch(type) {
      case 'Customer': return 'bg-blue-100 text-blue-800';
      case 'Vendor': return 'bg-purple-100 text-purple-800';
      case 'Customer & Vendor': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>
                  <Link 
                    to={`/accounts/${account.id}`} 
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {account.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(account.type)}`}>
                    {account.type || 'Unknown'}
                  </span>
                </TableCell>
                <TableCell>{account.email || '-'}</TableCell>
                <TableCell>{account.phone || '-'}</TableCell>
                <TableCell className="text-right">
                  {account.balance !== undefined ? (
                    <span className={account.balance > 0 ? 'text-green-600' : account.balance < 0 ? 'text-red-600' : ''}>
                      {formatCurrency(account.balance)}
                    </span>
                  ) : (
                    '$0.00'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AccountList;
