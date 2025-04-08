import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Mapping } from '@/types/syncLog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from 'lucide-react';

/**
 * Props for the TableMappingPanel component
 */
interface TableMappingPanelProps {
  mappings: Mapping[];
  onSelectTable: (tableName: string) => void;
  onEditMapping: (mapping: Mapping) => void;
  onToggleEnabled: (mapping: Mapping) => void;
  onDeleteMapping: (id: string) => void;
  isLoading: boolean;
}

/**
 * TableMappingPanel component for displaying and managing table mappings
 * 
 * This component provides a grid view of all mapped tables with options to
 * view data, edit mappings, and toggle mapping status.
 * 
 * @param {Object} props - Component props
 * @returns {JSX.Element} Table mapping panel component
 */
export function TableMappingPanel({
  mappings,
  onSelectTable,
  onEditMapping,
  onToggleEnabled,
  onDeleteMapping,
  isLoading
}: TableMappingPanelProps) {
  // Group mappings by supabase table to avoid duplicates
  const uniqueTables = new Map<string, Mapping>();
  mappings.forEach(mapping => {
    if (mapping.supabase_table && !uniqueTables.has(mapping.supabase_table)) {
      uniqueTables.set(mapping.supabase_table, mapping);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Table Management</CardTitle>
        <CardDescription>
          View and manage synchronized tables
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : uniqueTables.size === 0 ? (
          <div className="text-center py-12">
            <Database className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Tables Found</h3>
            <p className="text-muted-foreground">
              Create a new mapping to start synchronizing data
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(uniqueTables.values()).map(mapping => (
              <Card 
                key={mapping.supabase_table} 
                className="overflow-hidden border-2 hover:border-primary/50 transition-colors"
              >
                <CardHeader className="pb-2 flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center">
                      {mapping.glide_table_display_name || mapping.supabase_table}
                      {mapping.enabled ? (
                        <Badge className="ml-2" variant="default">Active</Badge>
                      ) : (
                        <Badge className="ml-2" variant="outline">Disabled</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {mapping.supabase_table}
                    </CardDescription>
                  </div>
                  <div className="flex">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Mapping</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this mapping? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => onDeleteMapping(mapping.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Columns:</span> {Object.keys(mapping.column_mappings).length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Direction:</span> {mapping.sync_direction}
                    </div>
                    <div className="flex justify-between mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onEditMapping(mapping)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => onSelectTable(mapping.supabase_table)}
                      >
                        <Database className="mr-2 h-4 w-4" />
                        View Data
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
