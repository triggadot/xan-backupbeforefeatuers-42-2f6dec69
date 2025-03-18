
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlSyncStats } from '@/types/glsync';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';

interface SyncMetricsCardProps {
  syncStats: GlSyncStats[];
  isLoading: boolean;
}

export function SyncMetricsCard({ syncStats, isLoading }: SyncMetricsCardProps) {
  const chartData = syncStats.map(stat => ({
    date: format(parseISO(stat.sync_date), 'MMM d'),
    successful: stat.successful_syncs,
    failed: stat.failed_syncs,
    records: stat.total_records_processed,
  })).reverse();

  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle>Sync Performance</CardTitle>
        <CardDescription>
          Number of successful and failed syncs over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full h-[300px] flex items-center justify-center">
            <Skeleton className="h-[250px] w-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">
            No sync data available yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="successful" name="Successful Syncs" fill="#16a34a" />
              <Bar yAxisId="left" dataKey="failed" name="Failed Syncs" fill="#ef4444" />
              <Bar yAxisId="right" dataKey="records" name="Records Processed" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
