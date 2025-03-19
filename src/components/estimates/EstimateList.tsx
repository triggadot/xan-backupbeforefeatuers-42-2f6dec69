
import React from 'react';
import { Estimate } from '@/types/estimate';
import EstimateCard from './EstimateCard';
import { Spinner } from '@/components/ui/spinner';

interface EstimateListProps {
  estimates: Estimate[];
  isLoading: boolean;
  error: string | null;
  onViewEstimate: (estimate: Estimate) => void;
}

const EstimateList: React.FC<EstimateListProps> = ({ 
  estimates, 
  isLoading, 
  error,
  onViewEstimate
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 p-4 rounded-md text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  if (estimates.length === 0) {
    return (
      <div className="bg-muted p-8 rounded-md text-center">
        <h3 className="font-medium text-lg mb-2">No estimates found</h3>
        <p className="text-muted-foreground">Create your first estimate to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {estimates.map((estimate) => (
        <EstimateCard 
          key={estimate.id} 
          estimate={estimate} 
          onView={onViewEstimate}
        />
      ))}
    </div>
  );
};

export default EstimateList;
