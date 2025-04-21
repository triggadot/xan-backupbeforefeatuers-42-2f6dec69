import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * @deprecated This is a temporary placeholder. The original component had TypeScript errors.
 * This will be rebuilt with proper types in a future update.
 */
export const AccountDetailView: React.FC<{ accountId: string }> = ({ accountId }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Account Details</h2>
        <p>Account ID: {accountId}</p>
        <p className="mt-4 text-muted-foreground">
          This component is temporarily disabled due to TypeScript errors.
          It will be rebuilt in an upcoming update.
        </p>
      </CardContent>
    </Card>
  );
};

export default AccountDetailView;
