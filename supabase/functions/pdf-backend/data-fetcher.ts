/**
 * Data fetching module for PDF generation
 * Implements the Glidebase relationship pattern using glide_row_id for table relationships
 */
import { DocumentType, documentTypeConfig, Invoice, PurchaseOrder, Estimate } from './types.ts';
import { PDFErrorType, createPDFError } from './utils.ts';

/**
 * Fetches document data with related entities using the Glidebase relationship pattern
 * 
 * @param {any} supabaseClient - Supabase client with admin privileges
 * @param {DocumentType} documentType - Type of document to fetch
 * @param {string} documentId - ID of the document to fetch
 * @returns {Promise<Invoice | PurchaseOrder | Estimate>} Document data with related entities
 * @throws {Error} If document not found or fetch fails
 */
export async function fetchDocumentData(
  supabaseClient: any,
  documentType: DocumentType,
  documentId: string
): Promise<Invoice | PurchaseOrder | Estimate> {
  try {
    const config = documentTypeConfig[documentType];
    if (!config) {
      throw createPDFError(
        PDFErrorType.VALIDATION_ERROR,
        `Invalid document type: ${documentType}`
      );
    }

    console.log(`Fetching ${documentType} document with ID ${documentId}`);

    // Fetch the main document first
    const { data: document, error } = await supabaseClient
      .from(config.tableName)
      .select('*, account:gl_accounts!inner(*)')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      throw createPDFError(
        PDFErrorType.FETCH_ERROR,
        `Failed to fetch ${documentType} with ID ${documentId}`,
        error
      );
    }

    // Handle document-specific related data
    switch (documentType) {
      case DocumentType.INVOICE:
        return await fetchInvoiceRelatedData(supabaseClient, document);
      
      case DocumentType.PURCHASE_ORDER:
        return await fetchPurchaseOrderRelatedData(supabaseClient, document);
      
      case DocumentType.ESTIMATE:
        return await fetchEstimateRelatedData(supabaseClient, document);
      
      default:
        return document;
    }
  } catch (error) {
    console.error(`Error fetching document data for ${documentType} ${documentId}:`, error);
    
    // Re-throw with proper error structure if not already a PDFError
    if (error.type && Object.values(PDFErrorType).includes(error.type)) {
      throw error;
    }
    
    throw createPDFError(
      PDFErrorType.FETCH_ERROR,
      `Failed to fetch document data: ${error.message || 'Unknown error'}`,
      error
    );
  }
}

/**
 * Fetches invoice-specific related data
 * 
 * @param {any} supabaseClient - Supabase client with admin privileges
 * @param {any} invoice - Invoice document data
 * @returns {Promise<Invoice>} Complete invoice data with related entities
 */
async function fetchInvoiceRelatedData(supabaseClient: any, invoice: any): Promise<Invoice> {
  // Fetch invoice lines using the Glidebase relationship pattern
  const { data: lines, error: linesError } = await supabaseClient
    .from('gl_invoice_lines')
    .select('*, product:gl_products(*)')
    .eq('rowid_invoices', invoice.glide_row_id)
    .order('id');

  if (linesError) {
    console.error('Error fetching invoice lines:', linesError);
  }

  // Fetch customer payments
  const { data: payments, error: paymentsError } = await supabaseClient
    .from('gl_customer_payments')
    .select('*')
    .eq('rowid_invoices', invoice.glide_row_id)
    .order('date_of_payment', { ascending: false });

  if (paymentsError) {
    console.error('Error fetching customer payments:', paymentsError);
  }

  // Fetch shipping records if needed
  const { data: shipping, error: shippingError } = await supabaseClient
    .from('gl_shipping_records')
    .select('*')
    .eq('rowid_invoices', invoice.glide_row_id)
    .maybeSingle();

  if (shippingError) {
    console.error('Error fetching shipping record:', shippingError);
  }

  // Combine all data into a complete invoice object
  return {
    ...invoice,
    lines: lines || [],
    customer_payments: payments || [],
    shipping: shipping || null
  } as Invoice;
}

/**
 * Fetches purchase order-specific related data
 * 
 * @param {any} supabaseClient - Supabase client with admin privileges
 * @param {any} purchaseOrder - Purchase order document data
 * @returns {Promise<PurchaseOrder>} Complete purchase order data with related entities
 */
async function fetchPurchaseOrderRelatedData(supabaseClient: any, purchaseOrder: any): Promise<PurchaseOrder> {
  // Fetch purchase order lines using the Glidebase relationship pattern
  const { data: lineItems, error: linesError } = await supabaseClient
    .from('gl_purchase_order_lines')
    .select('*')
    .eq('rowid_purchase_order', purchaseOrder.glide_row_id)
    .order('id');

  if (linesError) {
    console.error('Error fetching purchase order lines:', linesError);
  }

  // Fetch vendor payments
  const { data: vendorPayments, error: paymentsError } = await supabaseClient
    .from('gl_vendor_payments')
    .select('*')
    .eq('rowid_purchase_orders', purchaseOrder.glide_row_id)
    .order('date', { ascending: false });

  if (paymentsError) {
    console.error('Error fetching vendor payments:', paymentsError);
  }

  // Combine all data into a complete purchase order object
  return {
    ...purchaseOrder,
    lineItems: lineItems || [],
    vendorPayments: vendorPayments || []
  } as PurchaseOrder;
}

/**
 * Fetches estimate-specific related data
 * 
 * @param {any} supabaseClient - Supabase client with admin privileges
 * @param {any} estimate - Estimate document data
 * @returns {Promise<Estimate>} Complete estimate data with related entities
 */
async function fetchEstimateRelatedData(supabaseClient: any, estimate: any): Promise<Estimate> {
  // Fetch estimate lines using the Glidebase relationship pattern
  const { data: lines, error: linesError } = await supabaseClient
    .from('gl_estimate_lines')
    .select('*, product:gl_products(*)')
    .eq('rowid_estimates', estimate.glide_row_id)
    .order('id');

  if (linesError) {
    console.error('Error fetching estimate lines:', linesError);
  }

  // Fetch customer credits
  const { data: credits, error: creditsError } = await supabaseClient
    .from('gl_customer_credits')
    .select('*')
    .eq('rowid_estimates', estimate.glide_row_id)
    .order('date_of_payment', { ascending: false });

  if (creditsError) {
    console.error('Error fetching customer credits:', creditsError);
  }

  // Combine all data into a complete estimate object
  return {
    ...estimate,
    lines: lines || [],
    customer_credits: credits || []
  } as Estimate;
}
