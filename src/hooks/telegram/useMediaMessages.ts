/**
 * Hook for fetching and manipulating media messages from the Telegram integration.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MediaMessage, CreateMediaMessageParams, UpdateMediaMessageParams } from '@/types/telegram/messages';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for fetching and managing media messages.
 */
export function useMediaMessages({
  enabled = true,
  includeProcessing = false,
  limitToChat,
  mediaType,
  withCaption,
  page = 1,
  pageSize = 20,
}: {
  enabled?: boolean;
  includeProcessing?: boolean;
  limitToChat?: number;
  mediaType?: string;
  withCaption?: boolean;
  page?: number;
  pageSize?: number;
} = {}) {
  const queryClient = useQueryClient();
  const queryKey = ['telegram', 'media-messages', limitToChat, mediaType, withCaption, page, pageSize];
  
  // Calculate pagination values
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const fetchMediaMessages = async (): Promise<{ data: MediaMessage[]; count: number }> => {
    let query = supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (limitToChat) {
      query = query.eq('chat_id', limitToChat);
    }
    
    if (mediaType) {
      query = query.eq('media_type', mediaType);
    }
    
    if (withCaption === true) {
      query = query.not('caption', 'is', null);
    } else if (withCaption === false) {
      query = query.is('caption', null);
    }
    
    if (!includeProcessing) {
      query = query.in('processing_state', ['completed', 'error', 'edited']);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching media messages:', error);
      throw new Error(`Failed to fetch media messages: ${error.message}`);
    }
    
    return { data: data || [], count: count || 0 };
  };
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: fetchMediaMessages,
    enabled,
  });
  
  /**
   * Mutation for creating a new media message.
   */
  const createMediaMessage = useMutation({
    mutationFn: async (params: CreateMediaMessageParams): Promise<MediaMessage> => {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          ...params,
          processing_state: params.processing_state || 'initialized',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();
        
      if (error) {
        console.error('Error creating media message:', error);
        throw new Error(`Failed to create media message: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'media-messages'] });
    },
  });
  
  /**
   * Mutation for updating an existing media message.
   */
  const updateMediaMessage = useMutation({
    mutationFn: async (params: UpdateMediaMessageParams): Promise<MediaMessage> => {
      const { id, ...updateData } = params;
      
      const { data, error } = await supabase
        .from('messages')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating media message:', error);
        throw new Error(`Failed to update media message: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'media-messages'] });
      queryClient.invalidateQueries({ queryKey: ['telegram', 'media-message', variables.id] });
    },
  });
  
  /**
   * Query for fetching a single media message by ID.
   */
  const useMediaMessageDetail = (id: string | undefined, enabled = true) => {
    return useQuery({
      queryKey: ['telegram', 'media-message', id],
      queryFn: async (): Promise<MediaMessage | null> => {
        if (!id) return null;
        
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          console.error('Error fetching media message detail:', error);
          throw new Error(`Failed to fetch media message detail: ${error.message}`);
        }
        
        return data;
      },
      enabled: enabled && !!id,
    });
  };
  
  /**
   * Query for fetching media message by Telegram message ID and chat ID.
   */
  const useMediaMessageByTelegramId = (
    telegramMessageId: number | undefined,
    chatId: number | undefined,
    enabled = true
  ) => {
    return useQuery({
      queryKey: ['telegram', 'media-message-by-telegram-id', telegramMessageId, chatId],
      queryFn: async (): Promise<MediaMessage | null> => {
        if (!telegramMessageId || !chatId) return null;
        
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('telegram_message_id', telegramMessageId)
          .eq('chat_id', chatId)
          .single();
          
        if (error && error.code !== 'PGRST116') { // Code for no rows returned
          console.error('Error fetching media message by Telegram ID:', error);
          throw new Error(`Failed to fetch media message by Telegram ID: ${error.message}`);
        }
        
        return data;
      },
      enabled: enabled && !!telegramMessageId && !!chatId,
    });
  };
  
  /**
   * Query for fetching messages in a media group.
   */
  const useMediaGroupMessages = (mediaGroupId: string | undefined, enabled = true) => {
    return useQuery({
      queryKey: ['telegram', 'media-group', mediaGroupId],
      queryFn: async (): Promise<MediaMessage[]> => {
        if (!mediaGroupId) return [];
        
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('media_group_id', mediaGroupId)
          .order('created_at');
          
        if (error) {
          console.error('Error fetching media group messages:', error);
          throw new Error(`Failed to fetch media group messages: ${error.message}`);
        }
        
        return data || [];
      },
      enabled: enabled && !!mediaGroupId,
    });
  };
  
  return {
    mediaMessages: data?.data || [],
    totalCount: data?.count || 0,
    isLoading,
    error,
    refetch,
    createMediaMessage,
    updateMediaMessage,
    useMediaMessageDetail,
    useMediaMessageByTelegramId,
    useMediaGroupMessages,
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
