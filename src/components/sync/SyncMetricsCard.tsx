
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GlSyncStats } from '@/types/glsync';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO, isValid } from 'date-fns';

interface SyncMetricsCardProps {
  syncStats: GlSyncStats[];
  isLoading: boolean;
}

const SyncMetricsCard = ({ syncStats, isLoading }: SyncMetricsCardProps) => {
  const formatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'MMM dd') : 'Invalid';
    } catch (e) {
      return 'Invalid';
    }
  };

  // Prepare chart data
  const chartData = syncStats.map(stat => ({
    ...stat,
    date: formatDate(stat.sync_date),
  })).reverse();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sync Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals from the stats
  const totalSyncs = syncStats.reduce((sum, stat) => sum + stat.syncs, 0);
  const totalRecords = syncStats.reduce((sum, stat) => sum + stat.total_records_processed, 0);
  const successRate = totalSyncs ? 
    Math.round((syncStats.reduce((sum, stat) => sum + stat.successful_syncs, 0) / totalSyncs) * 100) : 
    0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sync Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {chartData.length > 0 ? (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 20,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  width={30}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="syncs" 
                  stroke="#3b82f6" 
                  name="Syncs"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="total_records_processed" 
                  stroke="#10b981" 
                  name="Records Processed"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No sync data available
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalSyncs}</div>
            <div className="text-sm text-blue-800">Total Syncs</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalRecords}</div>
            <div className="text-sm text-green-800">Records Processed</div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">{successRate}%</div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncMetricsCard;
