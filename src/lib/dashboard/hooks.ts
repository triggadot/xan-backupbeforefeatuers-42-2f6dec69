import { useQuery } from '@tanstack/react-query';
import {
    fetchBusinessMetrics,
    fetchBusinessStats,
    fetchChartData,
    fetchContacts,
    fetchFinancialMetrics,
    fetchRecentTransactions
} from './api';

/**
 * Hook to fetch and cache business metrics data
 */
export function useBusinessMetrics() {
  return useQuery({
    queryKey: ['businessMetrics'],
    queryFn: fetchBusinessMetrics,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch and cache overall business statistics
 */
export function useBusinessStats() {
  return useQuery({
    queryKey: ['businessStats'],
    queryFn: fetchBusinessStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch and cache transaction chart data
 */
export function useChartData(months = 8) {
  return useQuery({
    queryKey: ['chartData', months],
    queryFn: () => fetchChartData(months),
    staleTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch and cache recent transactions
 */
export function useRecentTransactions(limit = 10, timeFilter = '30d') {
  const days = convertTimeFilterToDays(timeFilter);

  return useQuery({
    queryKey: ['recentTransactions', limit, days],
    queryFn: () => fetchRecentTransactions(limit, days),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch and cache financial metrics
 */
export function useFinancialMetrics() {
  return useQuery({
    queryKey: ['financialMetrics'],
    queryFn: fetchFinancialMetrics,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch and cache contacts for quick transfer
 */
export function useContacts(limit = 5) {
  return useQuery({
    queryKey: ['contacts', limit],
    queryFn: () => fetchContacts(limit),
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Utility function to convert time filter string to days
 */
function convertTimeFilterToDays(timeFilter: string): number {
  switch (timeFilter) {
    case '7d':
      return 7;
    case '14d':
      return 14;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case '180d':
      return 180;
    case '365d':
      return 365;
    default:
      return 30;
  }
} 