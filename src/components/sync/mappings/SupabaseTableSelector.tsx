
import React, { useState, useEffect } from 'react';
import { useSupabaseTables } from '@/hooks/useSupabaseTables';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle, Database } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateTableForm } from './CreateTableForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SupabaseTableSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  connectionId?: string;
  glideTable?: string;
  glideTableDisplayName?: string;
  onSuccess?: () => void;
}

export const SupabaseTableSelector: React.FC<SupabaseTableSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  connectionId,
  glideTable,
  glideTableDisplayName,
  onSuccess
}) => {
  const { tables, isLoading, error, refreshTables } = useSupabaseTables();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    // Update the compact view based on window size
    const handleResize = () => {
      setIsCompact(window.innerWidth < 768);
    };

    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreateTable = (tableName: string) => {
    refreshTables();
    onChange(tableName);
    setCreateDialogOpen(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  if (error) {
    return <div className="text-destructive text-sm">{error}</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="flex flex-1 items-center space-x-2">
            <Select
              value={value}
              onValueChange={onChange}
              disabled={disabled || isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  {tables.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setCreateDialogOpen(true)}
              disabled={disabled}
              className={isCompact ? 'w-10 h-10 p-0' : ''}
              title="Create new table"
            >
              <PlusCircle className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Create Table from Glide Schema
            </DialogTitle>
          </DialogHeader>
          
          <CreateTableForm 
            onSuccess={handleCreateTable}
            onCancel={() => setCreateDialogOpen(false)}
            isCompact={isCompact}
            connectionId={connectionId}
            glideTable={glideTable}
            glideTableDisplayName={glideTableDisplayName}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
