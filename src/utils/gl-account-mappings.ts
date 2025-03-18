
import { GlColumnMapping } from '@/types/glsync';

// Default column mappings for the accounts table based on provided data
export const getAccountsColumnMappings = (): Record<string, GlColumnMapping> => {
  return {
    // Default $rowID mapping for Glide sync
    '$rowID': {
      glide_column_name: '$rowID',
      supabase_column_name: 'glide_row_id',
      data_type: 'string'
    },
    // Mappings from the Glide Accounts table
    'wwV1j': {
      glide_column_name: 'accountsUid',
      supabase_column_name: 'accounts_uid',
      data_type: 'string'
    },
    'Title': {
      glide_column_name: 'mainClientType',
      supabase_column_name: 'client_type',
      data_type: 'string'
    },
    'Name': {
      glide_column_name: 'mainAccountName',
      supabase_column_name: 'account_name',
      data_type: 'string'
    },
    'Rep Assigned': {
      glide_column_name: 'mainEmailOfWhoAdded',
      supabase_column_name: 'email_of_who_added',
      data_type: 'string'
    },
    'Photo': {
      glide_column_name: 'mainPhoto',
      supabase_column_name: 'photo',
      data_type: 'image-uri'
    },
    'wvzr1': {
      glide_column_name: 'mainDateAddedClient',
      supabase_column_name: 'date_added_client',
      data_type: 'date-time'
    }
  };
};

// Helper function to create a new mapping with accounts defaults
export const createAccountsMapping = (
  connectionId: string,
  glideTableId: string,
  glideTableDisplayName: string
) => {
  return {
    connection_id: connectionId,
    glide_table: glideTableId, // "native-table-f8P9wLYyZnX4DJMLC1fS" based on the API example
    glide_table_display_name: glideTableDisplayName || 'Accounts',
    supabase_table: 'gl_accounts',
    column_mappings: getAccountsColumnMappings(),
    sync_direction: 'to_supabase' as const,
    enabled: true
  };
};
