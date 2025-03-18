
import { GlMapping, GlProduct, ProductSyncResult, GlSyncRecord } from "@/types/glsync";

/**
 * Transforms Glide column values to appropriate data types for Supabase
 */
export function transformGlideValue(value: any, dataType: string): any {
  if (value === undefined || value === null) {
    return null;
  }

  try {
    switch (dataType) {
      case 'number':
        if (typeof value === 'string') {
          const num = parseFloat(value);
          return isNaN(num) ? null : num;
        }
        return typeof value === 'number' ? value : null;
      
      case 'boolean':
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          const lowered = value.toLowerCase();
          if (lowered === 'true' || lowered === 'yes' || lowered === '1') return true;
          if (lowered === 'false' || lowered === 'no' || lowered === '0') return false;
        }
        return null;
      
      case 'date-time':
        if (value instanceof Date) return value.toISOString();
        if (typeof value === 'string') {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date.toISOString();
        }
        return null;
      
      // For strings, image-uri, and email-address, we just ensure they're strings
      case 'string':
      case 'image-uri':
      case 'email-address':
        return value === null ? null : String(value);
      
      default:
        return value;
    }
  } catch (error) {
    console.error(`Error transforming value ${value} to ${dataType}:`, error);
    return null;
  }
}

/**
 * Validates a value against the expected data type
 */
export function validateGlideValue(value: any, dataType: string): boolean {
  if (value === null || value === undefined) {
    return true; // Null values are allowed for now
  }

  switch (dataType) {
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    
    case 'boolean':
      return typeof value === 'boolean';
    
    case 'date-time':
      if (value instanceof Date) return !isNaN(value.getTime());
      if (typeof value === 'string') {
        const date = new Date(value);
        return !isNaN(date.getTime());
      }
      return false;
    
    case 'string':
      return typeof value === 'string';
    
    case 'image-uri':
      return typeof value === 'string' && 
        (value.startsWith('http://') || value.startsWith('https://'));
    
    case 'email-address':
      return typeof value === 'string' && 
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    
    default:
      return true;
  }
}

/**
 * Transforms a Glide record to a Supabase product
 */
export function transformGlideToProduct(
  glideRecord: Record<string, any>,
  mapping: GlMapping,
  existingErrors: GlSyncRecord[] = []
): { product: GlProduct | null; errors: GlSyncRecord[] } {
  if (!glideRecord || !mapping) {
    return { 
      product: null, 
      errors: [{
        type: 'VALIDATION_ERROR',
        message: 'Missing record or mapping data',
        timestamp: new Date().toISOString(),
        retryable: false
      }]
    };
  }

  const errors: GlSyncRecord[] = [...existingErrors];
  const product: GlProduct = {
    glide_row_id: glideRecord.id || glideRecord.rowId || '',
  };

  // Apply column mappings
  Object.entries(mapping.column_mappings).forEach(([glideColumnId, mappingObj]) => {
    try {
      const glideValue = glideRecord[glideColumnId];
      
      // Skip undefined values
      if (glideValue === undefined) {
        return;
      }
      
      // Transform the value based on the data type
      const transformedValue = transformGlideValue(glideValue, mappingObj.data_type);
      
      // Validate the transformed value
      if (!validateGlideValue(transformedValue, mappingObj.data_type)) {
        errors.push({
          type: 'VALIDATION_ERROR',
          message: `Invalid value for ${mappingObj.glide_column_name} (${mappingObj.data_type})`,
          record: { 
            glideColumn: glideColumnId, 
            glide_column_name: mappingObj.glide_column_name,
            supabaseColumn: mappingObj.supabase_column_name, 
            value: glideValue, 
            expected: mappingObj.data_type 
          },
          timestamp: new Date().toISOString(),
          retryable: false
        });
        return;
      }
      
      // Use type assertion to ensure TypeScript accepts the dynamic property assignment
      (product as any)[mappingObj.supabase_column_name] = transformedValue;
      
    } catch (error) {
      errors.push({
        type: 'TRANSFORM_ERROR',
        message: `Error transforming column ${glideColumnId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        record: { 
          glideColumn: glideColumnId, 
          supabaseColumn: mappingObj.supabase_column_name, 
          value: glideRecord[glideColumnId] 
        },
        timestamp: new Date().toISOString(),
        retryable: false
      });
    }
  });

  // If we don't have a valid glide_row_id, we can't proceed
  if (!product.glide_row_id) {
    errors.push({
      type: 'VALIDATION_ERROR',
      message: 'Missing required glide_row_id',
      record: glideRecord,
      timestamp: new Date().toISOString(),
      retryable: false
    });
    return { product: null, errors };
  }

  return { product, errors };
}

/**
 * Process sync results and format errors
 */
export function processSyncResult(
  result: any,
  recordsProcessed: number,
  errors: GlSyncRecord[]
): ProductSyncResult {
  return {
    total_records: recordsProcessed + errors.length,
    processed_records: recordsProcessed,
    failed_records: errors.length,
    error_records: errors.length > 0 ? errors : undefined,
    success: errors.length === 0 && result?.error === undefined
  };
}
