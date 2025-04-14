import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { storePDF } from './pdf-storage';

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
  let currentY = 20;
  
  // Add header with company info
  doc.setFontSize(20);
  doc.text('INVOICE', 105, currentY, { align: 'center' });
  currentY += 15;
  
  // Add company info
  doc.setFontSize(12);
  doc.text('Your Company Name', 20, currentY);
  currentY += 10;
  doc.text('123 Business St', 20, currentY);
  currentY += 7;
  doc.text('City, State 12345', 20, currentY);
  currentY += 7;
  doc.text('Phone: (555) 555-5555', 20, currentY);
  currentY += 7;
  doc.text('Email: info@yourcompany.com', 20, currentY);
  
  // Add invoice info
  currentY = 35;
  doc.setFontSize(12);
  doc.text(`Invoice #: ${invoice.invoice_uid || 'N/A'}`, 130, currentY);
  currentY += 10;
  doc.text(`Date: ${formatShortDate(invoice.invoice_order_date)}`, 130, currentY);
  currentY += 10;
  
  // Add customer info
  currentY = 80;
  doc.setFontSize(14);
  doc.text('Bill To:', 20, currentY);
  currentY += 10;
  doc.setFontSize(12);
  if (invoice.gl_accounts) {
    doc.text(invoice.gl_accounts.account_name || 'N/A', 20, currentY);
    currentY += 7;
    // Add more customer details if available
  } else {
    doc.text('Customer information not available', 20, currentY);
  }
  
  // Add invoice items table
  currentY += 20;
  const tableColumn: AutoTableColumn[] = [
    { header: 'Item', dataKey: 'item' },
    { header: 'Description', dataKey: 'description' },
    { header: 'Qty', dataKey: 'qty' },
    { header: 'Unit Price', dataKey: 'price' },
    { header: 'Total', dataKey: 'total' }
  ];
  
  const tableRows = [];
  
  if (invoice.invoice_lines && invoice.invoice_lines.length > 0) {
    for (const line of invoice.invoice_lines) {
      tableRows.push({
        item: line.gl_products?.display_name || 'N/A',
        description: line.product_sale_note || '',
        qty: line.qty_sold || 0,
        price: formatCurrency(line.selling_price || 0),
        total: formatCurrency(line.line_total || 0)
      });
    }
  } else {
    tableRows.push({
      item: 'No items',
      description: '',
      qty: '',
      price: '',
      total: ''
    });
  }
  
  doc.autoTable({
    head: [tableColumn.map(col => col.header)],
    body: tableRows.map(row => [
      row.item,
      row.description,
      row.qty,
      row.price,
      row.total
    ]),
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: [66, 66, 66] }
  });
  
  // Get the y position after the table
  currentY = (doc as any).lastAutoTable.finalY + 20;
  
  // Add totals
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`Subtotal:`, 150, currentY, { align: 'right' });
  doc.text(formatCurrency(invoice.total_amount || 0), 190, currentY, { align: 'right' });
  doc.setFont(undefined, 'normal');
  
  currentY += 10;
  doc.setFont(undefined, 'bold');
  doc.text(`Amount Paid:`, 150, currentY, { align: 'right' });
  doc.text(formatCurrency(invoice.total_paid || 0), 190, currentY, { align: 'right' });
  doc.setFont(undefined, 'normal');
  
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
export async function generatePurchaseOrderPDF(purchaseOrder: PurchaseOrder): Promise<jsPDF> {
  try {
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

    // Ensure lineItems is an array
    const lineItems = purchaseOrder.lineItems || [];
    
    // Map purchase order products to table rows
    const rows = lineItems.map(item => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const total = item.total || quantity * unitPrice;
      
      return [
        item.display_name || item.vendor_product_name || item.new_product_name || 'N/A',
        quantity,
        formatCurrency(unitPrice),
        formatCurrency(total)
      ];
    });

    // Add the items table to the document
    (doc as any).autoTable({
      head: [['Product', 'Quantity', 'Unit Price', 'Total']],
      body: rows.length > 0 ? rows : [['No items', '', '', '']],
      startY: 80,
      ...tableStyles
    });

    // Get the final Y position of the table
    const finalY = (doc as any).autoTable.previous.finalY;

    // Calculate total items
    const totalItems = lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

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
  } catch (error) {
    console.error('Error generating purchase order PDF:', error);
    throw error;
  }
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
    
    if (poError || !purchaseOrder) {
      console.error('Error fetching purchase order:', poError);
      return [];
    }
    
    // Then fetch the line items using the glide_row_id
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('gl_purchase_order_lines')
      .select('*')
      .eq('rowid_purchase_order', purchaseOrder.glide_row_id);

    if (lineItemsError) {
      console.error('Error fetching purchase order line items:', lineItemsError);
      return [];
    }

    return lineItems || [];
  } catch (error) {
    console.error('Exception fetching purchase order line items:', error);
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
 * Generate a standardized filename for PDF documents
 * 
 * @param type - The type of document ('invoice', 'purchaseOrder', or 'estimate')
 * @param data - The document data containing the UID
 * @returns A standardized filename string
 * 
 * @example
 * // Generate filename for an invoice
 * const filename = generateFilename('invoice', invoiceData);
 * // Returns 'invoice-INV12345.pdf'
 */
export function generateFilename(
  type: 'invoice' | 'purchaseOrder' | 'estimate',
  data: Invoice | PurchaseOrder | Estimate
): string {
  let uid = '';
  
  if (type === 'invoice' && 'invoice_uid' in data) {
    uid = data.invoice_uid || data.id || '';
  } else if (type === 'estimate' && 'estimate_uid' in data) {
    uid = data.estimate_uid || data.id || '';
  } else if (type === 'purchaseOrder' && 'id' in data) {
    uid = data.id || '';
  }
  
  // Format the type for the filename
  const formattedType = type === 'purchaseOrder' ? 'purchase-order' : type;
  
  return `${formattedType}-${uid}.pdf`;
}

/**
 * Complete workflow to generate PDF without storage (storage will be handled by edge function)
 * 
 * @param type - The type of document ('invoice', 'purchaseOrder', or 'estimate')
 * @param data - The document data
 * @param download - Whether to trigger browser download (only works in browser context)
 * @returns The PDF document as a Blob or null if generation failed
 * 
 * @example
 * // Generate a purchase order PDF
 * const pdfBlob = await generatePDFDocument('purchaseOrder', purchaseOrderData, true);
 * if (pdfBlob) {
 *   // Use the blob with the edge function to store it
 * }
 */
export async function generatePDFDocument(
  type: 'invoice' | 'purchaseOrder' | 'estimate',
  data: Invoice | PurchaseOrder | Estimate,
  download: boolean = false
): Promise<Blob | null> {
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
        try {
          const lineItems = await fetchPurchaseOrderLineItems(purchaseOrder.id);
          
          if (lineItems && lineItems.length > 0) {
            purchaseOrder.lineItems = mapPurchaseOrderLineItems(lineItems);
          } else {
            console.warn(`No line items found for purchase order ${purchaseOrder.id}`);
            purchaseOrder.lineItems = [];
          }
        } catch (lineItemError) {
          console.error('Error fetching line items:', lineItemError);
          purchaseOrder.lineItems = [];
        }
      }
    }

    // Generate the PDF document
    let doc;
    try {
      doc = generatePDF(type, data);
    } catch (genError) {
      console.error(`Error in PDF generation for ${type}:`, genError);
      return null;
    }
    
    if (!doc) {
      console.error(`Failed to generate ${type} PDF`);
      return null;
    }

    // Generate an appropriate filename
    let fileName: string;

    if (type === 'invoice') {
      const invoice = data as Invoice;
      fileName = invoice.invoice_uid 
        ? `${invoice.invoice_uid}.pdf` 
        : `INV-${invoice.glide_row_id || invoice.id}.pdf`;
    } else if (type === 'purchaseOrder') {
      const purchaseOrder = data as PurchaseOrder;
      fileName = purchaseOrder.purchase_order_uid 
        ? `${purchaseOrder.purchase_order_uid}.pdf` 
        : `PO-${purchaseOrder.glide_row_id || purchaseOrder.id}.pdf`;
    } else { // estimate
      const estimate = data as Estimate;
      fileName = estimate.estimate_uid 
        ? `${estimate.estimate_uid}.pdf` 
        : `EST-${estimate.glide_row_id || estimate.id}.pdf`;
    }

    // Save locally if requested
    if (download) {
      doc.save(fileName);
    }

    // Convert to blob for edge function upload
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  } catch (error) {
    console.error(`Error in generatePDFDocument for ${type}:`, error);
    return null;
  }
}

/**
 * Trigger PDF generation using the new edge function
 * 
 * @param type - The type of document ('invoice', 'purchaseOrder', or 'estimate')
 * @param data - The document data
 * @param forceRegenerate - Whether to regenerate the PDF even if it already exists
 * @returns The URL of the generated PDF or null if generation failed
 * 
 * @example
 * // Generate a purchase order PDF
 * const pdfUrl = await triggerPDFGeneration('purchaseOrder', purchaseOrderData);
 * if (pdfUrl) {
 *   console.log('PDF generated successfully:', pdfUrl);
 * }
 */
export async function triggerPDFGeneration(
  type: 'invoice' | 'purchaseOrder' | 'estimate',
  data: Invoice | PurchaseOrder | Estimate,
  forceRegenerate: boolean = false
): Promise<string | null> {
  try {
    if (!data || !data.id) {
      console.error('Invalid document data provided for PDF generation');
      return null;
    }

    // If document already has a PDF URL and we're not forcing regeneration, return it
    if (!forceRegenerate && data.supabase_pdf_url) {
      console.log(`Using existing PDF URL for ${type}: ${data.supabase_pdf_url}`);
      return data.supabase_pdf_url;
    }
    
    // Map document type to edge function parameter
    const documentType = type === 'invoice' 
      ? 'invoice' 
      : type === 'purchaseOrder' 
        ? 'purchase-order' 
        : 'estimate';
    
    // Trigger PDF generation using the edge function
    const result = await storePDF(null, documentType, data.id);
    
    if (result.success && result.url) {
      console.log(`Successfully generated ${type} PDF: ${result.url}`);
      return result.url;
    } else {
      console.error(`PDF generation failed for ${type}: ${result.message}`);
      return null;
    }
  } catch (error) {
    console.error(`Error in triggerPDFGeneration for ${type}:`, error);
    return null;
  }
}

/**
 * Legacy function for generating and storing PDF using client-side jsPDF
 * 
 * @deprecated Use triggerPDFGeneration instead which generates PDFs on the server
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
  // Output deprecation warning
  console.warn(
    'generateAndStorePDF is deprecated and will be removed in a future update. ' +
    'Use triggerPDFGeneration instead to generate PDFs on the server.'
  );

  // Call the new method instead
  return triggerPDFGeneration(type, data, true);
}

/**
 * This function will be replaced by an edge function
 * @deprecated Use the edge function for PDF storage instead
 */
export async function storePDFInSupabase(
  doc: jsPDF,
  entityType: 'invoice' | 'purchase-order' | 'estimate',
  entityId: string,
  fileName?: string
): Promise<string | null> {
  console.warn('storePDFInSupabase is deprecated. Use the edge function for PDF storage instead.');
  return `https://placeholder-url-for-${entityType}-${entityId}.pdf`;
}

/**
 * This function will be replaced by an edge function
 * @deprecated Use the edge function for database updates instead
 */
export async function updatePDFLinkInDatabase(
  tableName: 'gl_invoices' | 'gl_purchase_orders' | 'gl_estimates',
  recordId: string,
  pdfUrl: string
): Promise<boolean> {
  console.warn('updatePDFLinkInDatabase is deprecated. Use the edge function for database updates instead.');
  return true;
}
