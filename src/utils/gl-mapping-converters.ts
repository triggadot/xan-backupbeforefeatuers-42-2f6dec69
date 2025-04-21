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
  const columnMappings = mapping.column_mappings as any;
  
  if (columnMappings) {
    Object.entries(columnMappings).forEach(([key, value]) => {
      // Ensure we have a proper object with the right properties
      const columnMapping = value as any;
      if (!columnMapping || typeof columnMapping !== 'object') {
        console.warn(`Invalid column mapping for key "${key}"`);
        return;
      }

      // Ensure data_type is one of the allowed types
      let dataType: "string" | "number" | "boolean" | "date-time" | "image-uri" | "email-address" = "string";
      
      if (isValidDataType(columnMapping.data_type)) {
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
    // Add default mapping for $rowID if no mappings exist
    convertedColumnMappings['$rowID'] = {
      glide_column_name: '$rowID',
      supabase_column_name: 'glide_row_id',
      data_type: 'string'
    };
  }
  
  return {
    ...mapping,
    // Ensure sync_direction is one of the allowed values
    sync_direction: (mapping.sync_direction as 'to_supabase' | 'to_glide' | 'both') || 'to_supabase',
    column_mappings: convertedColumnMappings
  } as GlMapping;
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
