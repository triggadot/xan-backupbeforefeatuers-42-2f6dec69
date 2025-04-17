import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { PDFGenerationFailure, DocumentType } from '@/types/documents/pdf-generation';

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Custom hook for managing PDF generation failures
 */
export function usePDFFailures() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<{
    resolved?: boolean;
    requiresManualIntervention?: boolean;
    documentType?: DocumentType;
  }>({
    resolved: false,
    requiresManualIntervention: undefined,
    documentType: undefined,
  });

  // Fetch failures based on filter
  const { 
    data: failures, 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['pdf-failures', filter],
    queryFn: async () => {
      let query = supabase
        .from('pdf_generation_failures')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filter.resolved !== undefined) {
        query = query.eq('resolved', filter.resolved);
      }
      
      if (filter.requiresManualIntervention !== undefined) {
        query = query.eq('requires_manual_intervention', filter.requiresManualIntervention);
      }
      
      if (filter.documentType) {
        query = query.eq('document_type', filter.documentType);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Error fetching PDF failures: ${error.message}`);
      }
      
      return data as PDFGenerationFailure[];
    },
  });

  // Mutation for force retrying a specific failure
  const retryMutation = useMutation({
    mutationFn: async (id: number) => {
      const failure = failures?.find(f => f.id === id);
      if (!failure) {
        throw new Error('Failure not found');
      }
      
      // Call the edge function to regenerate the PDF
      const { data, error } = await supabase.functions.invoke('pdf-backend', {
        body: {
          action: 'generate',
          documentType: failure.document_type,
          documentId: failure.document_id,
          forceRegenerate: true,
          overwriteExisting: true
        }
      });
      
      if (error) {
        throw new Error(`Error retrying PDF generation: ${error.message}`);
      }
      
      // Reset the failure tracking
      await supabase.rpc('reset_pdf_generation_failure', {
        p_document_type: failure.document_type,
        p_document_id: failure.document_id
      });
      
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['pdf-failures'] });
    }
  });

  // Mutation for resetting a failure counter
  const resetMutation = useMutation({
    mutationFn: async (id: number) => {
      const failure = failures?.find(f => f.id === id);
      if (!failure) {
        throw new Error('Failure not found');
      }
      
      // Update the failure record directly
      const { error } = await supabase
        .from('pdf_generation_failures')
        .update({
          retry_count: 0,
          requires_manual_intervention: false,
          next_attempt: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error resetting failure: ${error.message}`);
      }
      
      return true;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['pdf-failures'] });
    }
  });

  // Mutation for marking a failure as resolved
  const resolveMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('pdf_generation_failures')
        .update({
          resolved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        throw new Error(`Error resolving failure: ${error.message}`);
      }
      
      return true;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['pdf-failures'] });
    }
  });

  // Mutation for triggering a batch retry
  const batchRetryMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('pdf-backend', {
        body: {
          action: 'retry',
          maxRetries: 10,
          batchSize: 20
        }
      });
      
      if (error) {
        throw new Error(`Error triggering batch retry: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch after a brief delay to allow processing
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['pdf-failures'] });
      }, 2000);
    }
  });

  // Return the hook API
  return {
    failures,
    isLoading,
    error,
    filter,
    setFilter,
    refetch,
    actions: {
      retry: (id: number) => retryMutation.mutate(id),
      reset: (id: number) => resetMutation.mutate(id),
      resolve: (id: number) => resolveMutation.mutate(id),
      batchRetry: () => batchRetryMutation.mutate()
    },
    status: {
      isRetrying: retryMutation.isPending,
      isResetting: resetMutation.isPending,
      isResolving: resolveMutation.isPending,
      isBatchRetrying: batchRetryMutation.isPending
    }
  };
}
