import jsPDF from 'jspdf';
import { Database } from '@/integrations/supabase/types';
import { useInvoiceDetail } from '@/hooks/invoices/useInvoiceDetail';
import { supabase } from '@/integrations/supabase/client';
import { 
  formatCurrency, 
  formatShortDate, 
  createTableStyles, 
  addLetterhead,
  addAccountDetails,
  generateFilename,
  PDFErrorType,
  PDFOperationResult,
  createPDFError,
  createPDFSuccess
} from './common';
import { storePDF } from '../pdf-storage';
import { saveAs } from 'file-saver'; // Import file-saver library

// Type definitions
export type Invoice = Database['public']['Tables']['gl_invoices']['Row'];
export type InvoiceLine = Database['public']['Tables']['gl_invoice_lines']['Row'] & {
  product?: {
    display_name: string;
    id: string;
    glide_row_id: string;
  };
};

export interface InvoiceWithDetails extends Invoice {
  lines: InvoiceLine[];
  account?: Database['public']['Tables']['gl_accounts']['Row'];
}

/**
 * Fetch invoice data with all related information needed for PDF generation
 * 
 * @param invoiceId - The ID of the invoice to fetch
 * @returns Promise resolving to the invoice with all details or null if not found
 * 
 * @example
 * const invoiceData = await fetchInvoiceForPDF('123e4567-e89b-12d3-a456-426614174000');
 * if (invoiceData) {
 *   const pdf = generateInvoicePDF(invoiceData);
 * }
 */
export async function fetchInvoiceForPDF(invoiceId: string): Promise<InvoiceWithDetails | null> {
  try {
    console.log(`Fetching invoice data for PDF generation: ${invoiceId}`);
    
    // Try to fetch invoice by id first
    let { data: invoiceData, error: invoiceError } = await supabase
      .from('gl_invoices')
      .select('*')
      .eq('id', invoiceId)
      .maybeSingle();

    // If not found by id, try by glide_row_id
    if (!invoiceData) {
      const { data, error } = await supabase
        .from('gl_invoices')
        .select('*')
        .eq('glide_row_id', invoiceId)
        .maybeSingle();
      
      invoiceData = data;
      invoiceError = error;
    }

    if (invoiceError) {
      console.error('Error fetching invoice:', invoiceError);
      return null;
    }
    
    if (!invoiceData) {
      console.error(`Invoice not found with ID: ${invoiceId}`);
      return null;
    }

    // Initialize invoice with empty lines array
    const invoiceWithDetails: InvoiceWithDetails = {
      ...invoiceData,
      total_amount: Number(invoiceData.total_amount) || 0,
      total_paid: Number(invoiceData.total_paid) || 0,
      balance: Number(invoiceData.balance) || 0,
      tax_rate: Number(invoiceData.tax_rate) || 0,
      tax_amount: Number(invoiceData.tax_amount) || 0,
      lines: []
    };

    // Fetch all products to get their display_name
    const { data: productsData, error: productsError } = await supabase
      .from('gl_products')
      .select('*');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      // Continue without product data
    }

    // Create lookup map for products by glide_row_id
    const productsMap = new Map();
    if (productsData) {
      productsData.forEach((product: any) => {
        productsMap.set(product.glide_row_id, {
          display_name: product.vendor_product_name || product.main_new_product_name || product.main_vendor_product_name || 'Unknown Product',
          id: product.id,
          glide_row_id: product.glide_row_id
        });
      });
    }

    // Fetch invoice line items using glide_row_id relationship
    const { data: linesData, error: linesError } = await supabase
      .from('gl_invoice_lines')
      .select('*')
      .eq('rowid_invoices', invoiceData.glide_row_id);

    if (linesError) {
      console.error('Error fetching invoice lines:', linesError);
      // We'll still proceed with the invoice, just without line items
    } else if (linesData && linesData.length > 0) {
      // Transform and add line items to the invoice
      invoiceWithDetails.lines = linesData.map((line: any) => {
        // Get product data if available
        const product = line.rowid_products ? productsMap.get(line.rowid_products) : null;
        
        return {
          ...line,
          qty_sold: Number(line.qty_sold) || 0,
          selling_price: Number(line.selling_price) || 0,
          line_total: Number(line.line_total) || 0,
          product
        };
      });
    }

    // Fetch account information if rowid_accounts is available
    if (invoiceData.rowid_accounts) {
      const { data: accountData, error: accountError } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('glide_row_id', invoiceData.rowid_accounts)
        .single();

      if (accountError) {
        console.error('Error fetching account:', accountError);
        // We'll still proceed with the invoice, just without account info
      } else if (accountData) {
        // Add account info to the invoice
        invoiceWithDetails.account = accountData;
      }
    }

    return invoiceWithDetails;
  } catch (error) {
    console.error('Exception fetching invoice data for PDF:', error);
    return null;
  }
}

/**
 * Generate a PDF for an invoice
 * 
 * @param invoice - The invoice data with related account and line items
 * @returns jsPDF document object
 * 
 * @example
 * const invoice = await fetchInvoiceForPDF('123');
 * if (invoice) {
 *   const pdfDoc = generateInvoicePDF(invoice);
 *   pdfDoc.save('invoice.pdf');
 * }
 */
export function generateInvoicePDF(invoice: InvoiceWithDetails): jsPDF {
  const doc = new jsPDF();
  
  // Add letterhead
  addLetterhead(doc, 'INVOICE');
  
  // Add invoice details
  doc.setFontSize(12);
  doc.text(`Invoice #: ${invoice.invoice_uid || 'N/A'}`, 20, 45);
  doc.text(`Date: ${formatShortDate(invoice.invoice_order_date)}`, 150, 45, { align: 'right' });
  
  // Add customer details
  addAccountDetails(doc, 'Bill To:', invoice.account, 60);
  
  // Define the table styles
  const tableStyles = createTableStyles();
  
  // Map invoice products to table rows
  const rows = invoice.lines?.map(line => [
    line.renamed_product_name || (line.product?.display_name || 'N/A'),
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
  doc.text(`Balance Due:`, 150, currentY, { align: 'right' });
  doc.text(formatCurrency(invoice.balance || 0), 190, currentY, { align: 'right' });
  
  // Add notes if available
  if (invoice.invoice_notes) {
    currentY += 20;
    doc.setFontSize(11);
    doc.text('Notes:', 20, currentY);
    currentY += 10;
    doc.setFontSize(10);
    
    // Split notes into multiple lines if needed
    const splitNotes = doc.splitTextToSize(invoice.invoice_notes, 170);
    doc.text(splitNotes, 20, currentY);
  }
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
  }
  
  return doc;
}

/**
 * Generate and store an invoice PDF
 * 
 * @param invoiceId - The ID of the invoice
 * @param download - Whether to download the PDF after generation
 * @returns Promise resolving to the operation result
 * 
 * @example
 * const result = await generateAndStoreInvoicePDF('123', true);
 * if (result.success) {
 *   console.log('PDF URL:', result.url);
 * } else {
 *   console.error('Error:', result.error?.message);
 * }
 */
export async function generateAndStoreInvoicePDF(
  invoiceId: string | any,
  download: boolean = false
): Promise<PDFOperationResult> {
  try {
    // Ensure invoiceId is a string
    const id = typeof invoiceId === 'object' 
      ? (invoiceId.id || invoiceId.glide_row_id || JSON.stringify(invoiceId)) 
      : invoiceId;
    
    console.log(`Generating PDF for invoice with ID: ${id}`);
    
    // Fetch invoice data
    const invoice = await fetchInvoiceForPDF(id);
    
    if (!invoice) {
      return createPDFError(
        PDFErrorType.FETCH_ERROR,
        `Failed to fetch invoice with ID: ${id}`
      );
    }
    
    // Generate PDF
    const pdfDoc = generateInvoicePDF(invoice);
    
    // Convert to blob
    const pdfBlob = await new Promise<Blob>((resolve) => {
      const blob = pdfDoc.output('blob');
      resolve(blob);
    });
    
    // Generate filename
    const filename = generateFilename(
      'Invoice',
      invoice.invoice_uid?.replace(/^INV#/, '') || invoice.id,
      invoice.invoice_order_date || new Date()
    );
    
    // Store PDF using edge function
    const storageResult = await storePDF(pdfBlob, 'invoice', invoice.id, filename);
    
    if (!storageResult.success) {
      return createPDFError(
        PDFErrorType.STORAGE_ERROR,
        `Failed to store invoice PDF: ${storageResult.message}`
      );
    }
    
    // If download is requested and we have a URL, trigger download
    if (download && storageResult.url) {
      try {
        // Use file-saver library instead of creating a temporary link
        const response = await fetch(storageResult.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        saveAs(blob, filename);
        console.log(`PDF downloaded successfully: ${filename}`);
      } catch (downloadError) {
        console.error('Error handling invoice PDF download:', downloadError);
        // Continue even if download fails
      }
    }
    
    return createPDFSuccess(storageResult.url!);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return createPDFError(
      PDFErrorType.GENERATION_ERROR,
      error instanceof Error ? error.message : 'Unknown error generating invoice PDF'
    );
  }
}
