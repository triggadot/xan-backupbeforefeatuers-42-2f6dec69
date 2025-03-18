
import React from 'react';
import { useBusinessMetrics } from '@/hooks/useBusinessMetrics';
import BusinessMetricsCard from '@/components/dashboard/BusinessMetricsCard';
import StatusMetricsCard from '@/components/dashboard/StatusMetricsCard';

const Dashboard: React.FC = () => {
  const { metrics, statusMetrics, isLoading } = useBusinessMetrics();

  return (
    <div className="container mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      <BusinessMetricsCard metrics={metrics} isLoading={isLoading} />
      
      <StatusMetricsCard statusMetrics={statusMetrics} isLoading={isLoading} />
    </div>
  );
};

export default Dashboard;
