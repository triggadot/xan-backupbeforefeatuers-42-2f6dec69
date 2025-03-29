import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

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
  products?: Product[];
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

// Format date in MM/DD/YYYY format
const formatShortDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};

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
  const rows = purchaseOrder.products?.map(product => {
    const quantity = product.total_qty_purchased || 0;
    const cost = product.cost || 0;
    const total = quantity * cost;
    
    return [
      product.vendor_product_name || product.new_product_name || 'N/A',
      quantity,
      formatCurrency(cost),
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
  const totalItems = purchaseOrder.products?.reduce((sum, product) => sum + (product.total_qty_purchased || 0), 0) || 0;

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
 * Upload a PDF to Supabase storage
 * @param doc The jsPDF document to upload
 * @param folderName The folder to store the PDF in (Invoices, PurchaseOrders, or Estimates)
 * @param fileName The name of the file
 * @returns The URL of the uploaded file or null if upload failed
 */
export async function uploadPDFToStorage(
  doc: jsPDF, 
  folderName: 'Invoices' | 'PurchaseOrders' | 'Estimates', 
  fileName: string
): Promise<string | null> {
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
 * Generate, save locally, and upload an invoice PDF to Supabase storage
 * @param invoice The invoice data
 * @param saveLocally Whether to also save the PDF locally
 * @returns The URL of the uploaded file or null if upload failed
 */
export async function generateAndStoreInvoicePDF(
  invoice: Invoice, 
  saveLocally: boolean = false
): Promise<string | null> {
  const doc = generateInvoicePDF(invoice);
  
  // Use the invoice UID directly for the filename if available
  const fileName = invoice.invoice_uid 
    ? `${invoice.invoice_uid}.pdf` 
    : `INV-${invoice.glide_row_id || 'unknown'}.pdf`;
  
  if (saveLocally) {
    doc.save(fileName);
  }
  
  return await uploadPDFToStorage(doc, 'Invoices', fileName);
}

/**
 * Generate, save locally, and upload a purchase order PDF to Supabase storage
 * @param purchaseOrder The purchase order data
 * @param saveLocally Whether to also save the PDF locally
 * @returns The URL of the uploaded file or null if upload failed
 */
export async function generateAndStorePurchaseOrderPDF(
  purchaseOrder: PurchaseOrder, 
  saveLocally: boolean = false
): Promise<string | null> {
  const doc = generatePurchaseOrderPDF(purchaseOrder);
  
  // Use the purchase order UID directly for the filename if available
  const fileName = purchaseOrder.purchase_order_uid 
    ? `${purchaseOrder.purchase_order_uid}.pdf` 
    : `PO-${purchaseOrder.glide_row_id || 'unknown'}.pdf`;
  
  if (saveLocally) {
    doc.save(fileName);
  }
  
  return await uploadPDFToStorage(doc, 'PurchaseOrders', fileName);
}

/**
 * Generate, save locally, and upload an estimate PDF to Supabase storage
 * @param estimate The estimate data
 * @param saveLocally Whether to also save the PDF locally
 * @returns The URL of the uploaded file or null if upload failed
 */
export async function generateAndStoreEstimatePDF(
  estimate: Estimate, 
  saveLocally: boolean = false
): Promise<string | null> {
  const doc = generateEstimatePDF(estimate);
  
  // Use the estimate UID directly for the filename if available
  const fileName = estimate.estimate_uid 
    ? `${estimate.estimate_uid}.pdf` 
    : `EST-${estimate.glide_row_id || 'unknown'}.pdf`;
  
  if (saveLocally) {
    doc.save(fileName);
  }
  
  return await uploadPDFToStorage(doc, 'Estimates', fileName);
}

/**
 * Update the PDF link in the database after uploading
 * @param table The table to update ('gl_invoices', 'gl_purchase_orders', or 'gl_estimates')
 * @param id The ID of the record to update
 * @param pdfUrl The URL of the uploaded PDF
 * @returns Whether the update was successful
 */
export async function updatePDFLinkInDatabase(
  table: 'gl_invoices' | 'gl_purchase_orders' | 'gl_estimates',
  id: string,
  pdfUrl: string
): Promise<boolean> {
  try {
    const fieldName = table === 'gl_purchase_orders' ? 'pdf_link' : 
                      table === 'gl_invoices' ? 'doc_glideforeverlink' : 
                      'glide_pdf_url';
    
    const { error } = await supabase
      .from(table)
      .update({ [fieldName]: pdfUrl })
      .eq('id', id);
    
    if (error) {
      console.error(`Error updating ${table}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updatePDFLinkInDatabase:', error);
    return false;
  }
}

/**
 * Complete workflow to generate, store, and update database with PDF link
 * @param type The type of document ('invoice', 'purchaseOrder', or 'estimate')
 * @param data The document data
 * @param saveLocally Whether to also save the PDF locally
 * @returns The URL of the uploaded PDF or null if any step failed
 */
export async function generateAndStorePDF(
  type: 'invoice' | 'purchaseOrder' | 'estimate',
  data: Invoice | PurchaseOrder | Estimate,
  saveLocally: boolean = false
): Promise<string | null> {
  let pdfUrl: string | null = null;
  
  // Generate and upload PDF
  if (type === 'invoice') {
    pdfUrl = await generateAndStoreInvoicePDF(data as Invoice, saveLocally);
  } else if (type === 'purchaseOrder') {
    pdfUrl = await generateAndStorePurchaseOrderPDF(data as PurchaseOrder, saveLocally);
  } else if (type === 'estimate') {
    pdfUrl = await generateAndStoreEstimatePDF(data as Estimate, saveLocally);
  }
  
  if (!pdfUrl) return null;
  
  // Update database with PDF link
  const table = type === 'invoice' ? 'gl_invoices' : 
                type === 'purchaseOrder' ? 'gl_purchase_orders' : 
                'gl_estimates';
  
  const success = await updatePDFLinkInDatabase(table, data.id, pdfUrl);
  
  return success ? pdfUrl : null;
}
