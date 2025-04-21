
import { GlColumnMapping, GlMapping } from '@/types/glsync';

// Default column mappings for the purchase orders table based on provided data
export const getPurchaseOrderColumnMappings = (): Record<string, GlColumnMapping> => {
  return {
    // Default $rowID mapping for Glide sync
    '$rowID': {
      glide_column_name: '$rowID',
      supabase_column_name: 'glide_row_id',
      data_type: 'string'
    },
    // Mappings from the Glide Purchase Orders table
    'Y8Sjq': {
      glide_column_name: 'mainPoDate',
      supabase_column_name: 'po_date',
      data_type: 'date-time'
    },
    'WB6a4': {
      glide_column_name: 'rowidAccntrowid',
      supabase_column_name: 'rowid_accounts',
      data_type: 'string'
    },
    'Name': {
      glide_column_name: 'mainPurchaseOrderUidFromProduct',
      supabase_column_name: 'purchase_order_uid',
      data_type: 'string'
    },
    'Q5P0U': {
      glide_column_name: 'datePaymentDateMDdYyyy',
      supabase_column_name: 'date_payment_date_mddyyyy',
      data_type: 'date-time'
    },
    'WU9FJ': {
      glide_column_name: 'docsShortlink',
      supabase_column_name: 'docs_shortlink',
      data_type: 'string'
    },
    'vGz0K': {
      glide_column_name: 'docsPdfLink',
      supabase_column_name: 'pdf_link',
      data_type: 'string'
    }
  };
};

// Helper function to create a new mapping with purchase order defaults
export const createPurchaseOrderMapping = (
  connectionId: string,
  glideTableId: string,
  glideTableDisplayName: string
) => {
  return {
    connection_id: connectionId,
    glide_table: glideTableId,
    glide_table_display_name: glideTableDisplayName || 'Purchase Orders',
    supabase_table: 'gl_purchase_orders',
    column_mappings: getPurchaseOrderColumnMappings(),
    sync_direction: 'to_supabase' as const,
    enabled: true
  };
};
