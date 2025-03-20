
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GlSyncStats } from '@/types/glsync';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SyncMetricsCardProps {
  syncStats: GlSyncStats[];
  isLoading: boolean;
}

const SyncMetricsCard: React.FC<SyncMetricsCardProps> = ({ syncStats, isLoading }) => {
  const formattedStats = syncStats.map(stat => ({
    date: new Date(stat.sync_date).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    }),
    successful: stat.successful_syncs,
    failed: stat.failed_syncs,
    records: stat.total_records_processed
  })).reverse(); // Show most recent last

  // Calculate totals
  const totals = syncStats.reduce((acc, stat) => {
    acc.totalSyncs += stat.syncs;
    acc.totalSuccessful += stat.successful_syncs;
    acc.totalFailed += stat.failed_syncs;
    acc.totalRecords += stat.total_records_processed;
    return acc;
  }, { 
    totalSyncs: 0, 
    totalSuccessful: 0, 
    totalFailed: 0, 
    totalRecords: 0 
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-[200px] w-full mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {formattedStats.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No sync statistics available</p>
          </div>
        ) : (
          <>
            <div className="h-[200px] mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedStats}>
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="successful" name="Successful" fill="#10b981" />
                  <Bar dataKey="failed" name="Failed" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                <div className="text-2xl font-bold">{totals.totalSyncs}</div>
                <div className="text-sm text-muted-foreground">Total Syncs</div>
              </div>
              
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                <div className="text-2xl font-bold">{totals.totalRecords}</div>
                <div className="text-sm text-muted-foreground">Records Processed</div>
              </div>
              
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                <div className="text-2xl font-bold text-green-500">{totals.totalSuccessful}</div>
                <div className="text-sm text-muted-foreground">Successful Syncs</div>
              </div>
              
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                <div className="text-2xl font-bold text-red-500">{totals.totalFailed}</div>
                <div className="text-sm text-muted-foreground">Failed Syncs</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SyncMetricsCard;
