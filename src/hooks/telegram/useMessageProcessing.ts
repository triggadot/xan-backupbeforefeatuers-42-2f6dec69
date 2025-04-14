/**
 * Hook for processing Telegram messages through their various states.
 * Manages processing lifecycle and integration with database functions.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { MediaMessage, UpdateMediaMessageParams } from '@/types/telegram/messages';
import { OtherMessage, UpdateOtherMessageParams } from '@/types/telegram/other-messages';
import { ProcessingState } from '@/types/telegram/processing-states';
import { useCaptionParser } from './useCaptionParser';

/**
 * Interface for logging processing events
 */
interface LogEvent {
  event_type: string;
  entity_type: 'media_message' | 'text_message';
  entity_id: string;
  correlation_id: string;
  details?: Record<string, any>;
  status?: 'success' | 'failure';
  error_message?: string;
}

/**
 * Hook for managing the processing lifecycle of Telegram messages.
 */
export function useMessageProcessing() {
  const queryClient = useQueryClient();
  const { analyzeCaption } = useCaptionParser();
  
  /**
   * Log processing events to the unified_audit_logs table.
   */
  const logEvent = async (params: LogEvent): Promise<void> => {
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
  };
  
  /**
   * Process a media message by analyzing its caption and updating its state.
   */
  const processMediaMessage = useMutation({
    mutationFn: async (message: MediaMessage): Promise<MediaMessage> => {
      const correlationId = uuidv4();
      
      // Log start of processing
      await logEvent({
        event_type: 'media_message_processing_started',
        entity_type: 'media_message',
        entity_id: message.id,
        correlation_id: correlationId,
        details: { media_type: message.media_type }
      });
      
      try {
        // Update to processing state
        const { data: updatedMessage, error: updateError } = await supabase
          .from('messages')
          .update({
            processing_state: ProcessingState.PROCESSING,
            processing_started_at: new Date().toISOString(),
            processing_correlation_id: correlationId,
          })
          .eq('id', message.id)
          .select()
          .single();
          
        if (updateError) throw new Error(`Failed to update message state: ${updateError.message}`);
        
        // Analyze caption if present
        if (updatedMessage.caption) {
          const result = await analyzeCaption.mutateAsync(updatedMessage.caption);
          
          // Update with analyzed content
          const { data: processedMessage, error: processError } = await supabase
            .rpc('upsert_media_message', {
              p_id: updatedMessage.id,
              p_caption_data: result,
              p_analyzed_content: result,
              p_processing_state: ProcessingState.COMPLETED,
              p_processing_completed_at: new Date().toISOString(),
              p_processing_correlation_id: correlationId
            });
            
          if (processError) throw new Error(`Failed to process message content: ${processError.message}`);
          
          // Log successful processing
          await logEvent({
            event_type: 'media_message_processing_completed',
            entity_type: 'media_message',
            entity_id: updatedMessage.id,
            correlation_id: correlationId,
            status: 'success',
            details: { 
              media_type: updatedMessage.media_type,
              fields_identified: result.identified_fields,
              confidence_score: result.confidence_score
            }
          });
          
          // Return the processed message
          return processedMessage;
        } else {
          // No caption to process, just mark as completed
          const { data: completedMessage, error: completeError } = await supabase
            .from('messages')
            .update({
              processing_state: ProcessingState.COMPLETED,
              processing_completed_at: new Date().toISOString(),
            })
            .eq('id', updatedMessage.id)
            .select()
            .single();
            
          if (completeError) throw new Error(`Failed to complete message processing: ${completeError.message}`);
          
          // Log successful processing
          await logEvent({
            event_type: 'media_message_processing_completed',
            entity_type: 'media_message',
            entity_id: updatedMessage.id,
            correlation_id: correlationId,
            status: 'success',
            details: { media_type: updatedMessage.media_type, no_caption: true }
          });
          
          return completedMessage;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Update message to error state
        await supabase
          .from('messages')
          .update({
            processing_state: ProcessingState.ERROR,
            processing_error: errorMessage,
          })
          .eq('id', message.id);
        
        // Log error
        await logEvent({
          event_type: 'media_message_processing_failed',
          entity_type: 'media_message',
          entity_id: message.id,
          correlation_id: correlationId,
          status: 'failure',
          error_message: errorMessage,
          details: { media_type: message.media_type }
        });
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'media-messages'] });
    },
  });
  
  /**
   * Process a text message by analyzing its content and updating its state.
   */
  const processTextMessage = useMutation({
    mutationFn: async (message: OtherMessage): Promise<OtherMessage> => {
      const correlationId = uuidv4();
      
      // Log start of processing
      await logEvent({
        event_type: 'text_message_processing_started',
        entity_type: 'text_message',
        entity_id: message.id,
        correlation_id: correlationId,
        details: { message_type: message.message_type }
      });
      
      try {
        // Update to processing state
        const { data: updatedMessage, error: updateError } = await supabase
          .from('other_messages')
          .update({
            processing_state: ProcessingState.PROCESSING,
            processing_started_at: new Date().toISOString(),
            processing_correlation_id: correlationId,
          })
          .eq('id', message.id)
          .select()
          .single();
          
        if (updateError) throw new Error(`Failed to update message state: ${updateError.message}`);
        
        // Analyze text content if present
        if (updatedMessage.message_text) {
          const result = await analyzeCaption.mutateAsync(updatedMessage.message_text);
          
          // Update with analyzed content
          const { data: processedMessage, error: processError } = await supabase
            .rpc('upsert_text_message', {
              p_id: updatedMessage.id,
              p_analyzed_content: result,
              p_processing_state: ProcessingState.COMPLETED,
              p_processing_completed_at: new Date().toISOString(),
              p_processing_correlation_id: correlationId
            });
            
          if (processError) {
            // Fall back to direct table update if RPC fails
            const { data: fallbackMessage, error: fallbackError } = await supabase
              .from('other_messages')
              .update({
                analyzed_content: result,
                processing_state: ProcessingState.COMPLETED,
                processing_completed_at: new Date().toISOString(),
              })
              .eq('id', updatedMessage.id)
              .select()
              .single();
              
            if (fallbackError) throw new Error(`Failed to process message content: ${fallbackError.message}`);
            
            // Log successful processing with fallback
            await logEvent({
              event_type: 'text_message_processing_completed',
              entity_type: 'text_message',
              entity_id: updatedMessage.id,
              correlation_id: correlationId,
              status: 'success',
              details: { 
                message_type: updatedMessage.message_type,
                fields_identified: result.identified_fields,
                confidence_score: result.confidence_score,
                used_fallback: true
              }
            });
            
            return fallbackMessage;
          }
          
          // Log successful processing
          await logEvent({
            event_type: 'text_message_processing_completed',
            entity_type: 'text_message',
            entity_id: updatedMessage.id,
            correlation_id: correlationId,
            status: 'success',
            details: { 
              message_type: updatedMessage.message_type,
              fields_identified: result.identified_fields,
              confidence_score: result.confidence_score
            }
          });
          
          return processedMessage;
        } else {
          // No text to process, just mark as completed
          const { data: completedMessage, error: completeError } = await supabase
            .from('other_messages')
            .update({
              processing_state: ProcessingState.COMPLETED,
              processing_completed_at: new Date().toISOString(),
            })
            .eq('id', updatedMessage.id)
            .select()
            .single();
            
          if (completeError) throw new Error(`Failed to complete message processing: ${completeError.message}`);
          
          // Log successful processing
          await logEvent({
            event_type: 'text_message_processing_completed',
            entity_type: 'text_message',
            entity_id: updatedMessage.id,
            correlation_id: correlationId,
            status: 'success',
            details: { message_type: updatedMessage.message_type, no_text: true }
          });
          
          return completedMessage;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Update message to error state
        await supabase
          .from('other_messages')
          .update({
            processing_state: ProcessingState.ERROR,
            processing_error: errorMessage,
          })
          .eq('id', message.id);
        
        // Log error
        await logEvent({
          event_type: 'text_message_processing_failed',
          entity_type: 'text_message',
          entity_id: message.id,
          correlation_id: correlationId,
          status: 'failure',
          error_message: errorMessage,
          details: { message_type: message.message_type }
        });
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'other-messages'] });
    },
  });
  
  /**
   * Reset a message to 'initialized' state for reprocessing.
   */
  const resetMediaMessageProcessing = useMutation({
    mutationFn: async (id: string): Promise<MediaMessage> => {
      const { data, error } = await supabase
        .from('messages')
        .update({
          processing_state: ProcessingState.INITIALIZED,
          processing_started_at: null,
          processing_completed_at: null,
          processing_correlation_id: null,
          processing_error: null,
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw new Error(`Failed to reset message processing: ${error.message}`);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'media-messages'] });
    },
  });
  
  /**
   * Reset a text message to 'initialized' state for reprocessing.
   */
  const resetTextMessageProcessing = useMutation({
    mutationFn: async (id: string): Promise<OtherMessage> => {
      const { data, error } = await supabase
        .from('other_messages')
        .update({
          processing_state: ProcessingState.INITIALIZED,
          processing_started_at: null,
          processing_completed_at: null,
          processing_correlation_id: null,
          processing_error: null,
          error_message: null,
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw new Error(`Failed to reset message processing: ${error.message}`);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'other-messages'] });
    },
  });
  
  return {
    processMediaMessage,
    processTextMessage,
    resetMediaMessageProcessing,
    resetTextMessageProcessing,
    logEvent,
  };
}
