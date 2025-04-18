
import { supabase } from '@/integrations/supabase/client';
import * as Types from '@/services/types';

export const ProductsService = {
  /**
   * Fetch a single product by ID
   */
  async getById(id: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('gl_products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching product:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Exception fetching product:', error);
      return null;
    }
  },

  /**
   * Fetch products with optional filters
   */
  async getProducts(
    filters?: any, 
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: any[], count: number }> {
    try {
      let query = supabase
        .from('gl_products')
        .select('*', { count: 'exact' });
      
      // Apply any filters here
      
      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (error) {
        console.error('Error fetching products:', error);
        return { data: [], count: 0 };
      }
      
      return {
        data: data || [],
        count: count || 0
      };
    } catch (error) {
      console.error('Exception fetching products:', error);
      return { data: [], count: 0 };
    }
  },
  
  /**
   * Update product PDF URL
   */
  async updatePdfUrl(id: string, pdfUrl: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('gl_products')
        .update({
          supabase_pdf_url: pdfUrl,
          last_pdf_generated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) {
        console.error('Error updating product PDF URL:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception updating product PDF URL:', error);
      return false;
    }
  }
};
