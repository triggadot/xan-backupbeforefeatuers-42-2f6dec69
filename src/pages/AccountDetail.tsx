import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Trash, MoreHorizontal, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAccount } from '@/hooks/useAccount';
const AccountDetail: React.FC = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    account,
    isLoading,
    error
  } = useAccount(id || '');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const handleDeleteAccount = async () => {
    // replace with your actual delete functionality
    console.log("Deleting account:", id);
    // navigate back after delete
    navigate('/accounts');
  };
  if (isLoading) {
    return <div className="container py-8 max-w-5xl">
        <div className="flex justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full mb-8" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div>
            <Skeleton className="h-40 w-full mb-6" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      </div>;
  }
  if (error || !account) {
    return <div className="container py-8 max-w-5xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Failed to load account details"}
          </AlertDescription>
        </Alert>
      </div>;
  }
  return <div className="container py-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{account.name}</h1>
          <p className="text-muted-foreground">
            {account.type} • {account.status === 'active' ? 'Active' : 'Inactive'}
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal className="h-4 w-4 mr-2" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/accounts/${account.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash className="h-4 w-4 mr-2" />
              Delete Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                  <p>{account.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Type</h3>
                  <p className="capitalize">{account.type}</p>
                </div>
                
                <div>
                  
                  
                </div>
                
                <div>
                  
                  
                </div>
                
                <div>
                  
                  
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <Badge variant={account.status === 'active' ? "default" : "outline"} className="capitalize bg-emerald-500">
                    {account.status}
                  </Badge>
                </div>
                
                <div className="col-span-full">
                  
                  
                </div>
                
                <div className="col-span-full">
                  
                  
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Related Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No recent transactions found.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-8">
          {/* Account Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Balance</h3>
                  <p className="text-2xl font-bold">${account.balance.toFixed(2)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Invoices</h3>
                    <p className="text-lg font-semibold">0</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Payments</h3>
                    <p className="text-lg font-semibold">0</p>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button variant="outline" className="w-full" onClick={() => navigate('/invoices/new', {
                  state: {
                    customerId: account.id
                  }
                })}>
                    Create Invoice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                No recent activity found.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account "{account.name}" and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteAccount}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default AccountDetail;