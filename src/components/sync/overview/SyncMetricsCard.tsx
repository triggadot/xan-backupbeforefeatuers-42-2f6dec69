import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GlSyncStats } from '@/types/glide-sync/glsync';
import { formatDateBrief } from '@/utils/date-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SyncMetricsCardProps {
  syncStats: GlSyncStats[];
  isLoading: boolean;
}

/**
 * SyncMetricsCard displays sync activity metrics with a chart and summary statistics
 * Optimized with memoization for better performance
 */
const SyncMetricsCard = ({ syncStats, isLoading }: SyncMetricsCardProps) => {
  // State for time range selection
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d' | 'all'>('7d');
  
  // Filter data based on selected time range
  const filteredStats = useMemo(() => {
    if (timeRange === 'all' || !syncStats.length) return syncStats;
    
    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo));
    
    return syncStats.filter(stat => {
      const statDate = new Date(stat.sync_date);
      return statDate >= cutoffDate;
    });
  }, [syncStats, timeRange]);

  // Prepare chart data with memoization to avoid unnecessary recalculations
  const chartData = useMemo(() => {
    return filteredStats.map(stat => ({
      ...stat,
      date: formatDateBrief(stat.sync_date),
    })).reverse();
  }, [filteredStats]);

  // Calculate metrics with memoization
  const metrics = useMemo(() => {
    const totalSyncs = filteredStats.reduce((sum, stat) => sum + stat.syncs, 0);
    const totalRecords = filteredStats.reduce((sum, stat) => sum + stat.total_records_processed, 0);
    const successfulSyncs = filteredStats.reduce((sum, stat) => sum + stat.successful_syncs, 0);
    const successRate = totalSyncs ? Math.round((successfulSyncs / totalSyncs) * 100) : 0;
    const averageRecordsPerSync = totalSyncs ? Math.round(totalRecords / totalSyncs) : 0;
    
    return {
      totalSyncs,
      totalRecords,
      successRate,
      averageRecordsPerSync,
      daysWithData: filteredStats.length
    };
  }, [filteredStats]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Sync Activity</CardTitle>
          <Select 
            value={timeRange} 
            onValueChange={(value) => setTimeRange(value as any)}
          >
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {chartData.length === 0 ? (
          <div className="h-[200px] w-full flex items-center justify-center text-muted-foreground">
            No sync data available for the selected period
          </div>
        ) : (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
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
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => {
                    // Show fewer ticks on smaller screens
                    return value;
                  }}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'syncs') return [`${value} syncs`, 'Syncs'];
                    if (name === 'total_records_processed') return [`${value} records`, 'Records'];
                    return [value, name];
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="syncs" 
                  name="Syncs"
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorSyncs)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="total_records_processed" 
                  name="Records"
                  stroke="#82ca9d" 
                  fillOpacity={1} 
                  fill="url(#colorRecords)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-md dark:bg-slate-800">
            <div className="text-sm text-muted-foreground">Total Syncs</div>
            <div className="text-2xl font-semibold mt-1">{metrics.totalSyncs}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Success Rate: {metrics.successRate}%
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-md dark:bg-slate-800">
            <div className="text-sm text-muted-foreground">Records Processed</div>
            <div className="text-2xl font-semibold mt-1">{metrics.totalRecords.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Avg: {metrics.averageRecordsPerSync} per sync
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(SyncMetricsCard);
