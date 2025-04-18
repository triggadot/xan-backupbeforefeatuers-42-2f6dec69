// Unified Message type for public gallery (cleaned up for gallery use)
export interface Message {
  id: string;
  caption?: string;
  file_unique_id: string;
  public_url: string;
  mime_type?: string;
  file_size?: number;
  width?: number;
  height?: number;
  duration?: number;
  processing_state?: 'pending' | 'processing' | 'completed' | 'error' | 'initialized';
  analyzed_content?: {
    product_name?: string;
    product_code?: string;
    vendor_uid?: string | null;
    purchase_date?: string | null;
    quantity?: number | null;
    notes?: string;
    [key: string]: any;
  };
  created_at?: string;
  // Add more fields if needed for gallery display
}
