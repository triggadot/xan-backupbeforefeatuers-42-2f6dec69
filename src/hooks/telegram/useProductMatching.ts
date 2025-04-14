/**
 * Hook for matching Telegram media messages with products in the gl_products table.
 * This is the core integration component between Telegram media and product data.
 */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MediaMessage } from '@/types/telegram/messages';
import { CaptionData } from '@/types/telegram/caption-data';

// Raw SQL query type for accessing tables not in TypeScript definitions
const executeRawQuery = async <T extends Record<string, any>>(
  query: string,
  params?: Record<string, any>
): Promise<T[]> => {
  const { data, error } = await supabase.rpc('execute_sql', {
    query_text: query,
    query_params: params || {}
  });

  if (error) {
    console.error('Error executing raw query:', error);
    throw error;
  }

  return data || [];
};

/**
 * Interface for a matched product result from gl_products
 */
export interface MatchedProduct {
  id: string;
  glide_row_id: string;
  vendor_product_name?: string;
  new_product_name?: string;
  display_name?: string;
  product_purchase_date?: string;
  rowid_accounts?: string;
  match_score?: number;
  match_reason?: string;
}

/**
 * Match type options
 */
export enum MatchType {
  EXACT = 'exact',
  FUZZY = 'fuzzy',
  MANUAL = 'manual',
  NONE = 'none'
}

/**
 * Interface for match details
 */
export interface MatchDetails {
  matchType: MatchType;
  score?: number;
  reasons?: string[];
  purchaseDateDifference?: number; // in days
}

/**
 * Hook for matching Telegram messages with products and managing the relationship.
 */
export function useProductMatching() {
  const queryClient = useQueryClient();
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<MediaMessage | null>(null);
  
  /**
   * Find potential product matches for a media message based on caption data.
   */
  const findProductMatches = useQuery({
    queryKey: ['telegram', 'product-matches', currentMessage?.id],
    queryFn: async (): Promise<MatchedProduct[]> => {
      if (!currentMessage) return [];
      
      const captionData = currentMessage.caption_data || currentMessage.analyzed_content;
      if (!captionData) return [];
      
      const { vendor_uid, product_name, product_code, purchase_date } = captionData;
      
      if (!vendor_uid && !product_name) {
        return [];
      }
      
      // Build the query based on available data
      let query = supabase.from('gl_products').select('*');
      
      // If we have a vendor UID, try to match to accounts first
      if (vendor_uid) {
        const { data: accounts } = await supabase
          .from('gl_accounts')
          .select('glide_row_id')
          .ilike('account_name', `%${vendor_uid}%`);
          
        if (accounts && accounts.length > 0) {
          const accountIds = accounts.map(a => a.glide_row_id);
          query = query.in('rowid_accounts', accountIds);
        }
      }
      
      // Add purchase date proximity filter if available (with 4-day window)
      if (purchase_date) {
        const parsedDate = new Date(purchase_date);
        const fourDaysBefore = new Date(parsedDate);
        fourDaysBefore.setDate(parsedDate.getDate() - 4);
        
        const fourDaysAfter = new Date(parsedDate);
        fourDaysAfter.setDate(parsedDate.getDate() + 4);
        
        query = query.gte('product_purchase_date', fourDaysBefore.toISOString().split('T')[0])
                     .lte('product_purchase_date', fourDaysAfter.toISOString().split('T')[0]);
      }
      
      // Execute the query
      const { data: products, error } = await query;
      
      if (error) {
        console.error('Error finding product matches:', error);
        return [];
      }
      
      if (!products || products.length === 0) {
        return [];
      }
      
      // Score and rank the product matches
      const scoredProducts = products.map(product => {
        let score = 0;
        const reasons: string[] = [];
        
        // Score for vendor match (already filtered in query)
        if (vendor_uid) {
          score += 30;
          reasons.push('Vendor matched');
        }
        
        // Score for purchase date proximity
        if (purchase_date && product.product_purchase_date) {
          const messageDate = new Date(purchase_date);
          const productDate = new Date(product.product_purchase_date);
          const daysDifference = Math.abs(
            Math.floor((messageDate.getTime() - productDate.getTime()) / (1000 * 60 * 60 * 24))
          );
          
          if (daysDifference === 0) {
            score += 30;
            reasons.push('Exact purchase date match');
          } else if (daysDifference <= 2) {
            score += 20;
            reasons.push(`Purchase date close (${daysDifference} day${daysDifference > 1 ? 's' : ''} difference)`);
          } else if (daysDifference <= 4) {
            score += 10;
            reasons.push(`Purchase date within window (${daysDifference} days difference)`);
          }
        }
        
        // Score for product name similarity
        if (product_name) {
          // Check various product name fields
          const vendorProductName = product.vendor_product_name || '';
          const newProductName = product.new_product_name || '';
          const displayName = product.display_name || '';
          
          if (vendorProductName.toLowerCase().includes(product_name.toLowerCase()) ||
              newProductName.toLowerCase().includes(product_name.toLowerCase()) ||
              displayName.toLowerCase().includes(product_name.toLowerCase())) {
            score += 40;
            reasons.push('Product name match');
          }
        }
        
        // Score for product code/SKU match (strongest indicator)
        // Access the product code via vendor_product_name or other available fields
        const productIdentifier = captionData.product_code || captionData.product_sku;
        if (productIdentifier && 
            (vendor_uid && vendor_uid === product.rowid_accounts || 
             product.vendor_product_name?.includes(productIdentifier))) {
          score += 50;
          reasons.push('Product identifier match');
        }
        
        return {
          ...product,
          match_score: score,
          match_reason: reasons.join(', ')
        };
      });
      
      // Sort by score descending
      return scoredProducts
        .filter(product => product.match_score > 0)
        .sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
    },
    enabled: false, // Don't run automatically
  });
  
  /**
   * Link a media message to a product by updating the message record.
   */
  const linkMessageToProduct = useMutation({
    mutationFn: async ({
      messageId,
      productGlideRowId,
      matchType = MatchType.MANUAL
    }: {
      messageId: string,
      productGlideRowId: string,
      matchType?: MatchType
    }) => {
      // Use raw SQL for tables not in TypeScript definitions
      const query = `
        UPDATE messages 
        SET glide_row_id = $1, 
            updated_at = $2 
        WHERE id = $3 
        RETURNING *
      `;
      
      const params = {
        1: productGlideRowId,
        2: new Date().toISOString(),
        3: messageId
      };
      
      try {
        const result = await executeRawQuery(query, params);
        return result[0];
      } catch (error) {
        console.error('Error linking message to product:', error);
        throw new Error(`Failed to link message to product: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram', 'media-messages'] });
    },
  });
  
  /**
   * Find media messages for a specific product by its glide_row_id.
   */
  const useProductMedia = (productGlideRowId: string | undefined, enabled = true) => {
    return useQuery({
      queryKey: ['telegram', 'product-media', productGlideRowId],
      queryFn: async (): Promise<MediaMessage[]> => {
        if (!productGlideRowId) return [];
        
        // Use raw SQL for tables not in TypeScript definitions
        const query = `
          SELECT * FROM messages 
          WHERE glide_row_id = $1 
          ORDER BY created_at DESC
        `;
        
        const params = { 1: productGlideRowId };
        
        try {
          const result = await executeRawQuery<MediaMessage>(query, params);
          return result;
        } catch (error) {
          console.error('Error fetching product media:', error);
          throw new Error(`Failed to fetch product media: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      enabled: enabled && !!productGlideRowId,
    });
  };
  
  /**
   * Start the matching process for a specific message.
   */
  const startMatching = async (message: MediaMessage) => {
    setMatchingInProgress(true);
    setCurrentMessage(message);
    try {
      await findProductMatches.refetch();
    } finally {
      setMatchingInProgress(false);
    }
  };
  
  return {
    findProductMatches: {
      ...findProductMatches,
      startMatching,
    },
    linkMessageToProduct,
    useProductMedia,
    matchingInProgress,
    currentMessage
  };
}
