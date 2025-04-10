import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { DocumentType } from '@/types/pdf-generation';

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Interface for PDF generation log
interface PDFGenerationLog {
  id: number;
  trigger_source: string;
  document_type: string;
  document_id: string;
  trigger_type: string;
  error_message: string | null;
  success: boolean;
  created_at: string;
}

// Interface for PDF stats
interface PDFGenerationStats {
  totalDocuments: number;
  documentsWithPDF: number;
  documentsWithoutPDF: number;
  pdfCoverage: number;
  recentGenerations: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  };
}

// Interface to structure statistics by document type
interface DocumentTypeStats {
  [DocumentType.INVOICE]: PDFGenerationStats;
  [DocumentType.ESTIMATE]: PDFGenerationStats;
  [DocumentType.PURCHASE_ORDER]: PDFGenerationStats;
  overall: PDFGenerationStats;
}

/**
 * Custom hook for monitoring PDF generation
 */
export function usePDFMonitoring() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<DocumentType | 'all'>('all');

  // Get PDF generation logs
  const { data: logs, isLoading: isLoadingLogs, error: logsError, refetch: refetchLogs } = useQuery({
    queryKey: ['pdf-logs', timeRange, documentTypeFilter],
    queryFn: async () => {
      // Calculate date range
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default: // 24h
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      
      // Create query
      let query = supabase
        .from('pdf_generation_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
        
      // Apply document type filter if specified
      if (documentTypeFilter !== 'all') {
        query = query.eq('document_type', documentTypeFilter);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return data as PDFGenerationLog[];
    },
  });

  // Get PDF coverage statistics
  const { data: stats, isLoading: isLoadingStats, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['pdf-stats', documentTypeFilter],
    queryFn: async () => {
      // Initialize stats object
      const stats: DocumentTypeStats = {
        [DocumentType.INVOICE]: {
          totalDocuments: 0,
          documentsWithPDF: 0,
          documentsWithoutPDF: 0,
          pdfCoverage: 0,
          recentGenerations: {
            total: 0,
            successful: 0,
            failed: 0,
            successRate: 0
          }
        },
        [DocumentType.ESTIMATE]: {
          totalDocuments: 0,
          documentsWithPDF: 0,
          documentsWithoutPDF: 0,
          pdfCoverage: 0,
          recentGenerations: {
            total: 0,
            successful: 0,
            failed: 0,
            successRate: 0
          }
        },
        [DocumentType.PURCHASE_ORDER]: {
          totalDocuments: 0,
          documentsWithPDF: 0,
          documentsWithoutPDF: 0,
          pdfCoverage: 0,
          recentGenerations: {
            total: 0,
            successful: 0,
            failed: 0,
            successRate: 0
          }
        },
        overall: {
          totalDocuments: 0,
          documentsWithPDF: 0,
          documentsWithoutPDF: 0,
          pdfCoverage: 0,
          recentGenerations: {
            total: 0,
            successful: 0,
            failed: 0,
            successRate: 0
          }
        }
      };
      
      // Query for invoices stats
      const { data: invoicesData, error: invoicesError } = await supabase
        .rpc('get_pdf_coverage_stats', { 
          p_table_name: 'gl_invoices',
          p_document_type: 'invoice'
        });
        
      if (invoicesError) throw invoicesError;
      if (invoicesData) {
        stats[DocumentType.INVOICE] = {
          ...stats[DocumentType.INVOICE],
          ...invoicesData
        };
      }
      
      // Query for estimates stats
      const { data: estimatesData, error: estimatesError } = await supabase
        .rpc('get_pdf_coverage_stats', { 
          p_table_name: 'gl_estimates',
          p_document_type: 'estimate'
        });
        
      if (estimatesError) throw estimatesError;
      if (estimatesData) {
        stats[DocumentType.ESTIMATE] = {
          ...stats[DocumentType.ESTIMATE],
          ...estimatesData
        };
      }
      
      // Query for purchase orders stats
      const { data: poData, error: poError } = await supabase
        .rpc('get_pdf_coverage_stats', { 
          p_table_name: 'gl_purchase_orders',
          p_document_type: 'purchase_order'
        });
        
      if (poError) throw poError;
      if (poData) {
        stats[DocumentType.PURCHASE_ORDER] = {
          ...stats[DocumentType.PURCHASE_ORDER],
          ...poData
        };
      }
      
      // Calculate overall stats
      stats.overall = {
        totalDocuments: 
          stats[DocumentType.INVOICE].totalDocuments + 
          stats[DocumentType.ESTIMATE].totalDocuments + 
          stats[DocumentType.PURCHASE_ORDER].totalDocuments,
        documentsWithPDF: 
          stats[DocumentType.INVOICE].documentsWithPDF + 
          stats[DocumentType.ESTIMATE].documentsWithPDF + 
          stats[DocumentType.PURCHASE_ORDER].documentsWithPDF,
        documentsWithoutPDF: 
          stats[DocumentType.INVOICE].documentsWithoutPDF + 
          stats[DocumentType.ESTIMATE].documentsWithoutPDF + 
          stats[DocumentType.PURCHASE_ORDER].documentsWithoutPDF,
        pdfCoverage: 0,
        recentGenerations: {
          total: 
            stats[DocumentType.INVOICE].recentGenerations.total + 
            stats[DocumentType.ESTIMATE].recentGenerations.total + 
            stats[DocumentType.PURCHASE_ORDER].recentGenerations.total,
          successful: 
            stats[DocumentType.INVOICE].recentGenerations.successful + 
            stats[DocumentType.ESTIMATE].recentGenerations.successful + 
            stats[DocumentType.PURCHASE_ORDER].recentGenerations.successful,
          failed: 
            stats[DocumentType.INVOICE].recentGenerations.failed + 
            stats[DocumentType.ESTIMATE].recentGenerations.failed + 
            stats[DocumentType.PURCHASE_ORDER].recentGenerations.failed,
          successRate: 0
        }
      };
      
      // Calculate coverage and success rates for overall
      if (stats.overall.totalDocuments > 0) {
        stats.overall.pdfCoverage = stats.overall.documentsWithPDF / stats.overall.totalDocuments * 100;
      }
      
      if (stats.overall.recentGenerations.total > 0) {
        stats.overall.recentGenerations.successRate = 
          stats.overall.recentGenerations.successful / stats.overall.recentGenerations.total * 100;
      }
      
      return stats;
    },
  });

  // Refresh both queries
  const refresh = () => {
    refetchLogs();
    refetchStats();
  };

  return {
    logs,
    stats,
    isLoading: isLoadingLogs || isLoadingStats,
    error: logsError || statsError,
    timeRange,
    setTimeRange,
    documentTypeFilter,
    setDocumentTypeFilter,
    refresh
  };
}
