
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface SyncMetrics {
  sync_date: string;
  syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  total_records_processed: number;
}

interface SyncMonitoringChartProps {
  mappingId?: string;
}

export function SyncMonitoringChart({ mappingId }: SyncMonitoringChartProps) {
  const [metrics, setMetrics] = useState<SyncMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      setIsLoading(true);
      try {
        let query = supabase
          .from('gl_sync_stats')
          .select('*')
          .order('sync_date', { ascending: false })
          .limit(10);

        const { data, error } = await query;
        
        if (error) throw error;
        
        // Transform the data for the chart
        const formattedData = (data || []).map((item: any) => ({
          ...item,
          sync_date: new Date(item.sync_date).toLocaleDateString(),
        })).reverse();
        
        setMetrics(formattedData);
      } catch (error) {
        console.error('Error fetching sync metrics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetrics();
  }, [mappingId]);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-muted-foreground">Loading metrics...</p>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-muted-foreground">No metrics data available</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sync_date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="successful_syncs" name="Successful" fill="#10b981" />
              <Bar dataKey="failed_syncs" name="Failed" fill="#ef4444" />
              <Bar dataKey="total_records_processed" name="Records Processed" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
