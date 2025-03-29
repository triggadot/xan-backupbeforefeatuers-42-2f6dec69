import { supabase } from '../integrations/supabase/client';
import type { 
  Tables, 
  TablesInsert,
  TablesUpdate 
} from '../integrations/supabase/types';

/**
 * Creates a lookup map from an array of records with glide_row_id
 * @param records Array of records with glide_row_id field
 * @returns Map with glide_row_id as key and record as value
 */
export function createGlideRowIdMap<T extends { glide_row_id: string }>(
  records: T[]
): Map<string, T> {
  const map = new Map<string, T>();
  records.forEach((record) => {
    map.set(record.glide_row_id, record);
  });
  return map;
}

/**
 * Generic function to fetch related records by their glide_row_ids
 * @param tableName Supabase table name
 * @param glideIds Array of glide_row_ids to fetch
 * @returns Array of records
 */
export async function fetchRelatedRecordsByGlideIds<T>(
  tableName: string,
  glideIds: string[]
): Promise<T[]> {
  if (!glideIds.length) return [];

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .in('glide_row_id', glideIds);

  if (error) {
    console.error(`Error fetching related ${tableName}:`, error);
    throw error;
  }

  return (data || []) as T[];
}

/**
 * Joins related records to main records using rowid_ field
 * @param records Main records that contain rowid_fieldName
 * @param relatedRecordsMap Map of related records with glide_row_id as key
 * @param rowidFieldName Name of the rowid field in the main records
 * @param targetFieldName Name for the new field to store related record
 * @returns Records with related records joined
 */
export function joinRelatedRecords<
  T extends Record<string, any>,
  R extends { glide_row_id: string }
>(
  records: T[],
  relatedRecordsMap: Map<string, R>,
  rowidFieldName: keyof T,
  targetFieldName: string
): (T & Record<string, R | null>)[] {
  return records.map((record) => {
    const rowidValue = record[rowidFieldName] as string | null | undefined;
    const relatedRecord = rowidValue ? relatedRecordsMap.get(rowidValue) ?? null : null;
    
    return {
      ...record,
      [targetFieldName]: relatedRecord,
    };
  });
}

/**
 * Fetches related accounts for records that have rowid_accounts
 * @param records Records with rowid_accounts field
 * @returns Records with account field added
 */
export async function includeAccountsForRecords<T extends { rowid_accounts?: string | null }>(
  records: T[]
): Promise<(T & { account?: Tables['gl_accounts'] | null })[]> {
  // Extract unique account IDs
  const accountIds = [...new Set(
    records
      .map(record => record.rowid_accounts)
      .filter((id): id is string => !!id)
  )];
  
  if (!accountIds.length) {
    return records.map(record => ({ ...record, account: null }));
  }

  // Fetch accounts
  const accounts = await fetchRelatedRecordsByGlideIds<Tables['gl_accounts']>(
    'gl_accounts', 
    accountIds
  );
  
  // Create lookup map
  const accountMap = createGlideRowIdMap(accounts);
  
  // Join accounts to records
  return joinRelatedRecords(
    records, 
    accountMap, 
    'rowid_accounts', 
    'account'
  );
}

/**
 * Fetches related invoice lines for an invoice
 * @param invoiceGlideId The glide_row_id of the invoice
 * @returns Array of invoice lines with product info
 */
export async function fetchInvoiceLines(
  invoiceGlideId: string
): Promise<Array<Tables['gl_invoice_lines'] & { product?: Tables['gl_products'] | null }>> {
  // Get invoice lines
  const { data: lines, error } = await supabase
    .from('gl_invoice_lines')
    .select('*')
    .eq('rowid_invoices', invoiceGlideId);

  if (error) {
    console.error('Error fetching invoice lines:', error);
    throw error;
  }

  if (!lines || lines.length === 0) {
    return [];
  }

  // Extract product IDs
  const productIds = [...new Set(
    lines
      .map(line => line.rowid_products)
      .filter((id): id is string => !!id)
  )];

  // Fetch products if needed
  if (productIds.length > 0) {
    const products = await fetchRelatedRecordsByGlideIds<Tables['gl_products']>(
      'gl_products', 
      productIds
    );
    
    const productMap = createGlideRowIdMap(products);
    
    // Join products to lines
    return joinRelatedRecords(
      lines, 
      productMap, 
      'rowid_products', 
      'product'
    );
  }

  return lines.map(line => ({ ...line, product: null }));
}

/**
 * Fetches related estimate lines for an estimate
 * @param estimateGlideId The glide_row_id of the estimate
 * @returns Array of estimate lines with product info
 */
export async function fetchEstimateLines(
  estimateGlideId: string
): Promise<Array<Tables['gl_estimate_lines'] & { product?: Tables['gl_products'] | null }>> {
  // Get estimate lines
  const { data: lines, error } = await supabase
    .from('gl_estimate_lines')
    .select('*')
    .eq('rowid_estimates', estimateGlideId);

  if (error) {
    console.error('Error fetching estimate lines:', error);
    throw error;
  }

  if (!lines || lines.length === 0) {
    return [];
  }

  // Extract product IDs
  const productIds = [...new Set(
    lines
      .map(line => line.rowid_products)
      .filter((id): id is string => !!id)
  )];

  // Fetch products if needed
  if (productIds.length > 0) {
    const products = await fetchRelatedRecordsByGlideIds<Tables['gl_products']>(
      'gl_products', 
      productIds
    );
    
    const productMap = createGlideRowIdMap(products);
    
    // Join products to lines
    return joinRelatedRecords(
      lines, 
      productMap, 
      'rowid_products', 
      'product'
    );
  }

  return lines.map(line => ({ ...line, product: null }));
}

/**
 * Fetches products for a purchase order
 * @param purchaseOrderGlideId The glide_row_id of the purchase order
 * @returns Array of products
 */
export async function fetchPurchaseOrderProducts(
  purchaseOrderGlideId: string
): Promise<Tables['gl_products'][]> {
  const { data: products, error } = await supabase
    .from('gl_products')
    .select('*')
    .eq('rowid_purchase_orders', purchaseOrderGlideId);

  if (error) {
    console.error('Error fetching purchase order products:', error);
    throw error;
  }

  return products || [];
}

/**
 * Fetches customer payments for an invoice
 * @param invoiceGlideId The glide_row_id of the invoice
 * @returns Array of payments
 */
export async function fetchInvoicePayments(
  invoiceGlideId: string
): Promise<Tables['gl_customer_payments'][]> {
  const { data: payments, error } = await supabase
    .from('gl_customer_payments')
    .select('*')
    .eq('rowid_invoices', invoiceGlideId);

  if (error) {
    console.error('Error fetching invoice payments:', error);
    throw error;
  }

  return payments || [];
}

/**
 * Function to fetch complete invoice data including all relationships
 * @param invoiceGlideId The glide_row_id of the invoice
 * @returns Complete invoice data with all relationships
 */
export async function fetchCompleteInvoice(invoiceGlideId: string) {
  try {
    // Use the database function to get complete data in one call
    const { data, error } = await supabase.rpc(
      'get_complete_invoice',
      { invoice_glide_id: invoiceGlideId }
    );

    if (error) {
      console.error('Error fetching complete invoice:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchCompleteInvoice:', error);
    
    // Fallback to manual fetching if the RPC fails
    const { data: invoice, error: invoiceError } = await supabase
      .from('gl_invoices')
      .select('*')
      .eq('glide_row_id', invoiceGlideId)
      .single();

    if (invoiceError) throw invoiceError;
    if (!invoice) return null;

    // Get account
    const account = invoice.rowid_accounts 
      ? await fetchAccountByGlideId(invoice.rowid_accounts)
      : null;

    // Get lines with products
    const lines = await fetchInvoiceLines(invoiceGlideId);

    // Get payments
    const payments = await fetchInvoicePayments(invoiceGlideId);

    return {
      invoice,
      account,
      lines,
      payments
    };
  }
}

/**
 * Fetches an account by glide_row_id
 * @param accountGlideId The glide_row_id of the account
 * @returns The account or null
 */
export async function fetchAccountByGlideId(
  accountGlideId: string
): Promise<Tables['gl_accounts'] | null> {
  const { data, error } = await supabase
    .from('gl_accounts')
    .select('*')
    .eq('glide_row_id', accountGlideId)
    .single();

  if (error) {
    console.error('Error fetching account:', error);
    return null;
  }

  return data;
}
