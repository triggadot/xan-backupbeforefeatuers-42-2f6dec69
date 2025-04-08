import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import { GlSyncStatus } from '@/types/glsync';

interface ActiveMappingCardProps {
  status: GlSyncStatus;
  onSync: (connectionId: string, mappingId: string, e: React.MouseEvent) => void;
  isSyncing: boolean;
}

/**
 * ActiveMappingCard component displays an individual mapping with its status and actions
 * 
 * @param status - The sync status object containing mapping details
 * @param onSync - Callback function to trigger sync operation
 * @param isSyncing - Boolean indicating if this mapping is currently syncing
 */
export default function ActiveMappingCard({ status, onSync, isSyncing }: ActiveMappingCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/sync/mapping/${status.mapping_id}`);
  };

  const handleSync = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSync(status.connection_id, status.mapping_id, e);
  };

  const getStatusBadge = () => {
    const baseClass = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium";
    
    if (status.current_status === 'processing') {
      return (
        <span className={`${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`}>
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </span>
      );
    }
    
    // Check for error status
    if (status.current_status === 'error') {
      return (
        <span className={`${baseClass} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`}>
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </span>
      );
    }
    
    if (status.last_sync_completed_at) {
      return (
        <span className={`${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>
          <CheckCircle className="h-3 w-3 mr-1" />
          Synced
        </span>
      );
    }
    
    return (
      <span className={`${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200`}>
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch (err) {
      console.error("Error formatting date:", err);
      return 'Invalid date';
    }
  };

  return (
    <Card className="h-full shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="p-4 pb-2">
        <div className="flex flex-col space-y-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base sm:text-lg truncate">
              {status.glide_table_display_name || 'Unknown Table'}
            </CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Connection: {status.app_name || 'Unknown'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex flex-col space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
          <div>
            <p className="text-muted-foreground">Last Synced:</p>
            <p className="font-medium truncate">{formatDate(status.last_sync_completed_at)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Records:</p>
            <p className="font-medium">{status.total_records || 0}</p>
          </div>
        </div>
        
        {status.current_status === 'error' && (
          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-md text-xs text-red-800 dark:text-red-200 mt-2">
            <p className="font-medium">Error:</p>
            <p className="truncate">Sync operation failed</p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 mt-2 justify-end">
          <Button 
            size="sm"
            variant="outline"
            onClick={handleViewDetails}
            className="text-xs h-8"
          >
            <FileText className="h-3 w-3 mr-1" />
            Details
          </Button>
          <Button 
            size="sm"
            onClick={handleSync}
            disabled={isSyncing || status.current_status === 'processing'}
            className="text-xs h-8"
          >
            {isSyncing || status.current_status === 'processing' ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Sync Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
