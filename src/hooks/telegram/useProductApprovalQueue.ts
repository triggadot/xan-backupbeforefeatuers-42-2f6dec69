import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { ApprovalStatus } from '@/types/telegram/product-matching';

type ProductApprovalQueueFilters = {
  status?: ApprovalStatus;
  limit?: number;
  offset?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  vendorId?: string;
};

export interface ProductApprovalResponse {
  success: boolean;
  total_count: number;
  returned_count: number;
  offset: number;
  limit: number;
  status: ApprovalStatus;
  items: ApprovalQueueItem[];
}

export interface ApprovalQueueItem {
  id: string;
  message_id: string;
  status: ApprovalStatus;
  suggested_product_name?: string;
  suggested_vendor_uid?: string;
  suggested_purchase_date?: string;
  suggested_purchase_order_uid?: string;
  best_match_product_id?: string;
  best_match_score?: number;
  best_match_reasons?: Record<string, any>;
  created_at: string;
  processed_at?: string;
  processed_by?: string;
  processed_by_email?: string;
  notes?: string;
  message_details: {
    caption?: string;
    public_url?: string;
    mime_type?: string;
    message_date?: string;
  };
}

/**
 * Hook to fetch products pending approval from Telegram messages
 */
export const useProductApprovalQueue = (filters: ProductApprovalQueueFilters = {}) => {
  const {
    status = 'pending',
    limit = 20,
    offset = 0,
    search,
    dateFrom,
    dateTo,
    vendorId
  } = filters;

  return useQuery<ProductApprovalResponse>(
    ['product-approval-queue', status, limit, offset, search, dateFrom, dateTo, vendorId],
    async () => {
      const { data, error } = await supabase.rpc('get_product_approval_queue', {
        p_status: status,
        p_limit: limit,
        p_offset: offset,
        p_search: search || '',
        p_date_from: dateFrom || '',
        p_date_to: dateTo || '',
        p_vendor_id: vendorId || ''
      });

      if (error) throw error;
      return data as ProductApprovalResponse;
    },
    {
      keepPreviousData: true,
      staleTime: 10000 // 10 seconds
    }
  );
};

/**
 * Hook to approve a product match
 */
export const useApproveProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    async ({ queueId, productId }: { queueId: string; productId: string }) => {
      const { data, error } = await supabase.rpc('approve_product_from_queue', {
        p_queue_id: queueId,
        p_product_id: productId
      });

      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['product-approval-queue']);
      }
    }
  );
};

/**
 * Hook to reject a product match
 */
export const useRejectProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    async ({ queueId, reason }: { queueId: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('reject_product_from_queue', {
        p_queue_id: queueId,
        p_reason: reason
      });

      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['product-approval-queue']);
      }
    }
  );
};

/**
 * Hook to create a new product from a queue item
 */
export const useCreateProductFromQueue = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    async ({ 
      queueId, 
      productData 
    }: { 
      queueId: string; 
      productData: {
        product_name: string;
        vendor_id?: string;
        purchase_date?: string;
        purchase_order_id?: string;
        product_code?: string;
        description?: string;
        category?: string;
        price?: number;
      } 
    }) => {
      const { data, error } = await supabase.rpc('create_product_from_queue', {
        p_queue_id: queueId,
        p_product_data: productData
      });

      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['product-approval-queue']);
      }
    }
  );
};

/**
 * Hook to handle batch operations on the approval queue
 */
export const useBatchApprovalOperations = () => {
  const queryClient = useQueryClient();
  
  return useMutation(
    async ({ 
      queueIds, 
      action,
      productId,
      reason
    }: {
      queueIds: string[];
      action: 'approve' | 'reject';
      productId?: string;
      reason?: string;
    }) => {
      if (queueIds.length === 0) {
        throw new Error('No items selected');
      }

      const { data, error } = await supabase.rpc('batch_process_approval_queue', {
        p_queue_ids: queueIds,
        p_action: action,
        p_product_id: productId || null,
        p_reason: reason || null
      });

      if (error) throw error;
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['product-approval-queue']);
      }
    }
  );
};
