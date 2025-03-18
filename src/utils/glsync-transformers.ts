
// Type conversions and data transformation utilities for Glide Sync

/**
 * Convert a value to the specified type
 */
export const convertValue = (value: any, dataType: string): any => {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    switch (dataType) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true';
        }
        return Boolean(value);
      case 'date-time':
        return new Date(value).toISOString();
      case 'image-uri':
      case 'email-address':
        return String(value);
      default:
        return value;
    }
  } catch (error) {
    console.error(`Error converting value ${value} to ${dataType}:`, error);
    return null;
  }
};

/**
 * Validate a value against its expected type
 */
export const validateValue = (value: any, dataType: string): boolean => {
  if (value === null || value === undefined) {
    return true; // Null values are allowed unless constrained at the database level
  }

  try {
    switch (dataType) {
      case 'string':
      case 'image-uri':
      case 'email-address':
        return typeof value === 'string';
      case 'number':
        return !isNaN(Number(value));
      case 'boolean':
        return typeof value === 'boolean' || 
               (typeof value === 'string' && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false'));
      case 'date-time':
        return !isNaN(Date.parse(value));
      default:
        return true;
    }
  } catch (error) {
    return false;
  }
};

/**
 * Transform a Glide record to a Supabase record based on column mappings
 */
export const transformGlideToSupabase = (
  glideRecord: Record<string, any>,
  columnMappings: Record<string, { 
    glide_column_name: string; 
    supabase_column_name: string; 
    data_type: string;
  }>
): Record<string, any> => {
  const result: Record<string, any> = {};
  
  // Ensure glide_row_id is always mapped
  if (glideRecord['$rowID']) {
    result.glide_row_id = glideRecord['$rowID'];
  }
  
  // Process all other mappings
  Object.entries(columnMappings).forEach(([glideColumnId, mapping]) => {
    const { glide_column_name, supabase_column_name, data_type } = mapping;
    
    // Skip if this is the $rowID mapping (already handled)
    if (glideColumnId === '$rowID' && supabase_column_name === 'glide_row_id') {
      return;
    }
    
    const value = glideRecord[glide_column_name];
    if (value !== undefined) {
      result[supabase_column_name] = convertValue(value, data_type);
    }
  });
  
  return result;
};

/**
 * Transform a Supabase record to a Glide record based on column mappings
 */
export const transformSupabaseToGlide = (
  supabaseRecord: Record<string, any>,
  columnMappings: Record<string, { 
    glide_column_name: string; 
    supabase_column_name: string; 
    data_type: string;
  }>
): Record<string, any> => {
  const result: Record<string, any> = {};
  
  // Ensure rowID is always mapped
  if (supabaseRecord.glide_row_id) {
    result['$rowID'] = supabaseRecord.glide_row_id;
  }
  
  // Process all other mappings
  Object.entries(columnMappings).forEach(([glideColumnId, mapping]) => {
    const { glide_column_name, supabase_column_name, data_type } = mapping;
    
    // Skip if this is the $rowID mapping (already handled)
    if (glideColumnId === '$rowID' && supabase_column_name === 'glide_row_id') {
      return;
    }
    
    const value = supabaseRecord[supabase_column_name];
    if (value !== undefined) {
      result[glide_column_name] = convertValue(value, data_type);
    }
  });
  
  return result;
};

/**
 * Format a timestamp for display
 */
export const formatTimestamp = (timestamp: string | null): string => {
  if (!timestamp) return 'Never';
  return new Date(timestamp).toLocaleString();
};

/**
 * Calculate sync duration
 */
export const calculateDuration = (startTime: string, endTime: string | null): string => {
  if (!endTime) return 'In progress';
  
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const durationMs = end - start;
  
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  } else if (durationMs < 60000) {
    return `${Math.floor(durationMs / 1000)}s`;
  } else {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
};
