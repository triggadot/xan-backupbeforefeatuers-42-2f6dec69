/**
 * Hook for fetching and manipulating non-media (text) messages from the Telegram integration.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OtherMessage, CreateOtherMessageParams, UpdateOtherMessageParams } from '@/types/telegram/other-messages';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for fetching and managing non-media messages.
 */
export function useOtherMessages({
  enabled = true,
  includeProcessing = false,
  limitToChat,
  messageType,
  page = 1,
  pageSize = 20,
}: {
  enabled?: boolean;
  includeProcessing?: boolean;
  limitToChat?: number;
  messageType?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['telegram', 'other-messages', limitToChat, messageType, page, pageSize];
  
  // Calculate pagination values
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const fetchOtherMessages = async (): Promise<{ data: OtherMessage[]; count: number }> => {
    let query = supabase
      .from('other_messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (limitToChat) {
      query = query.eq('chat_id', limitToChat);
    }
    
    if (messageType) {
      query = query.eq('message_type', messageType);
    }
    
    if (!includeProcessing) {
      query = query.in('processing_state', ['completed', 'error', 'edited']);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching other messages:', error);
      throw new Error(`Failed to fetch other messages: ${error.message}`);
    }
    
    return { data: data || [], count: count || 0 };
  };
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: fetchOtherMessages,
    enabled,
  });
  
  /**
   * Mutation for creating a new non-media message.
   */
  const createOtherMessage = useMutation({
    mutationFn: async (params: CreateOtherMessageParams): Promise<OtherMessage> => {
      const { data, error } = await supabase
        .from('other_messages')
        .insert([{
          ...params,
          processing_state: params.processing_state || 'initialized',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_edited: params.is_edited || false,
        }])
        .select()
        .single();
        
      if (error) {
        console.error('Error creating other message:', error);
        throw new Error(`Failed to create other message: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'other-messages'] });
    },
  });
  
  /**
   * Mutation for updating an existing non-media message.
   */
  const updateOtherMessage = useMutation({
    mutationFn: async (params: UpdateOtherMessageParams): Promise<OtherMessage> => {
      const { id, ...updateData } = params;
      
      const { data, error } = await supabase
        .from('other_messages')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating other message:', error);
        throw new Error(`Failed to update other message: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'other-messages'] });
      queryClient.invalidateQueries({ queryKey: ['telegram', 'other-message', variables.id] });
    },
  });
  
  /**
   * Query for fetching a single non-media message by ID.
   */
  const useOtherMessageDetail = (id: string | undefined, enabled = true) => {
    return useQuery({
      queryKey: ['telegram', 'other-message', id],
      queryFn: async (): Promise<OtherMessage | null> => {
        if (!id) return null;
        
        const { data, error } = await supabase
          .from('other_messages')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          console.error('Error fetching other message detail:', error);
          throw new Error(`Failed to fetch other message detail: ${error.message}`);
        }
        
        return data;
      },
      enabled: enabled && !!id,
    });
  };
  
  /**
   * Query for fetching non-media message by Telegram message ID and chat ID.
   */
  const useOtherMessageByTelegramId = (
    telegramMessageId: number | undefined,
    chatId: number | undefined,
    enabled = true
  ) => {
    return useQuery({
      queryKey: ['telegram', 'other-message-by-telegram-id', telegramMessageId, chatId],
      queryFn: async (): Promise<OtherMessage | null> => {
        if (!telegramMessageId || !chatId) return null;
        
        const { data, error } = await supabase
          .from('other_messages')
          .select('*')
          .eq('telegram_message_id', telegramMessageId)
          .eq('chat_id', chatId)
          .single();
          
        if (error && error.code !== 'PGRST116') { // Code for no rows returned
          console.error('Error fetching other message by Telegram ID:', error);
          throw new Error(`Failed to fetch other message by Telegram ID: ${error.message}`);
        }
        
        return data;
      },
      enabled: enabled && !!telegramMessageId && !!chatId,
    });
  };
  
  return {
    otherMessages: data?.data || [],
    totalCount: data?.count || 0,
    isLoading,
    error,
    refetch,
    createOtherMessage,
    updateOtherMessage,
    useOtherMessageDetail,
    useOtherMessageByTelegramId,
    // Helper for pagination
    pagination: {
      page,
      pageSize,
      totalPages: Math.ceil((data?.count || 0) / pageSize),
      from: from + 1,
      to: Math.min(to + 1, data?.count || 0),
    }
  };
}
