import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * @deprecated This is a temporary placeholder component.
 * The original component had TypeScript errors and will be rebuilt in a future update.
 */
interface SampleEstimatesTableProps {
  accountId: string;
}

const SampleEstimatesTable: React.FC<SampleEstimatesTableProps> = ({ accountId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sample Estimates</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          This component is temporarily disabled due to TypeScript errors.
          It will be rebuilt in an upcoming update.
        </p>
      </CardContent>
    </Card>
  );
};

export default SampleEstimatesTable;
