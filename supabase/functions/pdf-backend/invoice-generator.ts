/**
 * Invoice PDF generator module using pdf-lib
 *
 * This module matches the exact layout, positioning, and styling of the frontend jsPDF implementation
 * to ensure visual consistency in invoice PDFs generated server-side
 */
import { PDFDocument, rgb, StandardFonts, PageSizes, TextAlignment } from 'pdf-lib';
import { Invoice } from './types.ts';
import {
  formatCurrency,
  formatShortDate,
  formatDate,
  safeGetString,
  safeGetNumber,
  safeGetBoolean
} from './utils.ts';
import {
  drawText,
  addLetterhead,
  addAccountDetails,
  drawLine,
  drawTable
} from './pdf-generator.ts';

/**
 * Generate an invoice PDF document
 *
 * @param {Invoice} invoice - Invoice data for generating the PDF
 * @returns {Promise<PDFDocument | null>} Generated PDF document or null if generation fails
 */
export async function generateInvoicePDF(invoice: Invoice): Promise<PDFDocument | null> {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Add a page (A4 size matches the frontend implementation)
    const page = pdfDoc.addPage(PageSizes.A4);

    // Load standard fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Extract company and customer info
    const companyName = "Your Company"; // Default if not provided
    const companyInfo = "123 Company St, City, State 12345\nPhone: (123) 456-7890\nEmail: info@yourcompany.com";

    // Extract customer info
    const customer = invoice.account || {};
    const customerName = customer.account_name || 'N/A';
    const customerInfo = [
      customer.account_address,
      customer.account_city && customer.account_state ?
        `${customer.account_city}, ${customer.account_state} ${customer.account_zip || ''}` :
        customer.account_city || customer.account_state || '',
      customer.account_phone,
      customer.account_email
    ].filter(Boolean).join('\n');

    // 1. Add invoice title
    await drawText(
      page,
      'INVOICE',
      page.getWidth() / 2,
      20,
      18,
      boldFont,
      TextAlignment.Center
    );

    // 2. Add company letterhead
    await addLetterhead(page, font, companyName, companyInfo);

    // 3. Add customer billing details (right side)
    await addAccountDetails(
      page,
      font,
      'Bill To:',
      customerName,
      customerInfo,
      140, // X position matches frontend jsPDF implementation
      60    // Y position matches frontend jsPDF implementation
    );

    // 4. Add invoice details (left side)
    const invoiceUid = safeGetString(invoice, 'invoice_uid', 'N/A');
    const orderDate = formatShortDate(invoice.date_of_invoice
    const shipDate = formatShortDate(invoice.invoice_ship_date);
    const status = safeGetString(invoice, 'status', 'N/A');

    await drawText(page, 'Invoice #:', 20, 60, 10, font);
    await drawText(page, invoiceUid, 70, 60, 10, font);

    await drawText(page, 'Date:', 20, 70, 10, font);
    await drawText(page, orderDate, 70, 70, 10, font);

    await drawText(page, 'Ship Date:', 20, 80, 10, font);
    await drawText(page, shipDate, 70, 80, 10, font);

    await drawText(page, 'Status:', 20, 90, 10, font);
    await drawText(page, status, 70, 90, 10, font);

    // 5. Draw line items table
    const columns = [
      { header: 'Item', width: 180 },
      { header: 'Quantity', width: 60 },
      { header: 'Price', width: 60 },
      { header: 'Total', width: 60 }
    ];

    const rows = (invoice.lines || []).map(line => [
      line.product_name_display || line.renamed_product_name || 'N/A',
      String(line.quantity || 0),
      formatCurrency(line.price || 0),
      formatCurrency(line.total || 0)
    ]);

    let finalY = 100; // Starting Y position for table

    if (rows.length > 0) {
      finalY = await drawTable(page, font, columns, rows, 20, finalY);
    } else {
      // Draw empty table with just headers
      finalY = await drawTable(page, font, columns, [], 20, finalY);
      finalY += 20; // Add some space for empty message
      await drawText(
        page,
        'No items found for this invoice',
        page.getWidth() / 2,
        finalY,
        10,
        font,
        TextAlignment.Center,
        rgb(0.5, 0.5, 0.5)
      );
      finalY += 30;
    }

    finalY += 20; // Add some space after table

    // 6. Draw totals section
    const shippingCost = safeGetNumber(invoice, 'shipping_cost', 0);
    const totalAmount = safeGetNumber(invoice, 'total_amount', 0);
    const totalPaid = safeGetNumber(invoice, 'total_paid', 0);
    const balance = safeGetNumber(invoice, 'balance', 0);

    // If shipping cost is present, show it
    if (shippingCost > 0) {
      await drawText(page, 'Shipping:', 140, finalY, 10, font);
      await drawText(page, formatCurrency(shippingCost), 190, finalY, 10, font, TextAlignment.Right);
      finalY += 10;
    }

    // Total
    await drawText(page, 'Total Invoice:', 140, finalY, 10, boldFont);
    await drawText(page, formatCurrency(totalAmount), 190, finalY, 10, boldFont, TextAlignment.Right);
    finalY += 10;

    // Paid
    await drawText(page, 'Total Paid:', 140, finalY, 10, font);
    await drawText(page, formatCurrency(totalPaid), 190, finalY, 10, font, TextAlignment.Right);
    finalY += 10;

    // Balance
    await drawText(page, 'Balance Due:', 140, finalY, 12, boldFont);
    await drawText(page, formatCurrency(balance), 190, finalY, 12, boldFont, TextAlignment.Right);
    finalY += 20;

    // 7. Add notes section
    if (invoice.invoice_notes) {
      await drawText(page, 'Notes:', 20, finalY, 10, boldFont);
      finalY += 10;

      // Split notes into multiple lines
      const notes = String(invoice.invoice_notes);
      const noteLines = notes.split('\n');

      for (const line of noteLines) {
        await drawText(page, line, 20, finalY, 9, font);
        finalY += 12;
      }
    }

    // 8. Add payment history if available
    if (invoice.customer_payments && invoice.customer_payments.length > 0) {
      finalY += 20;
      await drawText(page, 'Payment History:', 100, finalY, 10, boldFont, TextAlignment.Left);
      finalY += 10;

      const paymentColumns = [
        { header: 'Date', width: 60 },
        { header: 'Method', width: 60 },
        { header: 'Amount', width: 60 },
        { header: 'Note', width: 90 }
      ];

      const paymentRows = invoice.customer_payments.map(payment => [
        formatShortDate(payment.date_of_payment),
        payment.type_of_payment || 'N/A',
        formatCurrency(payment.payment_amount || 0),
        payment.payment_note || ''
      ]);

      await drawTable(page, font, paymentColumns, paymentRows, 100, finalY);
    }

    // 9. Add payment terms if available
    if (invoice.payment_terms) {
      finalY += 30;
      await drawText(page, 'Payment Terms:', 20, finalY, 10, boldFont);
      await drawText(page, String(invoice.payment_terms), 100, finalY, 10, font);
    }

    // 10. Add footer with page number
    const pageCount = pdfDoc.getPageCount();
    await drawText(
      page,
      `Page 1 of ${pageCount}`,
      page.getWidth() / 2,
      page.getHeight() - 20,
      8,
      font,
      TextAlignment.Center,
      rgb(0.5, 0.5, 0.5)
    );

    return pdfDoc;
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return null;
  }
}
