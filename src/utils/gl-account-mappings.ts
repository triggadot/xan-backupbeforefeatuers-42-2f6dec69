
import { GlColumnMapping, GlMapping } from '@/types/glsync';

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
): Partial<GlMapping> => {
  return {
    connection_id: connectionId,
    glide_table: glideTableId,
    glide_table_display_name: glideTableDisplayName || 'Accounts',
    supabase_table: 'gl_accounts',
    column_mappings: getAccountsColumnMappings(),
    sync_direction: 'to_supabase' as const,
    enabled: true
  };
};

// Function to validate an accounts map
export const validateAccountsMapping = (mapping: any): { isValid: boolean, message: string } => {
  if (!mapping) {
    return { isValid: false, message: 'No mapping provided' };
  }
  
  // Check required fields
  if (!mapping.connection_id || !mapping.glide_table || !mapping.supabase_table) {
    return { isValid: false, message: 'Missing required fields in mapping' };
  }
  
  // Check that supabase_table is gl_accounts
  if (mapping.supabase_table !== 'gl_accounts') {
    return { 
      isValid: false, 
      message: `Expected supabase_table to be 'gl_accounts', found '${mapping.supabase_table}'` 
    };
  }
  
  // Check required column mappings
  const columnMappings = mapping.column_mappings || {};
  const requiredGlideFields = ['$rowID'];
  
  for (const field of requiredGlideFields) {
    if (!Object.keys(columnMappings).includes(field)) {
      return { 
        isValid: false, 
        message: `Missing required Glide field mapping: ${field}` 
      };
    }
  }
  
  // Check required Supabase columns
  const requiredSupabaseColumns = ['glide_row_id'];
  const mappedSupabaseColumns = Object.values(columnMappings)
    .map((mapping: any) => mapping.supabase_column_name);
  
  for (const column of requiredSupabaseColumns) {
    if (!mappedSupabaseColumns.includes(column)) {
      return { 
        isValid: false, 
        message: `Missing required Supabase column mapping: ${column}` 
      };
    }
  }
  
  return { isValid: true, message: 'Mapping is valid' };
};

// Function to normalize client type values to match the constraint
export const normalizeClientType = (clientType: string | null | undefined): string | null => {
  if (!clientType) return null;
  
  // Normalize to match the exact values expected by the constraint
  const normalized = clientType.trim();
  
  if (/customer\s*&\s*vendor/i.test(normalized) || 
      /customer\s+and\s+vendor/i.test(normalized)) {
    return 'Customer & Vendor';
  } else if (/vendor/i.test(normalized)) {
    return 'Vendor';
  } else if (/customer/i.test(normalized)) {
    return 'Customer';
  }
  
  // If we can't determine the type, default to Customer
  return 'Customer';
};
