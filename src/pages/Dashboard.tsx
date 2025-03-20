
import React from 'react';
import { useBusinessOperations } from '@/hooks/useBusinessOperations';
import { useUnpaidInventory } from '@/hooks/useUnpaidInventory';
import BusinessMetricsCard from '@/components/dashboard/BusinessMetricsCard';
import StatusMetricsCard from '@/components/dashboard/StatusMetricsCard';
import UnpaidInventoryCard from '@/components/dashboard/UnpaidInventoryCard';

const Dashboard: React.FC = () => {
  const { metrics, statusMetrics, isLoading } = useBusinessOperations();
  const { unpaidProducts, isLoading: isLoadingUnpaid } = useUnpaidInventory();

  return (
    <div className="w-full py-4 space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2">
          <BusinessMetricsCard metrics={metrics} isLoading={isLoading} />
        </div>
        <div className="md:row-span-2">
          <UnpaidInventoryCard 
            unpaidProducts={unpaidProducts} 
            isLoading={isLoadingUnpaid} 
          />
        </div>
        <div className="md:col-span-2">
          <StatusMetricsCard statusMetrics={statusMetrics} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
