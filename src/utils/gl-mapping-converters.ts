
import { GlMapping, GlColumnMapping } from '@/types/glsync';
import { Mapping } from '@/types/syncLog';

// Type guard to check if a data_type is valid
export function isValidDataType(type: string): type is "string" | "number" | "boolean" | "date-time" | "image-uri" | "email-address" {
  return ["string", "number", "boolean", "date-time", "image-uri", "email-address"].includes(type);
}

// Convert generic Mapping to strongly-typed GlMapping
export function convertToGlMapping(mapping: Mapping): GlMapping {
  const convertedColumnMappings: Record<string, GlColumnMapping> = {};
  
  // Handle the case where column_mappings might be coming from a JSON field in Supabase
  let columnMappings: any;
  
  try {
    // If column_mappings is a string, parse it as JSON
    if (typeof mapping.column_mappings === 'string') {
      columnMappings = JSON.parse(mapping.column_mappings);
      console.log('Parsed column mappings from string:', columnMappings);
    } 
    // If it's already an object, use it directly
    else if (mapping.column_mappings && typeof mapping.column_mappings === 'object') {
      columnMappings = mapping.column_mappings;
      console.log('Using column mappings as object:', columnMappings);
    } 
    // Default to empty object if neither
    else {
      console.warn('Invalid column_mappings format, using empty object');
      columnMappings = {};
    }
  } catch (e) {
    console.error('Failed to parse column_mappings:', e, mapping.column_mappings);
    columnMappings = {};
  }
  
  // Ensure columnMappings is an object and not an array or primitive
  if (columnMappings && typeof columnMappings === 'object' && !Array.isArray(columnMappings)) {
    Object.entries(columnMappings).forEach(([key, value]) => {
      // Ensure we have a proper object with the right properties
      const columnMapping = value as any;
      if (!columnMapping || typeof columnMapping !== 'object') {
        console.warn(`Invalid column mapping for key "${key}"`, columnMapping);
        return;
      }

      // Ensure data_type is one of the allowed types
      let dataType: "string" | "number" | "boolean" | "date-time" | "image-uri" | "email-address" = "string";
      
      if (columnMapping.data_type && isValidDataType(columnMapping.data_type)) {
        dataType = columnMapping.data_type;
      } else {
        console.warn(`Invalid data_type "${columnMapping.data_type}" for column "${key}", defaulting to "string"`);
      }
      
      convertedColumnMappings[key] = {
        glide_column_name: columnMapping.glide_column_name || '',
        supabase_column_name: columnMapping.supabase_column_name || '',
        data_type: dataType
      };
    });
  } else {
    console.warn('column_mappings is not a valid object, creating default mapping', columnMappings);
    // Add default mapping for $rowID if no mappings exist
    convertedColumnMappings['$rowID'] = {
      glide_column_name: '$rowID',
      supabase_column_name: 'glide_row_id',
      data_type: 'string'
    };
  }
  
  // Ensure sync_direction is one of the allowed values
  let syncDirection: 'to_supabase' | 'to_glide' | 'both' = 'to_supabase';
  if (mapping.sync_direction === 'to_supabase' || 
      mapping.sync_direction === 'to_glide' || 
      mapping.sync_direction === 'both') {
    syncDirection = mapping.sync_direction;
  } else {
    console.warn(`Invalid sync_direction "${mapping.sync_direction}", defaulting to "to_supabase"`);
  }
  
  return {
    id: mapping.id,
    connection_id: mapping.connection_id,
    glide_table: mapping.glide_table,
    glide_table_display_name: mapping.glide_table_display_name || mapping.glide_table,
    supabase_table: mapping.supabase_table,
    column_mappings: convertedColumnMappings,
    sync_direction: syncDirection,
    enabled: !!mapping.enabled,
    created_at: mapping.created_at || null,
    updated_at: mapping.updated_at || null
  };
}

// Convert GlMapping to a format suitable for database storage (plain JSON)
export function convertToDbMapping(mapping: Partial<GlMapping>): any {
  if (!mapping.column_mappings) {
    return mapping;
  }
  
  // Convert the column_mappings to a plain object for database storage
  const dbMapping = {
    ...mapping,
    column_mappings: { ...mapping.column_mappings }
  };
  
  return dbMapping;
}

// Get default column mappings
export function getDefaultColumnMappings(): Record<string, GlColumnMapping> {
  return {
    "$rowID": {
      "glide_column_name": "$rowID",
      "supabase_column_name": "glide_row_id",
      "data_type": "string"
    }
  };
}
