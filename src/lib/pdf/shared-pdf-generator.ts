/**
 * Shared PDF generation logic for both frontend and edge functions
 * This module contains the core PDF generation functions that can be used in both contexts
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate, formatShortDate } from './common';

// Types that match both frontend and edge function usage
export interface Account {
  id: string;
  glide_row_id?: string;
  account_name?: string;
  account_uid?: string;
  account_address?: string;
  account_city?: string;
  account_state?: string;
  account_zip?: string;
  account_email?: string;
  account_phone?: string;
}

export interface InvoiceLine {
  id: string;
  glide_row_id?: string;
  product_name_display?: string;
  renamed_product_name?: string;
  quantity?: number;
  price?: number;
  total?: number;
  product?: {
    vendor_product_name?: string;
    new_product_name?: string;
  };
}

export interface Invoice {
  id: string;
  glide_row_id?: string;
  invoice_uid?: string;
  date_of_invoicestring;
  invoice_ship_date?: string;
  status?: string;
  total_amount?: number;
  total_paid?: number;
  balance?: number;
  shipping_cost?: number;
  invoice_notes?: string;
  payment_terms?: string;
  account?: Account;
  lines?: InvoiceLine[];
  customer_payments?: Array<{
    id: string;
    payment_amount?: number;
    date_of_payment?: string;
    type_of_payment?: string;
    payment_note?: string;
  }>;
}

export interface PurchaseOrderLineItem {
  id: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  description?: string;
  productId?: string;
  product_name?: string;
  new_product_name?: string;
  vendor_product_name?: string;
  display_name?: string;
  unit_price?: number;
  notes?: string;
  samples?: boolean;
  fronted?: boolean;
  category?: string;
  total_units?: number;
}

export interface PurchaseOrder {
  id: string;
  glide_row_id?: string;
  purchase_order_uid?: string;
  po_date?: string;
  po_status?: string;
  po_notes?: string;
  shipping_cost?: number;
  total_amount?: number;
  balance?: number;
  account?: Account;
  lineItems?: PurchaseOrderLineItem[];
  vendorPayments?: Array<{
    id: string;
    amount?: number;
    date?: string;
    method?: string;
    notes?: string;
  }>;
}

export interface EstimateLine {
  id: string;
  glide_row_id?: string;
  product_name_display?: string;
  quantity?: number;
  price?: number;
  total?: number;
  product?: {
    vendor_product_name?: string;
    new_product_name?: string;
  };
}

export interface Estimate {
  id: string;
  glide_row_id?: string;
  estimate_uid?: string;
  estimate_date?: string;
  status?: string;
  is_a_sample?: boolean;
  total_amount?: number;
  balance?: number;
  estimate_notes?: string;
  account?: Account;
  lines?: EstimateLine[];
  customer_credits?: Array<{
    id: string;
    payment_amount?: number;
    date_of_payment?: string;
    payment_type?: string;
    payment_note?: string;
  }>;
}

/**
 * Generate a PDF for an invoice
 * @param invoice The invoice data with related account and line items
 * @returns jsPDF document object
 */
export function generateInvoicePDF(invoice: Invoice): jsPDF {
  const doc = new jsPDF();
  try {
    // Company letterhead
    doc.setFontSize(18);
    doc.text('INVOICE', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Your Company Name', 105, 30, { align: 'center' });
    doc.text('123 Business St, Suite 100', 105, 35, { align: 'center' });
    doc.text('Business City, ST 12345', 105, 40, { align: 'center' });
    doc.text('(555) 123-4567 | yourcompany.com', 105, 45, { align: 'center' });

    // Invoice details
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoice.invoice_uid || 'Not Assigned'}`, 20, 60);
    doc.text(`Date: ${formatDate(invoice.date_of_invoice, 20, 65);
    doc.text(`Status: ${invoice.status || 'N/A'}`, 20, 70);

    // Customer details
    if (invoice.account) {
      doc.setFontSize(12);
      doc.text('BILL TO:', 140, 60);
      doc.setFontSize(10);
      doc.text(`${invoice.account.account_name || 'Unknown Customer'}`, 140, 65);
      doc.text(`${invoice.account.account_address || ''}`, 140, 70);
      const cityStateZip = [
        invoice.account.account_city || '',
        invoice.account.account_state || '',
        invoice.account.account_zip || '',
      ].filter(Boolean).join(', ');
      doc.text(cityStateZip, 140, 75);
      doc.text(`${invoice.account.account_email || ''}`, 140, 80);
      doc.text(`${invoice.account.account_phone || ''}`, 140, 85);
    }

    // Line items
    doc.setFontSize(10);
    let startY = 100;

    const columns = [
      { header: 'Item', dataKey: 'item' },
      { header: 'Quantity', dataKey: 'quantity' },
      { header: 'Price', dataKey: 'price' },
      { header: 'Total', dataKey: 'total' }
    ];

    const rows = invoice.lines?.map(line => {
      const productName = line.product_name_display ||
                           line.renamed_product_name ||
                          (line.product ? (line.product.new_product_name || line.product.vendor_product_name) : 'Unknown Product');

      return {
        item: productName,
        quantity: line.quantity || 0,
        price: formatCurrency(line.price || 0),
        total: formatCurrency(line.total || 0)
      };
    }) || [];

    autoTable(doc, {
      startY,
      columns,
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66] },
      margin: { top: 10, right: 20, bottom: 20, left: 20 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    doc.setFontSize(10);
    doc.text('Subtotal:', 140, finalY);
    doc.text(formatCurrency(invoice.total_amount || 0), 170, finalY, { align: 'right' });

    if (invoice.shipping_cost) {
      doc.text('Shipping:', 140, finalY + 5);
      doc.text(formatCurrency(invoice.shipping_cost), 170, finalY + 5, { align: 'right' });
    }

    doc.text('Total:', 140, finalY + 10);
    doc.text(formatCurrency(invoice.total_amount || 0), 170, finalY + 10, { align: 'right' });

    doc.text('Amount Paid:', 140, finalY + 15);
    doc.text(formatCurrency(invoice.total_paid || 0), 170, finalY + 15, { align: 'right' });

    doc.setFontSize(12);
    doc.text('Balance Due:', 140, finalY + 25);
    doc.text(formatCurrency(invoice.balance || 0), 170, finalY + 25, { align: 'right' });

    // Notes
    if (invoice.invoice_notes) {
      doc.setFontSize(10);
      doc.text('Notes:', 20, finalY + 35);
      doc.setFontSize(9);

      const textLines = doc.splitTextToSize(invoice.invoice_notes, 170);
      doc.text(textLines, 20, finalY + 40);
    }

    // Payment terms
    if (invoice.payment_terms) {
      const termsY = invoice.invoice_notes ?
        finalY + 40 + (doc.splitTextToSize(invoice.invoice_notes, 170).length * 5) + 5 :
        finalY + 40;

      doc.setFontSize(10);
      doc.text('Payment Terms:', 20, termsY);
      doc.setFontSize(9);
      doc.text(invoice.payment_terms, 20, termsY + 5);
    }

    // Payment history
    if (invoice.customer_payments && invoice.customer_payments.length > 0) {
      let paymentY = finalY + 35;
      const paymentTitle = 'Payment History:';
      doc.setFontSize(10);
      doc.text(paymentTitle, 100, paymentY);
      paymentY += 5;

      // Payment table columns
      const paymentColumns = [
        { header: 'Date', dataKey: 'date' },
        { header: 'Method', dataKey: 'method' },
        { header: 'Amount', dataKey: 'amount' },
        { header: 'Note', dataKey: 'note' }
      ];

      // Payment table rows
      const paymentRows = invoice.customer_payments.map(payment => ({
        date: formatShortDate(payment.date_of_payment),
        method: payment.type_of_payment || 'N/A',
        amount: formatCurrency(payment.payment_amount || 0),
        note: payment.payment_note || ''
      }));

      autoTable(doc, {
        startY: paymentY,
        columns: paymentColumns,
        body: paymentRows,
        theme: 'striped',
        headStyles: { fillColor: [100, 100, 100] },
        margin: { top: 10, right: 20, bottom: 20, left: 100 },
        tableWidth: 90
      });
    }

    return doc;
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    // Return the document even with errors to avoid crashing
    return doc;
  }
}

/**
 * Generate a PDF for a purchase order
 * @param purchaseOrder The purchase order data with related account and line items
 * @returns jsPDF document object
 */
export function generatePurchaseOrderPDF(purchaseOrder: PurchaseOrder): jsPDF {
  const doc = new jsPDF();
  try {
    // Company letterhead
    doc.setFontSize(18);
    doc.text('PURCHASE ORDER', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Your Company Name', 105, 30, { align: 'center' });
    doc.text('123 Business St, Suite 100', 105, 35, { align: 'center' });
    doc.text('Business City, ST 12345', 105, 40, { align: 'center' });
    doc.text('(555) 123-4567 | yourcompany.com', 105, 45, { align: 'center' });

    // Purchase Order details
    doc.setFontSize(10);
    doc.text(`PO #: ${purchaseOrder.purchase_order_uid || 'Not Assigned'}`, 20, 60);
    doc.text(`Date: ${formatDate(purchaseOrder.po_date)}`, 20, 65);
    doc.text(`Status: ${purchaseOrder.po_status || 'N/A'}`, 20, 70);

    // Vendor details
    if (purchaseOrder.account) {
      doc.setFontSize(12);
      doc.text('VENDOR:', 140, 60);
      doc.setFontSize(10);
      doc.text(`${purchaseOrder.account.account_name || 'Unknown Vendor'}`, 140, 65);
      doc.text(`${purchaseOrder.account.account_address || ''}`, 140, 70);
      const cityStateZip = [
        purchaseOrder.account.account_city || '',
        purchaseOrder.account.account_state || '',
        purchaseOrder.account.account_zip || '',
      ].filter(Boolean).join(', ');
      doc.text(cityStateZip, 140, 75);
      doc.text(`${purchaseOrder.account.account_email || ''}`, 140, 80);
      doc.text(`${purchaseOrder.account.account_phone || ''}`, 140, 85);
    }

    // Line items
    doc.setFontSize(10);
    let startY = 100;

    const columns = [
      { header: 'Item', dataKey: 'item' },
      { header: 'Quantity', dataKey: 'quantity' },
      { header: 'Unit Price', dataKey: 'price' },
      { header: 'Total', dataKey: 'total' }
    ];

    const rows = purchaseOrder.lineItems?.map(item => {
      // Product name display, with fallbacks
      const productName = item.display_name ||
                          item.new_product_name ||
                          item.vendor_product_name ||
                          'Unknown Product';

      return {
        item: productName,
        quantity: item.quantity || item.total_units || 0,
        price: formatCurrency(item.unitPrice || item.unit_price || 0),
        total: formatCurrency(item.total || 0)
      };
    }) || [];

    autoTable(doc, {
      startY,
      columns,
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66] },
      margin: { top: 10, right: 20, bottom: 20, left: 20 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    doc.setFontSize(10);
    doc.text('Subtotal:', 140, finalY);
    doc.text(formatCurrency(purchaseOrder.total_amount || 0), 170, finalY, { align: 'right' });

    if (purchaseOrder.shipping_cost) {
      doc.text('Shipping:', 140, finalY + 5);
      doc.text(formatCurrency(purchaseOrder.shipping_cost), 170, finalY + 5, { align: 'right' });
    }

    doc.setFontSize(12);
    doc.text('Total:', 140, finalY + 15);
    doc.text(formatCurrency(purchaseOrder.total_amount || 0), 170, finalY + 15, { align: 'right' });

    // Balance
    doc.text('Balance:', 140, finalY + 25);
    doc.text(formatCurrency(purchaseOrder.balance || 0), 170, finalY + 25, { align: 'right' });

    // Notes
    if (purchaseOrder.po_notes) {
      doc.setFontSize(10);
      doc.text('Notes:', 20, finalY + 35);
      doc.setFontSize(9);

      const textLines = doc.splitTextToSize(purchaseOrder.po_notes, 170);
      doc.text(textLines, 20, finalY + 40);
    }

    // Payment history
    if (purchaseOrder.vendorPayments && purchaseOrder.vendorPayments.length > 0) {
      let paymentY = finalY + 35;
      const paymentTitle = 'Payment History:';
      doc.setFontSize(10);
      doc.text(paymentTitle, 100, paymentY);
      paymentY += 5;

      // Payment table columns
      const paymentColumns = [
        { header: 'Date', dataKey: 'date' },
        { header: 'Method', dataKey: 'method' },
        { header: 'Amount', dataKey: 'amount' },
        { header: 'Note', dataKey: 'note' }
      ];

      // Payment table rows
      const paymentRows = purchaseOrder.vendorPayments.map(payment => ({
        date: formatShortDate(payment.date),
        method: payment.method || 'N/A',
        amount: formatCurrency(payment.amount || 0),
        note: payment.notes || ''
      }));

      autoTable(doc, {
        startY: paymentY,
        columns: paymentColumns,
        body: paymentRows,
        theme: 'striped',
        headStyles: { fillColor: [100, 100, 100] },
        margin: { top: 10, right: 20, bottom: 20, left: 100 },
        tableWidth: 90
      });
    }

    return doc;
  } catch (error) {
    console.error('Error generating purchase order PDF:', error);
    // Return the document even with errors to avoid crashing
    return doc;
  }
}

/**
 * Generate a PDF for an estimate
 * @param estimate The estimate data with related account and line items
 * @returns jsPDF document object
 */
export function generateEstimatePDF(estimate: Estimate): jsPDF {
  const doc = new jsPDF();
  try {
    // Company letterhead
    doc.setFontSize(18);
    doc.text(estimate.is_a_sample ? 'SAMPLE' : 'ESTIMATE', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Your Company Name', 105, 30, { align: 'center' });
    doc.text('123 Business St, Suite 100', 105, 35, { align: 'center' });
    doc.text('Business City, ST 12345', 105, 40, { align: 'center' });
    doc.text('(555) 123-4567 | yourcompany.com', 105, 45, { align: 'center' });

    // Estimate details
    doc.setFontSize(10);
    doc.text(`Estimate #: ${estimate.estimate_uid || 'Not Assigned'}`, 20, 60);
    doc.text(`Date: ${formatDate(estimate.estimate_date)}`, 20, 65);
    doc.text(`Status: ${estimate.status || 'N/A'}`, 20, 70);

    // Customer details
    if (estimate.account) {
      doc.setFontSize(12);
      doc.text('CUSTOMER:', 140, 60);
      doc.setFontSize(10);
      doc.text(`${estimate.account.account_name || 'Unknown Customer'}`, 140, 65);
      doc.text(`${estimate.account.account_address || ''}`, 140, 70);
      const cityStateZip = [
        estimate.account.account_city || '',
        estimate.account.account_state || '',
        estimate.account.account_zip || '',
      ].filter(Boolean).join(', ');
      doc.text(cityStateZip, 140, 75);
      doc.text(`${estimate.account.account_email || ''}`, 140, 80);
      doc.text(`${estimate.account.account_phone || ''}`, 140, 85);
    }

    // Line items
    doc.setFontSize(10);
    let startY = 100;

    const columns = [
      { header: 'Item', dataKey: 'item' },
      { header: 'Quantity', dataKey: 'quantity' },
      { header: 'Price', dataKey: 'price' },
      { header: 'Total', dataKey: 'total' }
    ];

    const rows = estimate.lines?.map(line => {
      const productName = line.product_name_display ||
                         (line.product ? (line.product.new_product_name || line.product.vendor_product_name) : 'Unknown Product');

      return {
        item: productName,
        quantity: line.quantity || 0,
        price: formatCurrency(line.price || 0),
        total: formatCurrency(line.total || 0)
      };
    }) || [];

    autoTable(doc, {
      startY,
      columns,
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [66, 66, 66] },
      margin: { top: 10, right: 20, bottom: 20, left: 20 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    doc.setFontSize(12);
    doc.text('Total Estimate:', 140, finalY);
    doc.text(formatCurrency(estimate.total_amount || 0), 170, finalY, { align: 'right' });

    // Credits/Deposits
    if (estimate.customer_credits && estimate.customer_credits.length > 0) {
      const totalCredits = estimate.customer_credits.reduce((total, credit) => total + (credit.payment_amount || 0), 0);
      if (totalCredits > 0) {
        doc.text('Deposits Received:', 140, finalY + 10);
        doc.text(formatCurrency(totalCredits), 170, finalY + 10, { align: 'right' });
      }
    }

    // Balance
    doc.text('Balance Due:', 140, finalY + 20);
    doc.text(formatCurrency(estimate.balance || 0), 170, finalY + 20, { align: 'right' });

    // Notes
    if (estimate.estimate_notes) {
      doc.setFontSize(10);
      doc.text('Notes:', 20, finalY + 35);
      doc.setFontSize(9);

      const textLines = doc.splitTextToSize(estimate.estimate_notes, 170);
      doc.text(textLines, 20, finalY + 40);
    }

    // Add sample watermark if needed
    if (estimate.is_a_sample) {
      doc.setTextColor(200, 50, 50);
      doc.setFontSize(60);
      doc.text('SAMPLE', 105, 150, {
        align: 'center',
        angle: 45
      });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
    }

    // Payment/credit history
    if (estimate.customer_credits && estimate.customer_credits.length > 0) {
      let paymentY = finalY + 35;
      const paymentTitle = 'Deposits/Credits:';
      doc.setFontSize(10);
      doc.text(paymentTitle, 100, paymentY);
      paymentY += 5;

      // Payment table columns
      const paymentColumns = [
        { header: 'Date', dataKey: 'date' },
        { header: 'Method', dataKey: 'method' },
        { header: 'Amount', dataKey: 'amount' },
        { header: 'Note', dataKey: 'note' }
      ];

      // Payment table rows
      const paymentRows = estimate.customer_credits.map(credit => ({
        date: formatShortDate(credit.date_of_payment),
        method: credit.payment_type || 'N/A',
        amount: formatCurrency(credit.payment_amount || 0),
        note: credit.payment_note || ''
      }));

      autoTable(doc, {
        startY: paymentY,
        columns: paymentColumns,
        body: paymentRows,
        theme: 'striped',
        headStyles: { fillColor: [100, 100, 100] },
        margin: { top: 10, right: 20, bottom: 20, left: 100 },
        tableWidth: 90
      });
    }

    return doc;
  } catch (error) {
    console.error('Error generating estimate PDF:', error);
    // Return the document even with errors to avoid crashing
    return doc;
  }
}

/**
 * Generate the PDF document based on document type
 * @param documentType Type of document ('invoice', 'purchaseOrder', or 'estimate')
 * @param data Document data
 * @returns jsPDF document object or null if generation fails
 */
export function generatePDF(
  documentType: 'invoice' | 'purchaseOrder' | 'estimate',
  data: Invoice | PurchaseOrder | Estimate
): jsPDF | null {
  try {
    switch (documentType) {
      case 'invoice':
        return generateInvoicePDF(data as Invoice);
      case 'purchaseOrder':
        return generatePurchaseOrderPDF(data as PurchaseOrder);
      case 'estimate':
        return generateEstimatePDF(data as Estimate);
      default:
        console.error(`Unsupported document type: ${documentType}`);
        return null;
    }
  } catch (error) {
    console.error(`Error generating ${documentType} PDF:`, error);
    return null;
  }
}

/**
 * Generate a filename for a PDF document
 * @param documentType Type of document ('invoice', 'purchaseOrder', or 'estimate')
 * @param data Document data
 * @returns Filename string
 */
export function generateFilename(
  documentType: 'invoice' | 'purchaseOrder' | 'estimate',
  data: Invoice | PurchaseOrder | Estimate
): string {
  try {
    // Get the document UID based on document type
    let documentUid = null;
    let fallbackPrefix = 'DOC#';

    switch (documentType) {
      case 'invoice':
        documentUid = (data as Invoice).invoice_uid;
        fallbackPrefix = 'INV#';
        break;
      case 'purchaseOrder':
        documentUid = (data as PurchaseOrder).purchase_order_uid;
        fallbackPrefix = 'PO#';
        break;
      case 'estimate':
        documentUid = (data as Estimate).estimate_uid;
        fallbackPrefix = (data as Estimate).is_a_sample === true ? 'SMP#' : 'EST#';
        break;
    }

    // If we have a valid document UID, use it directly
    if (documentUid) {
      return `${documentUid}.pdf`;
    }

    // For documents without UIDs, use a fallback approach
    console.warn(`No document UID found for ${documentType}, using fallback ID`);

    // Use the document ID or glide_row_id as fallback
    const fallbackId = data?.id || data?.glide_row_id || 'UNKNOWNID';
    return `${fallbackPrefix}${fallbackId}.pdf`;
  } catch (error) {
    console.error('Error generating filename:', error);
    // Final desperate fallback
    const fallbackId = data?.id || data?.glide_row_id || Date.now();
    return `${documentType.toLowerCase()}-${fallbackId}.pdf`;
  }
}
