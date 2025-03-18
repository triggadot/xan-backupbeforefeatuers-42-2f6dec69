
import { useState, useEffect } from 'react';
import { RefreshCw, Info, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { glSyncApi } from '@/services/glsync';
import { GlSyncLog, GlMapping, GlConnection } from '@/types/glsync';

const SyncLogs = () => {
  const [logs, setLogs] = useState<GlSyncLog[]>([]);
  const [mappings, setMappings] = useState<GlMapping[]>([]);
  const [connections, setConnections] = useState<GlConnection[]>([]);
  const [selectedMapping, setSelectedMapping] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<GlSyncLog | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [logsData, mappingsData, connectionsData] = await Promise.all([
        glSyncApi.getSyncLogs(),
        glSyncApi.getMappings(),
        glSyncApi.getConnections()
      ]);
      
      setLogs(logsData);
      setMappings(mappingsData);
      setConnections(connectionsData);
    } catch (error) {
      toast({
        title: 'Error fetching logs',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getMappingName = (mappingId: string | null) => {
    if (!mappingId) return 'System';
    
    const mapping = mappings.find(m => m.id === mappingId);
    if (!mapping) return 'Unknown';
    
    const connection = connections.find(c => c.id === mapping.connection_id);
    const appName = connection?.app_name || 'Unnamed App';
    
    return `${appName}: ${mapping.glide_table} → ${mapping.supabase_table}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      case 'started':
        return <Badge className="bg-yellow-500">Started</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'started':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (startDate: string, endDate: string | null) => {
    if (!endDate) return 'In progress';
    
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const duration = Math.floor((end - start) / 1000); // in seconds
    
    if (duration < 60) {
      return `${duration}s`;
    } else if (duration < 3600) {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const filteredLogs = logs.filter(log => {
    if (selectedMapping && log.mapping_id !== selectedMapping) {
      return false;
    }
    
    if (selectedStatus && log.status !== selectedStatus) {
      return false;
    }
    
    return true;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Sync Logs</h2>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <Card className="mb-6">
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">Filter by Mapping</label>
              <Select
                value={selectedMapping}
                onValueChange={setSelectedMapping}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All mappings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All mappings</SelectItem>
                  {mappings.map((mapping) => (
                    <SelectItem key={mapping.id} value={mapping.id}>
                      {getMappingName(mapping.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-1 block">Filter by Status</label>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="started">Started</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>
      
      {isLoading ? (
        <Card className="animate-pulse">
          <div className="p-4">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex">
                  <div className="h-5 bg-gray-200 rounded-full w-5 mr-4"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No logs found matching your filters.</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Status</TableHead>
                <TableHead>Mapping</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Records</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {getStatusIcon(log.status)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {getMappingName(log.mapping_id)}
                  </TableCell>
                  <TableCell>{formatDate(log.started_at)}</TableCell>
                  <TableCell>
                    {formatDuration(log.started_at, log.completed_at)}
                  </TableCell>
                  <TableCell>
                    {log.records_processed !== null ? log.records_processed : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Info className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <span>Sync Log Details</span>
                            {getStatusBadge(log.status)}
                          </DialogTitle>
                          <DialogDescription>
                            ID: {log.id}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 mt-4">
                          <div>
                            <h4 className="text-sm font-semibold mb-1">Mapping</h4>
                            <p>{getMappingName(log.mapping_id)}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Started</h4>
                              <p>{formatDate(log.started_at)}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Completed</h4>
                              <p>{formatDate(log.completed_at)}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Duration</h4>
                              <p>{formatDuration(log.started_at, log.completed_at)}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Records Processed</h4>
                              <p>{log.records_processed !== null ? log.records_processed : '-'}</p>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold mb-1">Message</h4>
                            <p className="text-sm p-2 bg-gray-100 rounded-md whitespace-pre-wrap">
                              {log.message || 'No message'}
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default SyncLogs;
