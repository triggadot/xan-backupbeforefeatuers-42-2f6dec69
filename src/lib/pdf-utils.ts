import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      head?: Array<Array<string>>;
      body?: Array<Array<string | number>>;
      columns?: Array<{ header: string; dataKey: string }>;
      startY?: number;
      margin?: { top?: number; right?: number; bottom?: number; left?: number };
      styles?: any;
      headStyles?: any;
      bodyStyles?: any;
      theme?: string;
      didDrawPage?: (data: any) => void;
      didParseCell?: (data: any) => void;
      willDrawCell?: (data: any) => void;
      columnStyles?: any;
      html?: string | HTMLElement;
      data?: any;
    }) => any;
  }
}

// Define types for our PDF generation
type Account = Database['public']['Tables']['gl_accounts']['Row'];
type Invoice = Database['public']['Tables']['gl_invoices']['Row'] & {
  gl_accounts?: Account;
  invoice_lines?: InvoiceLine[];
  invoice_uid?: string; // Added for UID reference
};
type InvoiceLine = Database['public']['Tables']['gl_invoice_lines']['Row'] & {
  gl_products?: Product;
};
type Product = Database['public']['Tables']['gl_products']['Row'];
type PurchaseOrder = Database['public']['Tables']['gl_purchase_orders']['Row'] & {
  gl_accounts?: Account;
  lineItems?: LineItem[];
};
type LineItem = Database['public']['Tables']['gl_purchase_order_lines']['Row'] & {
  gl_products?: Product;
};
type Estimate = Database['public']['Tables']['gl_estimates']['Row'] & {
  gl_accounts?: Account;
  estimate_lines?: EstimateLine[];
  estimate_uid?: string; // Added for UID reference
};
type EstimateLine = Database['public']['Tables']['gl_estimate_lines']['Row'] & {
  gl_products?: Product;
};

// Helper type for jspdf-autotable
interface AutoTableColumn {
  header: string;
  dataKey: string;
}

// Format currency consistently
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// Format date consistently
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format a date string to a short date format (MM/DD/YYYY)
 * 
 * @param dateString - The date string to format
 * @returns Formatted date string or 'N/A' if date is invalid
 * 
 * @example
 * formatShortDate('2023-01-15') // Returns '01/15/2023'
 * formatShortDate('invalid') // Returns 'N/A'
 */
export function formatShortDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string provided: ${dateString}`);
    return 'N/A';
  }
  
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month}/${day}/${year}`;
}

/**
 * Generate a PDF for an invoice
 * @param invoice The invoice data with related account and line items
 * @returns jsPDF document object
 */
export function generateInvoicePDF(invoice: Invoice): jsPDF {
  const doc = new jsPDF();
  
  // Add letterhead
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('INVOICE', 105, 20, { align: 'center' });
  doc.setFont(undefined, 'normal');
  
  // Add horizontal line
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);
  
  // Add invoice details
  doc.setFontSize(12);
  doc.text(`Invoice #: ${invoice.invoice_uid || 'N/A'}`, 20, 45);
  doc.text(`Date: ${formatShortDate(invoice.invoice_order_date)}`, 150, 45, { align: 'right' });
  
  // Add customer details
  doc.setFontSize(11);
  doc.text('Bill To:', 20, 60);
  doc.setFont(undefined, 'bold');
  doc.text(invoice.gl_accounts?.account_name || 'N/A', 20, 70);
  doc.setFont(undefined, 'normal');
  
  // Define the table styles
  const tableStyles = {
    headStyles: {
      fillColor: [44, 62, 80], // Dark blue header
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240] // Light gray for alternate rows
    },
    columnStyles: {
      0: { cellWidth: 'auto' }, // Product name
      1: { cellWidth: 40, halign: 'center' }, // Quantity
      2: { cellWidth: 40, halign: 'right' }, // Price
      3: { cellWidth: 40, halign: 'right' } // Total
    },
    margin: { top: 80 }
  };

  // Map invoice products to table rows
  const rows = invoice.invoice_lines?.map(line => [
    line.renamed_product_name || 'N/A',
    line.qty_sold || 0,
    formatCurrency(line.selling_price || 0),
    formatCurrency(line.line_total || 0)
  ]) || [];

  // Add the items table to the document
  (doc as any).autoTable({
    head: [['Product', 'Quantity', 'Unit Price', 'Total']],
    body: rows,
    startY: 80,
    ...tableStyles
  });

  // Get the final Y position of the table
  const finalY = (doc as any).autoTable.previous.finalY;

  // Add totals section
  doc.setFontSize(11);
  doc.text(`Subtotal:`, 150, finalY + 15, { align: 'right' });
  doc.text(formatCurrency(invoice.total_amount || 0), 190, finalY + 15, { align: 'right' });
  
  let currentY = finalY + 15;
  
  if (invoice.tax_rate && invoice.tax_rate > 0) {
    currentY += 10;
    doc.text(`Tax (${invoice.tax_rate}%):`, 150, currentY, { align: 'right' });
    doc.text(formatCurrency(invoice.tax_amount || 0), 190, currentY, { align: 'right' });
    
    currentY += 10;
    doc.text(`Total:`, 150, currentY, { align: 'right' });
    doc.text(formatCurrency((invoice.total_amount || 0) + (invoice.tax_amount || 0)), 190, currentY, { align: 'right' });
  }
  
  currentY += 10;
  doc.text(`Payments:`, 150, currentY, { align: 'right' });
  doc.text(formatCurrency(invoice.total_paid || 0), 190, currentY, { align: 'right' });
  
  currentY += 10;
  doc.setFont(undefined, 'bold');
  doc.text(`Balance Due:`, 150, currentY, { align: 'right' });
  doc.text(formatCurrency(invoice.balance || 0), 190, currentY, { align: 'right' });
  doc.setFont(undefined, 'normal');
  
  // Add payment status
  currentY += 20;
  doc.setFontSize(10);
  doc.text(`Payment Status: ${invoice.payment_status || 'N/A'}`, 20, currentY);
  
  // Add notes if available
  if (invoice.notes) {
    currentY += 15;
    doc.text('Notes:', 20, currentY);
    currentY += 10;
    doc.text(invoice.notes, 20, currentY);
  }

  return doc;
}

/**
 * Generate a PDF for a purchase order
 * @param purchaseOrder The purchase order data with related account and products
 * @returns jsPDF document object
 */
export function generatePurchaseOrderPDF(purchaseOrder: PurchaseOrder): jsPDF {
  const doc = new jsPDF();

  // Add letterhead
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('PURCHASE ORDER', 105, 20, { align: 'center' });
  doc.setFont(undefined, 'normal');
  
  // Add horizontal line
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);

  // Add purchase order details
  doc.setFontSize(12);
  doc.text(`${purchaseOrder.purchase_order_uid || 'N/A'}`, 20, 45);
  doc.text(`Date: ${formatShortDate(purchaseOrder.po_date)}`, 150, 45, { align: 'right' });

  // Add vendor details
  doc.setFontSize(11);
  doc.text('Vendor:', 20, 60);
  doc.setFont(undefined, 'bold');
  doc.text(purchaseOrder.gl_accounts?.account_name || 'N/A', 20, 70);
  doc.setFont(undefined, 'normal');

  // Define the table styles
  const tableStyles = {
    headStyles: {
      fillColor: [44, 62, 80], // Dark blue header
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240] // Light gray for alternate rows
    },
    columnStyles: {
      0: { cellWidth: 'auto' }, // Product name
      1: { cellWidth: 40, halign: 'center' }, // Quantity
      2: { cellWidth: 40, halign: 'right' }, // Cost
      3: { cellWidth: 40, halign: 'right' } // Total
    },
    margin: { top: 80 }
  };

  // Map purchase order products to table rows
  const rows = purchaseOrder.lineItems?.map(item => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const total = item.total || quantity * unitPrice;
    
    return [
      item.display_name || item.vendor_product_name || item.new_product_name || 'N/A',
      quantity,
      formatCurrency(unitPrice),
      formatCurrency(total)
    ];
  }) || [];

  // Add the items table to the document
  (doc as any).autoTable({
    head: [['Product', 'Quantity', 'Unit Price', 'Total']],
    body: rows,
    startY: 80,
    ...tableStyles
  });

  // Get the final Y position of the table
  const finalY = (doc as any).autoTable.previous.finalY;

  // Calculate total items
  const totalItems = purchaseOrder.lineItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  // Add totals section
  doc.setFontSize(11);
  doc.text(`Subtotal (${totalItems} items):`, 150, finalY + 15, { align: 'right' });
  doc.text(formatCurrency(purchaseOrder.total_amount || 0), 190, finalY + 15, { align: 'right' });
  
  let currentY = finalY + 25;
  doc.text(`Payments:`, 150, currentY, { align: 'right' });
  doc.text(formatCurrency(purchaseOrder.total_paid || 0), 190, currentY, { align: 'right' });
  
  currentY += 10;
  doc.setFont(undefined, 'bold');
  doc.text(`Balance Due:`, 150, currentY, { align: 'right' });
  doc.text(formatCurrency(purchaseOrder.balance || 0), 190, currentY, { align: 'right' });
  doc.setFont(undefined, 'normal');

  return doc;
}

/**
 * Generate a PDF for an estimate
 * @param estimate The estimate data with related account and line items
 * @returns jsPDF document object
 */
export function generateEstimatePDF(estimate: Estimate): jsPDF {
  const doc = new jsPDF();
  
  // Add letterhead
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('ESTIMATE', 105, 20, { align: 'center' });
  doc.setFont(undefined, 'normal');
  
  // Add horizontal line
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);
  
  // Add estimate details
  doc.setFontSize(12);
  doc.text(`${estimate.estimate_uid || 'N/A'}`, 20, 45);
  doc.text(`Date: ${formatShortDate(estimate.estimate_date)}`, 150, 45, { align: 'right' });
  
  // Add customer details
  doc.setFontSize(11);
  doc.text('Customer:', 20, 60);
  doc.setFont(undefined, 'bold');
  doc.text(estimate.gl_accounts?.account_name || 'N/A', 20, 70);
  doc.setFont(undefined, 'normal');
  
  // Define the table styles
  const tableStyles = {
    headStyles: {
      fillColor: [44, 62, 80], // Dark blue header
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240] // Light gray for alternate rows
    },
    columnStyles: {
      0: { cellWidth: 'auto' }, // Product name
      1: { cellWidth: 40, halign: 'center' }, // Quantity
      2: { cellWidth: 40, halign: 'right' }, // Price
      3: { cellWidth: 40, halign: 'right' } // Total
    },
    margin: { top: 80 }
  };

  // Map estimate products to table rows
  const rows = estimate.estimate_lines?.map(line => [
    line.sale_product_name || 'N/A',
    line.qty_sold || 0,
    formatCurrency(line.selling_price || 0),
    formatCurrency(line.line_total || 0)
  ]) || [];

  // Add the items table to the document
  (doc as any).autoTable({
    head: [['Product', 'Quantity', 'Unit Price', 'Total']],
    body: rows,
    startY: 80,
    ...tableStyles
  });

  // Get the final Y position of the table
  const finalY = (doc as any).autoTable.previous.finalY;

  // Add total amount
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(`Total Amount:`, 150, finalY + 15, { align: 'right' });
  doc.text(formatCurrency(estimate.total_amount || 0), 190, finalY + 15, { align: 'right' });
  doc.setFont(undefined, 'normal');
  
  // Add status
  let currentY = finalY + 30;
  doc.setFontSize(10);
  doc.text(`Status: ${estimate.status || 'N/A'}`, 20, currentY);

  return doc;
}

/**
 * Fetch purchase order line items from the database
 * 
 * @param purchaseOrderId - The unique identifier of the purchase order
 * @returns Promise resolving to an array of line items with product details
 * 
 * @example
 * // Fetch line items for a purchase order
 * const lineItems = await fetchPurchaseOrderLineItems('123e4567-e89b-12d3-a456-426614174000');
 * console.log(`Found ${lineItems.length} line items`);
 * 
 * @throws Will log errors but return an empty array rather than throwing to prevent UI disruption
 */
export async function fetchPurchaseOrderLineItems(purchaseOrderId: string): Promise<any[]> {
  try {
    console.log(`Fetching line items for purchase order ID: ${purchaseOrderId}`);
    
    // First, get the purchase order to get its glide_row_id
    const { data: purchaseOrder, error: poError } = await supabase
      .from('gl_purchase_orders')
      .select('glide_row_id')
      .eq('id', purchaseOrderId)
      .single();
    
    if (poError) {
      console.error('Error fetching purchase order:', poError);
      return [];
    }
    
    if (!purchaseOrder || !purchaseOrder.glide_row_id) {
      console.error('Purchase order not found or missing glide_row_id:', purchaseOrderId);
      return [];
    }
    
    console.log(`Found purchase order with glide_row_id: ${purchaseOrder.glide_row_id}`);
    
    // Try to use a stored procedure first (if it exists)
    try {
      const { data: lineItems, error: rpcError } = await supabase
        .rpc('fetch_purchase_order_lines', { 
          po_id: purchaseOrder.glide_row_id 
        });
      
      if (!rpcError && lineItems) {
        console.log(`Successfully fetched ${lineItems.length} line items via RPC`);
        return lineItems;
      }
    } catch (rpcError) {
      console.log('RPC method not available, falling back to direct query');
    }
    
    // Fallback to direct query
    console.log('Fetching line items via direct query');
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('gl_purchase_order_lines')
      .select('*')
      .eq('rowid_purchase_order', purchaseOrder.glide_row_id);
    
    if (lineItemsError) {
      console.error('Error fetching line items via direct query:', lineItemsError);
      return [];
    }
    
    console.log(`Successfully fetched ${lineItems?.length || 0} line items via direct query`);
    return lineItems || [];
  } catch (error) {
    console.error('Unexpected error in fetchPurchaseOrderLineItems:', error);
    return [];
  }
}

/**
 * Map database line items to the format expected by the PDF generation function
 * 
 * @param lineItems - Raw line items from the database
 * @returns Formatted line items ready for PDF generation
 * 
 * @example
 * const formattedItems = mapPurchaseOrderLineItems(rawItems);
 * // formattedItems will have the correct property names for PDF generation
 */
function mapPurchaseOrderLineItems(lineItems: any[]): any[] {
  if (!lineItems || !Array.isArray(lineItems)) {
    console.warn('Invalid line items provided to mapper:', lineItems);
    return [];
  }
  
  return lineItems.map(item => {
    // Log the raw item for debugging
    console.log('Mapping line item:', item);
    
    // Handle different property naming conventions
    return {
      display_name: item.product_name || item.vendor_product_name || 'N/A',
      vendor_product_name: item.vendor_product_name || '',
      new_product_name: item.new_product_name || '',
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: parseFloat(item.unit_price || item.unitPrice || 0),
      total: parseFloat(item.total) || (parseFloat(item.quantity || 0) * parseFloat(item.unit_price || item.unitPrice || 0)),
      notes: item.notes || ''
    };
  });
}

/**
 * Generate, save locally, and upload a purchase order PDF to Supabase storage
 * 
 * @param purchaseOrder - The purchase order data
 * @param saveLocally - Whether to also save the PDF locally
 * @returns The URL of the uploaded file or null if upload failed
 * 
 * @deprecated Use generateAndStorePDF('purchaseOrder', purchaseOrder, saveLocally) instead
 */
export async function generateAndStorePurchaseOrderPDF(
  purchaseOrder: PurchaseOrder, 
  saveLocally: boolean = false
): Promise<string | null> {
  console.warn('generateAndStorePurchaseOrderPDF is deprecated. Use generateAndStorePDF for consistent behavior.');
  return generateAndStorePDF('purchaseOrder', purchaseOrder, saveLocally);
}

/**
 * Generate a PDF based on document type and data
 * 
 * @param type - The type of document ('invoice', 'purchaseOrder', or 'estimate')
 * @param data - The document data
 * @returns The generated PDF document or null if generation failed
 * 
 * @example
 * // Generate a PDF for a purchase order
 * const doc = generatePDF('purchaseOrder', purchaseOrderData);
 * if (doc) {
 *   doc.save('purchase-order.pdf');
 * }
 */
export function generatePDF(
  type: 'invoice' | 'purchaseOrder' | 'estimate',
  data: Invoice | PurchaseOrder | Estimate
): jsPDF | null {
  try {
    if (!data) {
      console.error(`Cannot generate PDF: No ${type} data provided`);
      return null;
    }
    
    // Generate PDF based on document type
    if (type === 'invoice') {
      return generateInvoicePDF(data as Invoice);
    } else if (type === 'purchaseOrder') {
      return generatePurchaseOrderPDF(data as PurchaseOrder);
    } else if (type === 'estimate') {
      return generateEstimatePDF(data as Estimate);
    }
    
    console.error(`Unknown document type: ${type}`);
    return null;
  } catch (error) {
    console.error(`Error generating ${type} PDF:`, error);
    return null;
  }
}

/**
 * Generate a filename for a PDF document
 * @param prefix The document type prefix (e.g., 'Invoice', 'PO', 'Estimate')
 * @param id The document ID or UID
 * @param date The document date
 * @returns A formatted filename string
 */
export function generateFilename(prefix: string, id: string, date: Date | string): string {
  const formattedDate = typeof date === 'string' 
    ? new Date(date).toISOString().split('T')[0] 
    : date.toISOString().split('T')[0];
  
  return `${prefix}_${id}_${formattedDate}.pdf`;
}

/**
 * Store a PDF document in Supabase storage
 * @param doc The jsPDF document to store
 * @param entityType The type of entity ('invoice', 'purchase-order', 'estimate')
 * @param entityId The ID of the entity
 * @param fileName Optional custom filename
 * @returns The public URL of the stored PDF or null if storage failed
 */
export async function storePDFInSupabase(
  doc: jsPDF,
  entityType: 'invoice' | 'purchase-order' | 'estimate',
  entityId: string,
  fileName?: string
): Promise<string | null> {
  try {
    // Convert the PDF to a blob
    const pdfOutput = doc.output('blob');
    
    // Generate a filename if not provided
    const finalFileName = fileName || `${entityType}_${entityId}_${new Date().toISOString()}.pdf`;
    
    // Determine the folder path based on entity type
    const folderPath = entityType === 'invoice' 
      ? 'Invoices' 
      : entityType === 'purchase-order' 
        ? 'PurchaseOrders' 
        : 'Estimates';
    
    // Upload to Supabase storage
    const { data, error } = await supabase
      .storage
      .from('documents')
      .upload(`${folderPath}/${finalFileName}`, pdfOutput, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (error) {
      console.error(`Error uploading ${entityType} PDF to Supabase:`, error);
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = supabase
      .storage
      .from('documents')
      .getPublicUrl(`${folderPath}/${finalFileName}`);
    
    if (!urlData || !urlData.publicUrl) {
      console.error(`Failed to get public URL for ${entityType} PDF`);
      return null;
    }
    
    console.log(`PDF stored successfully: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in storePDFInSupabase:', error);
    return null;
  }
}

/**
 * Upload a PDF to Supabase storage
 * @param doc The jsPDF document to upload
 * @param folderName The folder to store the PDF in (Invoices, PurchaseOrders, or Estimates)
 * @param fileName The name of the file
 * @returns The URL of the uploaded file or null if upload failed
 * 
 * @deprecated Use storePDFInSupabase instead for consistent storage behavior
 */
export async function uploadPDFToStorage(
  doc: jsPDF, 
  folderName: 'Invoices' | 'PurchaseOrders' | 'Estimates', 
  fileName: string
): Promise<string | null> {
  console.warn('uploadPDFToStorage is deprecated. Use storePDFInSupabase for consistent storage behavior.');
  try {
    // Convert PDF to blob
    const pdfBlob = doc.output('blob');
    
    // Upload to Supabase storage
    const filePath = `${folderName}/${fileName}`;
    const { data, error } = await supabase.storage
      .from('pdf')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true // Overwrite if exists
      });
    
    if (error) {
      console.error('Error uploading PDF:', error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('pdf')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadPDFToStorage:', error);
    return null;
  }
}

/**
 * Fetch purchase order line items from the database
 * @param purchaseOrderId The ID of the purchase order
 * @returns Array of line items with product details
 */
/**
 * Removing duplicate function - this is already defined above at line 401
 */

/**
 * Generate, save locally, and upload an invoice PDF to Supabase storage
 * @param invoice The invoice data
 * @param saveLocally Whether to also save the PDF locally
 * @returns The URL of the uploaded file or null if upload failed
 * 
 * @deprecated Use generateAndStorePDF('invoice', invoice, saveLocally) instead
 */
export async function generateAndStoreInvoicePDF(
  invoice: Invoice, 
  saveLocally: boolean = false
): Promise<string | null> {
  console.warn('generateAndStoreInvoicePDF is deprecated. Use generateAndStorePDF for consistent behavior.');
  return generateAndStorePDF('invoice', invoice, saveLocally);
}

/**
 * Generate, save locally, and upload an estimate PDF to Supabase storage
 * @param estimate The estimate data
 * @param saveLocally Whether to also save the PDF locally
 * @returns The URL of the uploaded file or null if upload failed
 * 
 * @deprecated Use generateAndStorePDF('estimate', estimate, saveLocally) instead
 */
export async function generateAndStoreEstimatePDF(
  estimate: Estimate, 
  saveLocally: boolean = false
): Promise<string | null> {
  console.warn('generateAndStoreEstimatePDF is deprecated. Use generateAndStorePDF for consistent behavior.');
  return generateAndStorePDF('estimate', estimate, saveLocally);
}

/**
 * Update the PDF link in the database after uploading
 * 
 * @param table - The table to update ('gl_invoices', 'gl_purchase_orders', or 'gl_estimates')
 * @param id - The ID of the record to update
 * @param pdfUrl - The URL of the uploaded PDF
 * @returns Whether the update was successful
 * 
 * @example
 * const success = await updatePDFLinkInDatabase('gl_invoices', '123', 'https://example.com/invoice.pdf');
 */
export async function updatePDFLinkInDatabase(
  table: 'gl_invoices' | 'gl_purchase_orders' | 'gl_estimates',
  id: string,
  pdfUrl: string
): Promise<boolean> {
  try {
    if (!id) {
      console.error('Cannot update PDF link: Missing ID');
      return false;
    }

    if (!pdfUrl) {
      console.error('Cannot update PDF link: Missing PDF URL');
      return false;
    }

    // Determine the correct field name based on the table
    // Always use supabase_pdf_url for consistency
    const { data, error } = await supabase
      .from(table)
      .update({ supabase_pdf_url: pdfUrl })
      .eq('id', id);

    if (error) {
      console.error(`Error updating PDF link in ${table}:`, error);
      return false;
    }

    console.log(`Successfully updated PDF link in ${table} for ID ${id}`);
    return true;
  } catch (error) {
    console.error('Error in updatePDFLinkInDatabase:', error);
    return false;
  }
}

/**
 * Complete workflow to generate, store, and update database with PDF link
 * 
 * @param type - The type of document ('invoice', 'purchaseOrder', or 'estimate')
 * @param data - The document data
 * @param saveLocally - Whether to also save the PDF locally
 * @param download - Whether to trigger browser download (only works in browser context)
 * @returns The URL of the uploaded PDF or null if any step failed
 * 
 * @example
 * // Generate and store a purchase order PDF
 * const pdfUrl = await generateAndStorePDF('purchaseOrder', purchaseOrderData, true);
 * if (pdfUrl) {
 *   console.log('PDF generated and stored successfully:', pdfUrl);
 * }
 */
export async function generateAndStorePDF(
  type: 'invoice' | 'purchaseOrder' | 'estimate',
  data: Invoice | PurchaseOrder | Estimate,
  saveLocally: boolean = false,
  download: boolean = false
): Promise<string | null> {
  try {
    if (!data) {
      console.error(`Cannot generate PDF: No ${type} data provided`);
      return null;
    }

    if (!data.id) {
      console.error(`Cannot generate PDF: Missing ID for ${type}`);
      return null;
    }

    // Prepare data if needed (e.g., fetch line items for purchase orders)
    if (type === 'purchaseOrder') {
      const purchaseOrder = data as PurchaseOrder;
      if (!purchaseOrder.lineItems || purchaseOrder.lineItems.length === 0) {
        console.log(`Fetching line items for purchase order: ${purchaseOrder.id}`);
        const lineItems = await fetchPurchaseOrderLineItems(purchaseOrder.id);
        
        if (lineItems && lineItems.length > 0) {
          purchaseOrder.lineItems = mapPurchaseOrderLineItems(lineItems);
        } else {
          console.warn(`No line items found for purchase order ${purchaseOrder.id}`);
          purchaseOrder.lineItems = [];
        }
      }
    }

    // Generate the PDF document
    const doc = generatePDF(type, data);
    if (!doc) {
      console.error(`Failed to generate ${type} PDF`);
      return null;
    }

    // Generate an appropriate filename
    let fileName: string;
    let folderName: 'Invoices' | 'PurchaseOrders' | 'Estimates';
    let tableName: 'gl_invoices' | 'gl_purchase_orders' | 'gl_estimates';

    if (type === 'invoice') {
      const invoice = data as Invoice;
      fileName = invoice.invoice_uid 
        ? `${invoice.invoice_uid}.pdf` 
        : `INV-${invoice.glide_row_id || invoice.id}.pdf`;
      folderName = 'Invoices';
      tableName = 'gl_invoices';
    } else if (type === 'purchaseOrder') {
      const purchaseOrder = data as PurchaseOrder;
      fileName = purchaseOrder.purchase_order_uid 
        ? `${purchaseOrder.purchase_order_uid}.pdf` 
        : `PO-${purchaseOrder.glide_row_id || purchaseOrder.id}.pdf`;
      folderName = 'PurchaseOrders';
      tableName = 'gl_purchase_orders';
    } else { // estimate
      const estimate = data as Estimate;
      fileName = estimate.estimate_uid 
        ? `${estimate.estimate_uid}.pdf` 
        : `EST-${estimate.glide_row_id || estimate.id}.pdf`;
      folderName = 'Estimates';
      tableName = 'gl_estimates';
    }

    // Save locally if requested
    if (saveLocally || download) {
      doc.save(fileName);
    }

    // Upload to storage
    const pdfUrl = await storePDFInSupabase(
      doc, 
      type === 'invoice' ? 'invoice' : type === 'purchaseOrder' ? 'purchase-order' : 'estimate',
      data.id,
      fileName
    );

    if (!pdfUrl) {
      console.error(`Failed to upload ${type} PDF to storage`);
      return null;
    }

    // Update the database with the PDF URL
    const updated = await updatePDFLinkInDatabase(tableName, data.id, pdfUrl);
    if (!updated) {
      console.warn(`Generated and stored ${type} PDF, but failed to update database record`);
      // Still return the URL even if database update failed
    }

    console.log(`Successfully generated and stored ${type} PDF: ${pdfUrl}`);
    return pdfUrl;
  } catch (error) {
    console.error(`Error in generateAndStorePDF for ${type}:`, error);
    return null;
  }
}

/**
 * Enum for PDF operation error types
 */
export enum PDFErrorType {
  FETCH_ERROR = 'FETCH_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

/**
 * Interface for PDF operation errors
 */
export interface PDFOperationError {
  type: PDFErrorType;
  message: string;
  details?: any;
}

/**
 * Interface for PDF operation results
 */
export interface PDFOperationResult {
  success: boolean;
  url?: string;
  error?: PDFOperationError;
}

/**
 * Create a standardized error response
 * 
 * @param type - Type of error
 * @param message - Human-readable error message
 * @param details - Additional error details
 * @returns Standardized error object
 */
function createPDFError(type: PDFErrorType, message: string, details?: any): PDFOperationError {
  return { type, message, details };
}
