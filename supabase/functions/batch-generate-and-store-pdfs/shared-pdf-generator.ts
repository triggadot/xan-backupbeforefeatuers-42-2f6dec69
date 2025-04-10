/**
 * Shared PDF generation logic for Supabase edge functions
 * This is a direct adaptation of the frontend shared-pdf-generator.ts
 * with minimal changes to work in the Deno environment
 * 
 * IMPORTANT: This file contains duplicated code from the frontend's shared-pdf-generator.ts
 * Any changes to PDF generation logic should be synchronized between both files
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate, formatShortDate } from './common';
import {
  Invoice,
  InvoiceLine,
  PurchaseOrder,
  PurchaseOrderLineItem,
  Estimate,
  EstimateLine
} from './common';

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
    doc.text(`Date: ${formatDate(invoice.invoice_order_date)}`, 20, 65);
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
      head: [columns.map(col => col.header)],
      body: rows.map(row => [
        row.item,
        row.quantity,
        row.price,
        row.total
      ]),
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });

    // Summary and totals
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    // Shipping
    if (invoice.shipping_cost) {
      doc.text('Shipping:', 140, finalY + 10);
      doc.text(formatCurrency(invoice.shipping_cost), 180, finalY + 10, { align: 'right' });
    }
    
    // Total
    doc.setFontSize(12);
    doc.text('Total:', 140, finalY + 20);
    doc.text(formatCurrency(invoice.total_amount), 180, finalY + 20, { align: 'right' });
    
    // Paid
    doc.setFontSize(10);
    doc.text('Paid:', 140, finalY + 30);
    doc.text(formatCurrency(invoice.total_paid), 180, finalY + 30, { align: 'right' });
    
    // Balance
    doc.setFontSize(12);
    doc.text('Balance Due:', 140, finalY + 40);
    doc.text(formatCurrency(invoice.balance), 180, finalY + 40, { align: 'right' });
    
    // Payment details
    if (invoice.customer_payments && invoice.customer_payments.length > 0) {
      startY = finalY + 50;
      doc.setFontSize(12);
      doc.text('Payment History', 20, startY);
      doc.setFontSize(10);
      
      autoTable(doc, {
        startY: startY + 5,
        head: [['Date', 'Method', 'Amount', 'Notes']],
        body: invoice.customer_payments.map(payment => [
          formatDate(payment.date_of_payment),
          payment.type_of_payment || 'N/A',
          formatCurrency(payment.payment_amount),
          payment.payment_note || ''
        ]),
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 75 }
        },
        margin: { left: 20, right: 20 }
      });
    }
    
    // Notes
    if (invoice.invoice_notes) {
      const notesY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : finalY + 50;
      doc.setFontSize(12);
      doc.text('Notes', 20, notesY);
      doc.setFontSize(10);
      doc.text(invoice.invoice_notes || '', 20, notesY + 10);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount} - Invoice #${invoice.invoice_uid || 'N/A'}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    return doc;
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    // Even in case of error, return the doc with what we've got so far
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
      { header: 'Price', dataKey: 'price' },
      { header: 'Total', dataKey: 'total' }
    ];

    const rows = purchaseOrder.lineItems?.map(line => {
      const productName = line.display_name || line.new_product_name || line.vendor_product_name || 'Unknown Product';
      
      return {
        item: productName,
        quantity: line.quantity || line.total_units || 0,
        price: formatCurrency(line.unitPrice || line.unit_price || 0),
        total: formatCurrency(line.total || ((line.quantity || line.total_units || 0) * (line.unitPrice || line.unit_price || 0)))
      };
    }) || [];

    autoTable(doc, {
      startY,
      head: [columns.map(col => col.header)],
      body: rows.map(row => [
        row.item,
        row.quantity,
        row.price,
        row.total
      ]),
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });

    // Summary and totals
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    // Shipping
    if (purchaseOrder.shipping_cost) {
      doc.text('Shipping:', 140, finalY + 10);
      doc.text(formatCurrency(purchaseOrder.shipping_cost), 180, finalY + 10, { align: 'right' });
    }
    
    // Total
    doc.setFontSize(12);
    doc.text('Total:', 140, finalY + 20);
    doc.text(formatCurrency(purchaseOrder.total_amount), 180, finalY + 20, { align: 'right' });
    
    // Paid
    const totalPaid = purchaseOrder.vendorPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    doc.setFontSize(10);
    doc.text('Paid:', 140, finalY + 30);
    doc.text(formatCurrency(totalPaid), 180, finalY + 30, { align: 'right' });
    
    // Balance
    doc.setFontSize(12);
    doc.text('Balance Due:', 140, finalY + 40);
    doc.text(formatCurrency(purchaseOrder.balance || (purchaseOrder.total_amount || 0) - totalPaid), 180, finalY + 40, { align: 'right' });
    
    // Payment details
    if (purchaseOrder.vendorPayments && purchaseOrder.vendorPayments.length > 0) {
      startY = finalY + 50;
      doc.setFontSize(12);
      doc.text('Payment History', 20, startY);
      doc.setFontSize(10);
      
      autoTable(doc, {
        startY: startY + 5,
        head: [['Date', 'Method', 'Amount', 'Notes']],
        body: purchaseOrder.vendorPayments.map(payment => [
          formatDate(payment.date),
          payment.method || 'N/A',
          formatCurrency(payment.amount),
          payment.notes || ''
        ]),
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 75 }
        },
        margin: { left: 20, right: 20 }
      });
    }
    
    // Notes
    if (purchaseOrder.po_notes) {
      const notesY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : finalY + 50;
      doc.setFontSize(12);
      doc.text('Notes', 20, notesY);
      doc.setFontSize(10);
      doc.text(purchaseOrder.po_notes || '', 20, notesY + 10);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount} - PO #${purchaseOrder.purchase_order_uid || 'N/A'}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    return doc;
  } catch (error) {
    console.error('Error generating purchase order PDF:', error);
    // Even in case of error, return the doc with what we've got so far
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
    // Determine if this is a sample
    const documentTitle = estimate.is_a_sample === true ? 'SAMPLE' : 'ESTIMATE';
    
    // Company letterhead
    doc.setFontSize(18);
    doc.text(documentTitle, 105, 20, { align: 'center' });
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
      head: [columns.map(col => col.header)],
      body: rows.map(row => [
        row.item,
        row.quantity,
        row.price,
        row.total
      ]),
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
    });

    // Summary and totals
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    // Total
    doc.setFontSize(12);
    doc.text('Total:', 140, finalY + 20);
    doc.text(formatCurrency(estimate.total_amount), 180, finalY + 20, { align: 'right' });
    
    // Credits
    const totalCredits = estimate.customer_credits?.reduce((sum, credit) => sum + (credit.payment_amount || 0), 0) || 0;
    if (totalCredits > 0) {
      doc.setFontSize(10);
      doc.text('Credits:', 140, finalY + 30);
      doc.text(formatCurrency(totalCredits), 180, finalY + 30, { align: 'right' });
      
      // Balance
      doc.setFontSize(12);
      doc.text('Balance:', 140, finalY + 40);
      doc.text(formatCurrency(estimate.balance || (estimate.total_amount || 0) - totalCredits), 180, finalY + 40, { align: 'right' });
    }
    
    // Credits details
    if (estimate.customer_credits && estimate.customer_credits.length > 0) {
      startY = finalY + 50;
      doc.setFontSize(12);
      doc.text('Credit History', 20, startY);
      doc.setFontSize(10);
      
      autoTable(doc, {
        startY: startY + 5,
        head: [['Date', 'Type', 'Amount', 'Notes']],
        body: estimate.customer_credits.map(credit => [
          formatDate(credit.date_of_payment),
          credit.payment_type || 'N/A',
          formatCurrency(credit.payment_amount),
          credit.payment_note || ''
        ]),
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0] },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 75 }
        },
        margin: { left: 20, right: 20 }
      });
    }
    
    // Notes
    if (estimate.estimate_notes) {
      const notesY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : finalY + 50;
      doc.setFontSize(12);
      doc.text('Notes', 20, notesY);
      doc.setFontSize(10);
      doc.text(estimate.estimate_notes || '', 20, notesY + 10);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount} - ${documentTitle} #${estimate.estimate_uid || 'N/A'}`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    return doc;
  } catch (error) {
    console.error('Error generating estimate PDF:', error);
    // Even in case of error, return the doc with what we've got so far
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
    console.error(`Error generating PDF for ${documentType}:`, error);
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
    let prefix = 'DOC';
    let uid = '';
    
    switch (documentType) {
      case 'invoice':
        prefix = 'INV';
        uid = (data as Invoice).invoice_uid || '';
        break;
      case 'purchaseOrder':
        prefix = 'PO';
        uid = (data as PurchaseOrder).purchase_order_uid || '';
        break;
      case 'estimate':
        const estimate = data as Estimate;
        prefix = estimate.is_a_sample === true ? 'SMP' : 'EST';
        uid = estimate.estimate_uid || '';
        break;
    }
    
    // If we have a UID, use it
    if (uid) {
      return `${uid}.pdf`;
    }
    
    // Otherwise use a fallback name with the ID
    return `${prefix}-${data.id}.pdf`;
  } catch (error) {
    console.error('Error generating filename:', error);
    return `document-${Date.now()}.pdf`;
  }
}

/**
 * Converts a jsPDF document to a Uint8Array for storage
 * @param doc jsPDF document object
 * @returns Uint8Array containing the PDF data
 */
export function pdfToUint8Array(doc: jsPDF): Uint8Array {
  try {
    const base64 = doc.output('datauristring').split(',')[1];
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    
    return array;
  } catch (error) {
    console.error('Error converting PDF to Uint8Array:', error);
    throw error;
  }
}
