
import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Building, User, Store, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Account } from '@/types/accountNew';

interface AccountListProps {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
}

const AccountList: React.FC<AccountListProps> = ({ accounts, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-3/4 mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error Loading Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Accounts Found</CardTitle>
          <CardDescription>
            Try changing your search criteria or create a new account.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Customer':
        return <User className="h-4 w-4" />;
      case 'Vendor':
        return <Store className="h-4 w-4" />;
      case 'Customer & Vendor':
        return <Building className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => (
        <Card key={account.id} className="transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{account.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  {getTypeIcon(account.type)}
                  {account.type}
                </CardDescription>
              </div>
              {account.status === 'inactive' && (
                <Badge variant="outline" className="bg-gray-100 text-gray-500">
                  Inactive
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(account.is_customer || account.is_vendor) && (
                <div>
                  {account.is_customer && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Customer Balance:</span>
                      <span className={account.balance > 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                        ${Math.abs(account.balance).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {account.is_vendor && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Vendor Balance:</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                  )}
                </div>
              )}
              
              {account.email && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Email:</span>{' '}
                  <span>{account.email}</span>
                </div>
              )}
              
              {account.phone && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Phone:</span>{' '}
                  <span>{account.phone}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Link
              to={`/accounts/${account.id}`}
              className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              View Details
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default AccountList;
