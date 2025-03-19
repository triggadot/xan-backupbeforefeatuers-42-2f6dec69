import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SyncLog, SyncLogFilter, UseSyncLogsOptions } from '@/types/syncLog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CheckIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface SyncLogsViewProps {
  logs: SyncLog[];
  isLoading: boolean;
  error?: string | null;
  options?: UseSyncLogsOptions;
  refetch?: () => void;
  filter?: SyncLogFilter;
  filterLogs?: (filter: SyncLogFilter) => void;
  currentFilter?: SyncLogFilter;
}

export function SyncLogsView({ logs, isLoading, error, options, refetch, filter, filterLogs, currentFilter }: SyncLogsViewProps) {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [date, setDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleStatusChange = (value: string) => {
    const newFilter: SyncLogFilter = {
      ...currentFilter,
      status: value
    };
    filterLogs(newFilter);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Sync Logs</h2>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8">
                Status <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={currentFilter?.status || 'all'} onValueChange={handleStatusChange}>
                <DropdownMenuRadioItem value="all">
                  All
                  {status === (currentFilter?.status || 'all') ? (
                    <CheckIcon className="h-4 w-4 ml-auto" />
                  ) : null}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="pending">
                  Pending
                  {status === (currentFilter?.status || 'all') ? (
                    <CheckIcon className="h-4 w-4 ml-auto" />
                  ) : null}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="running">
                  Running
                  {status === (currentFilter?.status || 'all') ? (
                    <CheckIcon className="h-4 w-4 ml-auto" />
                  ) : null}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">
                  Completed
                  {status === (currentFilter?.status || 'all') ? (
                    <CheckIcon className="h-4 w-4 ml-auto" />
                  ) : null}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="failed">
                  Failed
                  {status === (currentFilter?.status || 'all') ? (
                    <CheckIcon className="h-4 w-4 ml-auto" />
                  ) : null}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border shadow-sm"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Started At</TableHead>
            <TableHead>Completed At</TableHead>
            <TableHead>Records Processed</TableHead>
            <TableHead>Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">Loading...</TableCell>
            </TableRow>
          ) : logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">No logs found.</TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.status}</TableCell>
                <TableCell>{log.started_at}</TableCell>
                <TableCell>{log.completed_at || 'N/A'}</TableCell>
                <TableCell>{log.records_processed || '0'}</TableCell>
                <TableCell>{log.message || 'N/A'}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
