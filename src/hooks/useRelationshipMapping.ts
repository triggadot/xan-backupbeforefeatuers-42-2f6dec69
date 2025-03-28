
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { asTable } from '@/types/supabase';

interface RelationshipMappingResult {
  success: boolean;
  result?: any;
  error?: string;
}

interface RelationshipStatus {
  tables: string[];
  pendingCount: number;
  mappedCount: number;
}

export function useRelationshipMapping() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus | null>(null);
  const { toast } = useToast();

  const checkRelationshipStatus = useCallback(async (): Promise<void> => {
    try {
      // Get pending relationships count
      const { data: pendingResult, error: pendingError } = await supabase
        .from('gl_relationship_mapping_log')
        .select('count')
        .eq('status', 'pending');
      
      if (pendingError) throw pendingError;
      
      // Get mapped relationships count
      const { data: mappedResult, error: mappedError } = await supabase
        .from('gl_relationship_mapping_log')
        .select('count')
        .eq('status', 'completed');
        
      if (mappedError) throw mappedError;
      
      // Safely extract counts
      const pendingCount = pendingResult && pendingResult.length > 0 ? Number(pendingResult[0]?.count || 0) : 0;
      const mappedCount = mappedResult && mappedResult.length > 0 ? Number(mappedResult[0]?.count || 0) : 0;
      
      // Validate which tables have data
      const validation = await validateRelationships();
      
      setRelationshipStatus({
        tables: validation.validTables,
        pendingCount,
        mappedCount
      });
      
    } catch (error) {
      console.error('Error checking relationship status:', error);
    }
  }, []);

  const validateRelationships = async (): Promise<{
    success: boolean;
    validTables: string[];
    error?: string;
  }> => {
    try {
      // Get a list of tables with pending relationships
      const { data, error } = await supabase
        .from('gl_relationship_mappings')
        .select('supabase_table, target_table')
        .eq('enabled', true);
      
      if (error) {
        console.error('Error fetching relationship mappings:', error);
        return { success: false, validTables: [], error: error.message };
      }

      const tables = [...new Set([
        ...(data?.map(d => d.supabase_table) || []),
        ...(data?.map(d => d.target_table) || [])
      ])];

      // Check if tables have data
      const validTables: string[] = [];
      
      for (const table of tables) {
        try {
          // Use a type-safe approach to query the table
          const { count, error: countError } = await supabase
            .from(asTable(table))
            .select('*', { count: 'exact', head: true });
          
          if (!countError && (count || 0) > 0) {
            validTables.push(table);
          }
        } catch (e) {
          console.warn(`Could not check table ${table}: `, e);
          // Continue with other tables
        }
      }

      return { 
        success: true, 
        validTables 
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error validating relationships';
      console.error('Error validating relationships:', err);
      return { success: false, validTables: [], error: errorMessage };
    }
  };

  const mapRelationships = async (tableFilter?: string): Promise<RelationshipMappingResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await checkRelationshipStatus();
      
      // Call the SQL function to map all relationships
      const { data, error } = await supabase.rpc('map_all_sb_relationships', {
        p_table_filter: tableFilter || null
      });

      if (error) {
        setError('Relationship mapping failed: ' + error.message);
        toast({
          title: 'Mapping Failed',
          description: 'Failed to map relationships between tables: ' + error.message,
          variant: 'destructive',
        });
        return { success: false, error: error.message };
      } else {
        toast({
          title: 'Mapping Successful',
          description: 'Relationships mapped successfully.',
        });
        console.log('Mapping result:', data);
        await checkRelationshipStatus();
        return { success: true, result: data };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during relationship mapping';
      setError(errorMessage);
      toast({
        title: 'Mapping Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mapRelationships,
    checkRelationshipStatus,
    relationshipStatus,
    isLoading,
    error
  };
}
