
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
 * Transforms Supabase values to appropriate format for Glide
 */
export function transformSupabaseValue(value: any, dataType: string): any {
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
        return !!value; // Convert to boolean
      
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
    console.error(`Error transforming Supabase value ${value} to ${dataType}:`, error);
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
 * Creates a reverse mapping from Supabase column names to Glide columns
 * Used for bidirectional sync
 */
export function createReverseMapping(
  mapping: GlMapping
): Record<string, { glide_column_id: string, data_type: string }> {
  const reverseMapping: Record<string, { glide_column_id: string, data_type: string }> = {};
  
  Object.entries(mapping.column_mappings).forEach(([glideColumnId, mappingObj]) => {
    // Skip special Glide system fields that are handled separately
    if (glideColumnId !== '$rowID' && glideColumnId !== '$rowIndex') {
      reverseMapping[mappingObj.supabase_column_name] = {
        glide_column_id: glideColumnId,
        data_type: mappingObj.data_type
      };
    }
  });
  
  return reverseMapping;
}

/**
 * Extracts the Glide row ID from a record
 * Glide uses $rowID as the primary identifier
 */
export function extractGlideRowId(glideRecord: Record<string, any>): string | null {
  // Check for all possible Glide row ID field names
  const rowId = glideRecord.$rowID || glideRecord.id || glideRecord.rowId;
  
  if (!rowId) {
    console.error('Missing required Glide row ID in record:', glideRecord);
    return null;
  }
  
  return String(rowId);
}

/**
 * Creates a Glide mutation object from Supabase data
 */
export function createGlideMutation(
  glideTableName: string,
  glideRowId: string, 
  columnValues: Record<string, any>
): any {
  return {
    kind: 'set-columns-in-row',
    tableName: glideTableName,
    rowID: glideRowId,
    columnValues
  };
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
  
  // Extract the Glide row ID using the new helper function
  const glideRowId = extractGlideRowId(glideRecord);
  
  if (!glideRowId) {
    errors.push({
      type: 'VALIDATION_ERROR',
      message: 'Missing required Glide row ID ($rowID, id, or rowId)',
      record: { recordData: glideRecord },
      timestamp: new Date().toISOString(),
      retryable: false
    });
    return { product: null, errors };
  }
  
  const product: GlProduct = {
    glide_row_id: glideRowId,
  };

  // Apply column mappings
  Object.entries(mapping.column_mappings).forEach(([glideColumnId, mappingObj]) => {
    try {
      // Skip special Glide system fields that are handled separately
      if (glideColumnId === '$rowID' || glideColumnId === '$rowIndex') {
        return;
      }
      
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

  return { product, errors };
}

/**
 * Transforms a Supabase record to Glide format
 */
export function transformSupabaseToGlide(
  supabaseRecord: Record<string, any>,
  mapping: GlMapping,
  existingErrors: GlSyncRecord[] = []
): { glideRecord: Record<string, any> | null; errors: GlSyncRecord[] } {
  if (!supabaseRecord || !mapping) {
    return { 
      glideRecord: null, 
      errors: [{
        type: 'VALIDATION_ERROR',
        message: 'Missing record or mapping data',
        timestamp: new Date().toISOString(),
        retryable: false
      }]
    };
  }

  const errors: GlSyncRecord[] = [...existingErrors];
  
  // Find the Supabase column that maps to Glide's $rowID
  const rowIdMapping = Object.entries(mapping.column_mappings).find(
    ([glideColumnId]) => glideColumnId === '$rowID'
  );
  
  if (!rowIdMapping) {
    errors.push({
      type: 'VALIDATION_ERROR',
      message: 'Missing required $rowID mapping for Supabase to Glide sync',
      record: { recordData: supabaseRecord },
      timestamp: new Date().toISOString(),
      retryable: false
    });
    return { glideRecord: null, errors };
  }
  
  const supabaseGlideRowIdField = rowIdMapping[1].supabase_column_name;
  const glideRowId = supabaseRecord[supabaseGlideRowIdField];
  
  if (!glideRowId) {
    errors.push({
      type: 'VALIDATION_ERROR',
      message: `Missing required Glide row ID (${supabaseGlideRowIdField})`,
      record: { recordData: supabaseRecord },
      timestamp: new Date().toISOString(),
      retryable: false
    });
    return { glideRecord: null, errors };
  }
  
  // Create reverse mapping from Supabase column names to Glide column IDs
  const reverseMapping = createReverseMapping(mapping);
  
  // Create the Glide record
  const glideRecord: Record<string, any> = {};
  
  // Add the row ID
  glideRecord.$rowID = glideRowId;
  
  // Transform Supabase values to Glide values
  Object.entries(supabaseRecord).forEach(([supabaseColumn, value]) => {
    // Skip Supabase-specific fields and the glide_row_id field (already handled)
    if (
      supabaseColumn === supabaseGlideRowIdField ||
      supabaseColumn === 'id' ||
      supabaseColumn === 'created_at' ||
      supabaseColumn === 'updated_at'
    ) {
      return;
    }
    
    // If we have a mapping for this Supabase column, use it
    const mapping = reverseMapping[supabaseColumn];
    if (mapping) {
      try {
        // Skip undefined values
        if (value === undefined) {
          return;
        }
        
        // Transform the value based on the data type
        const transformedValue = transformSupabaseValue(value, mapping.data_type);
        
        // Validate the transformed value
        if (!validateGlideValue(transformedValue, mapping.data_type)) {
          errors.push({
            type: 'VALIDATION_ERROR',
            message: `Invalid value for ${supabaseColumn} (${mapping.data_type})`,
            record: { 
              supabaseColumn, 
              glideColumn: mapping.glide_column_id,
              value, 
              expected: mapping.data_type 
            },
            timestamp: new Date().toISOString(),
            retryable: false
          });
          return;
        }
        
        // Add to Glide record
        glideRecord[mapping.glide_column_id] = transformedValue;
        
      } catch (error) {
        errors.push({
          type: 'TRANSFORM_ERROR',
          message: `Error transforming column ${supabaseColumn}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          record: { 
            supabaseColumn, 
            glideColumn: mapping.glide_column_id,
            value 
          },
          timestamp: new Date().toISOString(),
          retryable: false
        });
      }
    }
  });

  return { glideRecord, errors };
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
