
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GlSyncStats } from '@/types/glsync';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays } from 'date-fns';

interface SyncMetricsCardProps {
  syncStats: GlSyncStats[];
  isLoading: boolean;
}

export default function SyncMetricsCard({ syncStats, isLoading }: SyncMetricsCardProps) {
  // Process data for the chart
  const chartData = syncStats.map(stat => ({
    date: format(new Date(stat.sync_date), 'MMM d'),
    successful: stat.successful_syncs,
    failed: stat.failed_syncs,
    records: stat.total_records_processed
  })).reverse();
  
  // Fill in missing dates if needed
  const today = new Date();
  const filledChartData = [...chartData];
  
  // Only add placeholder data if we have no stats
  if (filledChartData.length === 0) {
    for (let i = 6; i >= 0; i--) {
      filledChartData.push({
        date: format(subDays(today, i), 'MMM d'),
        successful: 0,
        failed: 0,
        records: 0
      });
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Sync Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filledChartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 15 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => {
                    return [`${value}`, name === 'successful' ? 'Successful' : name === 'failed' ? 'Failed' : 'Records'];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, marginTop: 10 }} />
                <Bar dataKey="successful" name="Successful" fill="#22c55e" />
                <Bar dataKey="failed" name="Failed" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Syncs</p>
            <p className="text-xl font-semibold">
              {isLoading ? (
                <Skeleton className="h-7 w-10 mx-auto" />
              ) : (
                syncStats.reduce((acc, stat) => acc + stat.syncs, 0)
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className="text-xl font-semibold">
              {isLoading ? (
                <Skeleton className="h-7 w-16 mx-auto" />
              ) : (
                (() => {
                  const total = syncStats.reduce((acc, stat) => acc + stat.syncs, 0);
                  const successful = syncStats.reduce((acc, stat) => acc + stat.successful_syncs, 0);
                  return total === 0 ? '0%' : `${Math.round((successful / total) * 100)}%`;
                })()
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Records</p>
            <p className="text-xl font-semibold">
              {isLoading ? (
                <Skeleton className="h-7 w-16 mx-auto" />
              ) : (
                syncStats.reduce((acc, stat) => acc + stat.total_records_processed, 0).toLocaleString()
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
