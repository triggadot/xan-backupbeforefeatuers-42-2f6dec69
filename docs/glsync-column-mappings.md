# Glidebase Column Mappings

## Overview

The Glidebase sync system uses a standardized approach to map columns between Glide and Supabase. This document explains the structure of column mappings and how they are processed during sync operations.

## Column Mappings Structure

Column mappings are stored in the `column_mappings` JSONB field of the `gl_mappings` table. The structure follows this pattern:

```json
{
  "GLIDE_COLUMN_ID": {
    "data_type": "string|number|boolean|date-time|etc",
    "glide_column_name": "humanReadableGlideColumnName",
    "supabase_column_name": "supabase_column_name"
  },
  "$rowID": {
    "data_type": "string",
    "glide_column_name": "$rowID",
    "supabase_column_name": "glide_row_id"
  }
}
```

### Example Column Mapping

```json
{
  "Cost": {
    "data_type": "number", 
    "glide_column_name": "mainCost", 
    "supabase_column_name": "cost"
  },
  "2vbZN": {
    "data_type": "number", 
    "glide_column_name": "mainTotalQtyPurchased", 
    "supabase_column_name": "total_qty_purchased"
  },
  "$rowID": {
    "data_type": "string", 
    "glide_column_name": "$rowID", 
    "supabase_column_name": "glide_row_id"
  }
}
```

## Key Components

### 1. Glide Column ID

The key in the mapping object is the Glide column ID, which is often a seemingly random string like `"2vbZN"`. This is the primary identifier used by Glide's API when returning data.

### 2. Data Type

The `data_type` field specifies the expected data type for the column. Supported types include:

- `string`: Text data
- `number`: Numeric data (integers or decimals)
- `boolean`: True/false values
- `date-time`: Date and time values
- `json`: JSON objects or arrays
- `email-address`: Email addresses
- `image-uri`: Image URLs

### 3. Glide Column Name

The `glide_column_name` field provides a human-readable name for the Glide column. This is used as a fallback when the column ID doesn't match.

### 4. Supabase Column Name

The `supabase_column_name` field specifies the target column name in the Supabase database table.

## Special Mappings

### $rowID Mapping

The `$rowID` mapping is required for all tables and maps to the `glide_row_id` column in Supabase. This is used for conflict resolution during upserts.

### Relationship Fields

Relationship fields follow a specific pattern:

```json
{
  "9aBFI": {
    "data_type": "string",
    "glide_column_name": "rowidAccountrowId",
    "supabase_column_name": "rowid_accounts"
  }
}
```

These fields link to other tables using the `rowid_` prefix in Supabase.

## How Column Mappings Are Used

During the sync process, the system:

1. **Validates the mappings**: Ensures all required fields are present and properly formatted
2. **Maps Glide data to Supabase format**: Uses the mappings to transform each row
3. **Handles special cases**: Processes relationships and data type conversions
4. **Upserts the data**: Uses the `glide_row_id` for conflict resolution

### Data Transformation Process

For each row from Glide:

1. Map the `$rowID` to `glide_row_id`
2. For each column mapping:
   - Try to get the value using the Glide column ID
   - If not found, fall back to using the Glide column name
   - Transform the value based on the specified data type
   - Map to the corresponding Supabase column

## Handling Missing or Invalid Mappings

The system includes several safeguards:

1. **Validation**: Column mappings are validated before processing
2. **Default $rowID mapping**: If not explicitly defined, a default mapping is added
3. **Error logging**: Transformation errors are logged for troubleshooting
4. **Fallback mechanisms**: Multiple approaches to find the correct data

## Best Practices

1. **Always include the $rowID mapping**: This is essential for proper sync operation
2. **Use consistent naming conventions**: Follow snake_case for Supabase columns
3. **Validate data types**: Ensure the specified data types match the actual data
4. **Handle relationships properly**: Use the `rowid_` prefix for relationship fields
5. **Test with sample data**: Verify mappings with representative data before full sync

## Troubleshooting

Common issues and solutions:

1. **Missing $rowID mapping**: Ensure the mapping includes the $rowID field
2. **Incorrect data types**: Verify that data types match the actual data
3. **Case sensitivity**: Column names in Supabase are case-sensitive
4. **Special characters**: Avoid special characters in column names
5. **Invalid JSON**: Ensure the column_mappings field contains valid JSON

## Example Implementation

```typescript
// Process data using column mappings
for (const glideRow of allRows) {
  const supabaseRow = {};
  
  // Always map glide_row_id
  supabaseRow.glide_row_id = glideRow.$rowID;
  
  // Map other columns according to mapping
  for (const [glideColumnId, mappingInfo] of Object.entries(columnMappings)) {
    if (glideColumnId === '$rowID') continue; // Already handled
    
    const { glide_column_name, supabase_column_name, data_type } = mappingInfo;
    
    // Try to get the value using the column ID first, then fall back to the column name
    let glideValue = glideRow[glideColumnId];
    
    // If the value is undefined, try using the glide_column_name instead
    if (glideValue === undefined && glide_column_name) {
      glideValue = glideRow[glide_column_name];
    }
    
    if (glideValue !== undefined) {
      supabaseRow[supabase_column_name] = transformValue(glideValue, data_type);
    }
  }
  
  transformedRows.push(supabaseRow);
}
```

This documentation provides a comprehensive guide to understanding and using column mappings in the Glidebase sync system.
