
export interface SyncLog {
  id: string;
  mapping_id: string | null;
  status: string;
  message: string | null;
  records_processed: number | null;
  started_at: string;
  completed_at: string | null;
  glide_table?: string | null;
  glide_table_display_name?: string | null;
  supabase_table?: string | null;
  app_name?: string | null;
  sync_direction?: string | null;
}

export interface Mapping {
  id: string;
  connection_id: string;
  glide_table: string;
  glide_table_display_name: string;
  supabase_table: string;
  column_mappings: Record<string, {
    glide_column_name: string;
    supabase_column_name: string;
    data_type: string;
  }>;
  sync_direction: string;
  enabled: boolean;
  app_name?: string;
  current_status?: string;
  last_sync_completed_at?: string | null;
  error_count?: number;
  total_records?: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SupabaseTable {
  table_name: string;
}

export interface ColumnMetadata {
  column_name: string;
  data_type: string;
}

export interface MappingSuggestion {
  glide_column_name: string;
  suggested_supabase_column: string;
  data_type: string;
  confidence: number;
}

// Type for column mapping with strongly typed data_type
export interface TypedColumnMapping {
  glide_column_name: string;
  supabase_column_name: string;
  data_type: 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address';
}

// Helper function to check if a data type is valid
export function isValidDataType(type: string): type is 'string' | 'number' | 'boolean' | 'date-time' | 'image-uri' | 'email-address' {
  return ['string', 'number', 'boolean', 'date-time', 'image-uri', 'email-address'].includes(type);
}

// Helper function to ensure column mapping has valid data type
export function ensureValidDataType(mapping: {
  glide_column_name: string;
  supabase_column_name: string;
  data_type: string;
}): TypedColumnMapping {
  if (isValidDataType(mapping.data_type)) {
    return mapping as TypedColumnMapping;
  }
  
  // Default to string if invalid type
  return {
    ...mapping,
    data_type: 'string'
  };
}

// Helper function to convert column mappings to typed version
export function convertToTypedMappings(
  mappings: Record<string, {
    glide_column_name: string;
    supabase_column_name: string;
    data_type: string;
  }>
): Record<string, TypedColumnMapping> {
  const result: Record<string, TypedColumnMapping> = {};
  
  for (const [key, value] of Object.entries(mappings)) {
    result[key] = ensureValidDataType(value);
  }
  
  return result;
}

// Helper to get default column mappings with correct types
export function getDefaultColumnMappings(): Record<string, TypedColumnMapping> {
  return {
    "$rowID": {
      "glide_column_name": "$rowID",
      "supabase_column_name": "glide_row_id",
      "data_type": "string"
    }
  };
}
