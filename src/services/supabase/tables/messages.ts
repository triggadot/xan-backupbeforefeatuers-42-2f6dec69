import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { ProcessingState } from '@/types/telegram/processing-states';

/**
 * Type definitions for messages table and related entities
 */

// Media message database record
export interface MediaMessageRecord {
  id: string;
  telegram_message_id: string;
  chat_id: string;
  message_type: string;
  media_type: string;
  caption?: string;
  caption_data?: any;
  analyzed_content?: any;
  file_id?: string;
  file_unique_id?: string;
  file_size?: number;
  width?: number;
  height?: number;
  duration?: number;
  media_url?: string;
  telegram_created_at: string;
  processing_state?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_error?: string;
  processing_correlation_id?: string;
  created_at: string;
  updated_at: string;
}

// Media message for frontend use
export interface MediaMessage extends MediaMessageRecord {
  // Additional frontend properties
  display_name?: string;
  thumbnail_url?: string;
}

// Parameters for updating a media message
export interface UpdateMediaMessageParams {
  id: string;
  caption_data?: any;
  analyzed_content?: any;
  processing_state?: ProcessingState;
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_error?: string;
  processing_correlation_id?: string;
}

// Other message database record
export interface OtherMessageRecord {
  id: string;
  telegram_message_id: string;
  chat_id: string;
  message_type: string;
  content?: string;
  analyzed_content?: any;
  telegram_created_at: string;
  processing_state?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_error?: string;
  processing_correlation_id?: string;
  created_at: string;
  updated_at: string;
}

// Other message for frontend use
export interface OtherMessage extends OtherMessageRecord {
  // Additional frontend properties
  display_name?: string;
}

// Parameters for updating an other message
export interface UpdateOtherMessageParams {
  id: string;
  analyzed_content?: any;
  processing_state?: ProcessingState;
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_error?: string;
  processing_correlation_id?: string;
}

// Filters for querying messages
export interface MessageFilters {
  messageType?: string;
  mediaType?: string;
  processingState?: ProcessingState;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

// Audit log entry
export interface LogEvent {
  event_type: string;
  entity_type: 'media_message' | 'text_message';
  entity_id: string;
  correlation_id: string;
  details?: Record<string, any>;
  status?: 'success' | 'failure';
  error_message?: string;
}

/**
 * Service for Telegram messages
 * Handles operations for messages, other_messages, and related tables
 */
export const messagesService = {
  /**
   * Get media messages with optional filtering
   */
  async getMediaMessages(filters: MessageFilters = {}): Promise<MediaMessage[]> {
    try {
      let query = supabase
        .from('messages')
        .select('*');

      // Apply filters
      if (filters.messageType) {
        query = query.eq('message_type', filters.messageType);
      }
      if (filters.mediaType) {
        query = query.eq('media_type', filters.mediaType);
      }
      if (filters.processingState) {
        query = query.eq('processing_state', filters.processingState);
      }
      if (filters.dateFrom) {
        query = query.gte('telegram_created_at', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        query = query.lte('telegram_created_at', filters.dateTo.toISOString());
      }
      if (filters.search) {
        query = query.or(
          `caption.ilike.%${filters.search}%,telegram_message_id.ilike.%${filters.search}%`
        );
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query.order('telegram_created_at', { ascending: false });

      if (error) {
        console.error('Error fetching media messages:', error);
        throw new Error(`Failed to fetch media messages: ${error.message}`);
      }

      return (data as MediaMessageRecord[]).map(message => ({
        ...message,
        display_name: `Message ${message.telegram_message_id}`,
        thumbnail_url: message.media_url
      }));
    } catch (error) {
      console.error('Error in getMediaMessages:', error);
      throw error;
    }
  },

  /**
   * Get other messages with optional filtering
   */
  async getOtherMessages(filters: MessageFilters = {}): Promise<OtherMessage[]> {
    try {
      let query = supabase
        .from('other_messages')
        .select('*');

      // Apply filters
      if (filters.messageType) {
        query = query.eq('message_type', filters.messageType);
      }
      if (filters.processingState) {
        query = query.eq('processing_state', filters.processingState);
      }
      if (filters.dateFrom) {
        query = query.gte('telegram_created_at', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        query = query.lte('telegram_created_at', filters.dateTo.toISOString());
      }
      if (filters.search) {
        query = query.or(
          `content.ilike.%${filters.search}%,telegram_message_id.ilike.%${filters.search}%`
        );
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query.order('telegram_created_at', { ascending: false });

      if (error) {
        console.error('Error fetching other messages:', error);
        throw new Error(`Failed to fetch other messages: ${error.message}`);
      }

      return (data as OtherMessageRecord[]).map(message => ({
        ...message,
        display_name: `Message ${message.telegram_message_id}`
      }));
    } catch (error) {
      console.error('Error in getOtherMessages:', error);
      throw error;
    }
  },

  /**
   * Get a single media message by ID
   */
  async getMediaMessageById(id: string): Promise<MediaMessage> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching media message:', error);
        throw new Error(`Failed to fetch media message: ${error.message}`);
      }

      if (!data) {
        throw new Error(`Media message with ID ${id} not found`);
      }

      const message = data as MediaMessageRecord;
      return {
        ...message,
        display_name: `Message ${message.telegram_message_id}`,
        thumbnail_url: message.media_url
      };
    } catch (error) {
      console.error(`Error getting media message with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get a single other message by ID
   */
  async getOtherMessageById(id: string): Promise<OtherMessage> {
    try {
      const { data, error } = await supabase
        .from('other_messages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching other message:', error);
        throw new Error(`Failed to fetch other message: ${error.message}`);
      }

      if (!data) {
        throw new Error(`Other message with ID ${id} not found`);
      }

      const message = data as OtherMessageRecord;
      return {
        ...message,
        display_name: `Message ${message.telegram_message_id}`
      };
    } catch (error) {
      console.error(`Error getting other message with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update a media message
   */
  async updateMediaMessage(params: UpdateMediaMessageParams): Promise<MediaMessage> {
    try {
      const { id, ...updateData } = params;
      
      const { data, error } = await supabase
        .from('messages')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating media message:', error);
        throw new Error(`Failed to update media message: ${error.message}`);
      }

      const message = data as MediaMessageRecord;
      return {
        ...message,
        display_name: `Message ${message.telegram_message_id}`,
        thumbnail_url: message.media_url
      };
    } catch (error) {
      console.error('Error in updateMediaMessage:', error);
      throw error;
    }
  },

  /**
   * Update an other message
   */
  async updateOtherMessage(params: UpdateOtherMessageParams): Promise<OtherMessage> {
    try {
      const { id, ...updateData } = params;
      
      const { data, error } = await supabase
        .from('other_messages')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating other message:', error);
        throw new Error(`Failed to update other message: ${error.message}`);
      }

      const message = data as OtherMessageRecord;
      return {
        ...message,
        display_name: `Message ${message.telegram_message_id}`
      };
    } catch (error) {
      console.error('Error in updateOtherMessage:', error);
      throw error;
    }
  },

  /**
   * Process a media message using RPC
   */
  async processMediaMessage(id: string, captionData: any): Promise<MediaMessage> {
    try {
      const correlationId = uuidv4();
      
      // Log the processing start
      await this.logEvent({
        event_type: 'media_message_processing_started',
        entity_type: 'media_message',
        entity_id: id,
        correlation_id: correlationId,
        details: { caption_data: captionData }
      });
      
      // Call the RPC function
      const { data, error } = await supabase
        .rpc('upsert_media_message', {
          p_id: id,
          p_caption_data: captionData,
          p_analyzed_content: captionData,
          p_processing_state: ProcessingState.COMPLETED,
          p_processing_completed_at: new Date().toISOString(),
          p_processing_correlation_id: correlationId
        });
      
      if (error) {
        throw new Error(`Failed to process media message content: ${error.message}`);
      }
      
      // Log successful processing
      await this.logEvent({
        event_type: 'media_message_processing_completed',
        entity_type: 'media_message',
        entity_id: id,
        correlation_id: correlationId,
        status: 'success',
        details: { 
          fields_identified: captionData.identified_fields,
          confidence_score: captionData.confidence_score
        }
      });
      
      // Fetch the updated record
      return await this.getMediaMessageById(id);
    } catch (error) {
      console.error('Error processing media message:', error);
      
      // Update message to error state
      await supabase
        .from('messages')
        .update({
          processing_state: ProcessingState.ERROR,
          processing_error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', id);
      
      // Log error
      await this.logEvent({
        event_type: 'media_message_processing_failed',
        entity_type: 'media_message',
        entity_id: id,
        correlation_id: uuidv4(),
        status: 'failure',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  },

  /**
   * Process a text message
   */
  async processTextMessage(id: string, analyzedContent: any): Promise<OtherMessage> {
    try {
      const correlationId = uuidv4();
      
      // Log the processing start
      await this.logEvent({
        event_type: 'text_message_processing_started',
        entity_type: 'text_message',
        entity_id: id,
        correlation_id: correlationId
      });
      
      // Update the message with analyzed content
      const { data, error } = await supabase
        .from('other_messages')
        .update({
          analyzed_content: analyzedContent,
          processing_state: ProcessingState.COMPLETED,
          processing_completed_at: new Date().toISOString(),
          processing_correlation_id: correlationId
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to process text message: ${error.message}`);
      }
      
      // Log successful processing
      await this.logEvent({
        event_type: 'text_message_processing_completed',
        entity_type: 'text_message',
        entity_id: id,
        correlation_id: correlationId,
        status: 'success'
      });
      
      const message = data as OtherMessageRecord;
      return {
        ...message,
        display_name: `Message ${message.telegram_message_id}`
      };
    } catch (error) {
      console.error('Error processing text message:', error);
      
      // Update message to error state
      await supabase
        .from('other_messages')
        .update({
          processing_state: ProcessingState.ERROR,
          processing_error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', id);
      
      // Log error
      await this.logEvent({
        event_type: 'text_message_processing_failed',
        entity_type: 'text_message',
        entity_id: id,
        correlation_id: uuidv4(),
        status: 'failure',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  },

  /**
   * Log an event to the unified_audit_logs table
   */
  async logEvent(params: LogEvent): Promise<void> {
    try {
      await supabase.from('unified_audit_logs').insert([{
        event_type: params.event_type,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        correlation_id: params.correlation_id,
        details: params.details || {},
        status: params.status || 'success',
        error_message: params.error_message,
        created_at: new Date().toISOString(),
      }]);
    } catch (error) {
      console.error('Failed to log event:', error);
      // Don't throw here to prevent cascading failures
    }
  },

  /**
   * Subscribe to real-time changes in the messages table
   */
  subscribeToMediaMessages(callback: (payload: any) => void) {
    return supabase
      .channel('media-messages-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' }, 
        callback
      )
      .subscribe();
  },

  /**
   * Subscribe to real-time changes in the other_messages table
   */
  subscribeToOtherMessages(callback: (payload: any) => void) {
    return supabase
      .channel('other-messages-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'other_messages' }, 
        callback
      )
      .subscribe();
  }
};
