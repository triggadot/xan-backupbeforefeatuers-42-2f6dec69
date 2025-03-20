import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GlSyncStats } from '@/types/glsync';
import { formatDateBrief } from '@/utils/date-utils';

interface SyncMetricsCardProps {
  syncStats: GlSyncStats[];
  isLoading: boolean;
}

const SyncMetricsCard = ({ syncStats, isLoading }: SyncMetricsCardProps) => {
  // Prepare chart data
  const chartData = syncStats.map(stat => ({
    ...stat,
    date: formatDateBrief(stat.sync_date),
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
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSyncs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRecords" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="syncs" 
                stroke="#8884d8" 
                fillOpacity={1} 
                fill="url(#colorSyncs)" 
              />
              <Area 
                type="monotone" 
                dataKey="total_records_processed" 
                stroke="#82ca9d" 
                fillOpacity={1} 
                fill="url(#colorRecords)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-md dark:bg-slate-800">
            <div className="text-sm text-muted-foreground">Total Syncs</div>
            <div className="text-2xl font-semibold mt-1">{totalSyncs}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Success Rate: {successRate}%
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-md dark:bg-slate-800">
            <div className="text-sm text-muted-foreground">Records Processed</div>
            <div className="text-2xl font-semibold mt-1">{totalRecords.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Across {syncStats.length} days
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncMetricsCard;
