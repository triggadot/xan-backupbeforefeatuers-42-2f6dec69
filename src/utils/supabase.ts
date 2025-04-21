
/**
 * Converts a table name to its proper Supabase format
 */
export const asTable = (tableName: string): string => {
  if (tableName.startsWith('gl_')) return tableName;
  return `gl_${tableName}`;
};
