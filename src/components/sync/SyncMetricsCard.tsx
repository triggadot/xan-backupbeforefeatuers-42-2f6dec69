
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, BarChart2 } from 'lucide-react';
import { GlSyncStats } from '@/types/glsync';
import { formatTimestamp } from '@/utils/glsync-transformers';

interface SyncMetricsCardProps {
  syncStats: GlSyncStats | null;
  isLoading: boolean;
}

const SyncMetricsCard: React.FC<SyncMetricsCardProps> = ({ syncStats, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Sync Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!syncStats) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Sync Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">No sync statistics available yet.</p>
            <p className="text-xs text-muted-foreground mt-2">Statistics will appear after sync operations.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const successRate = syncStats.syncs > 0 
    ? Math.round((syncStats.successful_syncs / syncStats.syncs) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Today's Sync Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Updated:</span>
            <span className="text-sm font-medium">{formatTimestamp(syncStats.sync_date)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 p-3 rounded-md">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Total Syncs</span>
              </div>
              <p className="text-2xl font-bold mt-1">{syncStats.syncs}</p>
            </div>
            
            <div className="bg-gray-100 p-3 rounded-md">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Success Rate</span>
              </div>
              <p className="text-2xl font-bold mt-1">{successRate}%</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 p-3 rounded-md">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Successful</span>
              </div>
              <p className="text-2xl font-bold mt-1">{syncStats.successful_syncs}</p>
            </div>
            
            <div className="bg-gray-100 p-3 rounded-md">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Failed</span>
              </div>
              <p className="text-2xl font-bold mt-1">{syncStats.failed_syncs}</p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="flex items-center space-x-2">
              <BarChart2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Records Processed</span>
            </div>
            <p className="text-2xl font-bold mt-1">{syncStats.total_records_processed.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncMetricsCard;
