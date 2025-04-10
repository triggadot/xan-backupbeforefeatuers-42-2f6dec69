/**
 * Purchase Order PDF generator module using pdf-lib
 * 
 * This module matches the exact layout, positioning, and styling of the frontend jsPDF implementation
 * to ensure visual consistency in purchase order PDFs generated server-side
 */
import { PDFDocument, rgb, StandardFonts, PageSizes, TextAlignment } from 'pdf-lib';
import { PurchaseOrder } from './types.ts';
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
 * Generate a purchase order PDF document
 * 
 * @param {PurchaseOrder} purchaseOrder - Purchase order data for generating the PDF
 * @returns {Promise<PDFDocument | null>} Generated PDF document or null if generation fails
 */
export async function generatePurchaseOrderPDF(purchaseOrder: PurchaseOrder): Promise<PDFDocument | null> {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a page (A4 size matches the frontend implementation)
    const page = pdfDoc.addPage(PageSizes.A4);
    
    // Load standard fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Extract company and vendor info
    const companyName = "Your Company"; // Default if not provided
    const companyInfo = "123 Company St, City, State 12345\nPhone: (123) 456-7890\nEmail: info@yourcompany.com";
    
    // Extract vendor info
    const vendor = purchaseOrder.account || {};
    const vendorName = vendor.account_name || 'N/A';
    const vendorInfo = [
      vendor.account_address,
      vendor.account_city && vendor.account_state ? 
        `${vendor.account_city}, ${vendor.account_state} ${vendor.account_zip || ''}` : 
        vendor.account_city || vendor.account_state || '',
      vendor.account_phone,
      vendor.account_email
    ].filter(Boolean).join('\n');
    
    // 1. Add purchase order title
    await drawText(
      page,
      'PURCHASE ORDER',
      page.getWidth() / 2,
      20,
      18,
      boldFont,
      TextAlignment.Center
    );
    
    // 2. Add company letterhead
    await addLetterhead(page, font, companyName, companyInfo);
    
    // 3. Add vendor details (right side)
    await addAccountDetails(
      page,
      font,
      'Vendor:',
      vendorName,
      vendorInfo,
      140, // X position matches frontend jsPDF implementation
      60    // Y position matches frontend jsPDF implementation
    );
    
    // 4. Add purchase order details (left side)
    const poUid = safeGetString(purchaseOrder, 'purchase_order_uid', 'N/A');
    const poDate = formatShortDate(purchaseOrder.po_date);
    const status = safeGetString(purchaseOrder, 'po_status', 'N/A');
    
    await drawText(page, 'PO #:', 20, 60, 10, font);
    await drawText(page, poUid, 70, 60, 10, font);
    
    await drawText(page, 'Date:', 20, 70, 10, font);
    await drawText(page, poDate, 70, 70, 10, font);
    
    await drawText(page, 'Status:', 20, 80, 10, font);
    await drawText(page, status, 70, 80, 10, font);
    
    // 5. Draw line items table
    // Use navy blue for table headers to match the image example
    const headerColor = rgb(0.05, 0.2, 0.4); // Dark navy blue
    
    const columns = [
      { header: 'Product', width: 180 },
      { header: 'Qty', width: 60 },
      { header: 'Price', width: 60 },
      { header: 'Total', width: 60 }
    ];
    
    const rows = (purchaseOrder.lineItems || []).map(item => [
      item.display_name || item.product_name || item.vendor_product_name || 'N/A',
      String(item.quantity || 0),
      formatCurrency(item.unit_price || 0),
      formatCurrency(item.total || 0)
    ]);
    
    // Add a blue horizontal line similar to the example image
    drawLine(page, 20, 95, page.getWidth() - 20, 95, rgb(0.05, 0.2, 0.4), 2);
    
    let finalY = 100; // Starting Y position for table
    
    if (rows.length > 0) {
      // Draw table header background
      page.drawRectangle({
        x: 20,
        y: page.getHeight() - finalY,
        width: page.getWidth() - 40,
        height: 20,
        color: headerColor
      });
      
      // Draw table headers with white text
      let currentX = 20;
      for (const column of columns) {
        await drawText(
          page,
          column.header,
          currentX + column.width / 2,
          finalY + 10,
          10,
          boldFont,
          TextAlignment.Center,
          rgb(1, 1, 1) // White text for header
        );
        currentX += column.width;
      }
      
      finalY += 20;
      
      // Draw table rows
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowY = finalY + (i * 20);
        
        // Draw alternating row background
        if (i % 2 === 1) {
          page.drawRectangle({
            x: 20,
            y: page.getHeight() - rowY,
            width: page.getWidth() - 40,
            height: 20,
            color: rgb(0.95, 0.95, 0.95) // Light gray for alternating rows
          });
        }
        
        // Draw cell values
        currentX = 20;
        for (let j = 0; j < columns.length; j++) {
          const column = columns[j];
          const value = row[j] || '';
          
          // Align right for price/total columns
          const align = (j >= 2) ? TextAlignment.Right : TextAlignment.Left;
          const xPos = (j >= 2) ? currentX + column.width - 5 : currentX + 5;
          
          await drawText(
            page,
            value,
            xPos,
            rowY + 10,
            9,
            font,
            align
          );
          
          currentX += column.width;
        }
      }
      
      finalY += rows.length * 20;
    } else {
      // Draw empty table with just headers
      // Draw table header background
      page.drawRectangle({
        x: 20,
        y: page.getHeight() - finalY,
        width: page.getWidth() - 40,
        height: 20,
        color: headerColor
      });
      
      // Draw table headers with white text
      let currentX = 20;
      for (const column of columns) {
        await drawText(
          page,
          column.header,
          currentX + column.width / 2,
          finalY + 10,
          10,
          boldFont,
          TextAlignment.Center,
          rgb(1, 1, 1) // White text for header
        );
        currentX += column.width;
      }
      
      finalY += 40; // Add some space for empty message
      await drawText(
        page,
        'No items found for this purchase order',
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
    const shippingCost = safeGetNumber(purchaseOrder, 'shipping_cost', 0);
    const totalAmount = safeGetNumber(purchaseOrder, 'total_amount', 0);
    const balance = safeGetNumber(purchaseOrder, 'balance', totalAmount);
    
    const totalY = finalY;
    
    // Subtotal
    await drawText(page, 'Subtotal:', 140, totalY, 10, font);
    await drawText(page, formatCurrency(totalAmount - shippingCost), 190, totalY, 10, font, TextAlignment.Right);
    
    // If shipping cost is present, show it
    if (shippingCost > 0) {
      await drawText(page, 'Shipping:', 140, totalY + 20, 10, font);
      await drawText(page, formatCurrency(shippingCost), 190, totalY + 20, 10, font, TextAlignment.Right);
    }
    
    // Total
    await drawText(page, 'Total:', 140, totalY + 40, 10, boldFont);
    await drawText(page, formatCurrency(totalAmount), 190, totalY + 40, 10, boldFont, TextAlignment.Right);
    
    // Payments
    const payments = purchaseOrder.vendorPayments || [];
    const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    if (payments.length > 0) {
      await drawText(page, 'Payments:', 140, totalY + 60, 10, font);
      await drawText(page, formatCurrency(totalPaid), 190, totalY + 60, 10, font, TextAlignment.Right);
    }
    
    // Balance
    await drawText(page, 'Balance Due:', 140, totalY + 80, 12, boldFont);
    await drawText(page, formatCurrency(balance), 190, totalY + 80, 12, boldFont, TextAlignment.Right);
    
    // 7. Add notes section
    if (purchaseOrder.po_notes) {
      await drawText(page, 'Notes:', 20, totalY, 10, boldFont);
      
      // Split notes into multiple lines
      const notes = String(purchaseOrder.po_notes);
      const noteLines = notes.split('\n');
      
      let noteY = totalY + 20;
      for (const line of noteLines) {
        await drawText(page, line, 20, noteY, 9, font);
        noteY += 12;
      }
    }
    
    // 8. Add payment history if available
    if (payments.length > 0) {
      const paymentY = totalY + 100;
      await drawText(page, 'Payment History:', 20, paymentY, 10, boldFont, TextAlignment.Left);
      
      const paymentColumns = [
        { header: 'Date', width: 60 },
        { header: 'Method', width: 60 },
        { header: 'Amount', width: 60 },
        { header: 'Note', width: 90 }
      ];
      
      const paymentRows = payments.map(payment => [
        formatShortDate(payment.date),
        payment.method || 'N/A',
        formatCurrency(payment.amount || 0),
        payment.notes || ''
      ]);
      
      // Draw payment table
      // Draw table header background
      page.drawRectangle({
        x: 20,
        y: page.getHeight() - (paymentY + 20),
        width: page.getWidth() - 40,
        height: 20,
        color: headerColor
      });
      
      // Draw table headers with white text
      let currentX = 20;
      for (const column of paymentColumns) {
        await drawText(
          page,
          column.header,
          currentX + column.width / 2,
          paymentY + 30,
          10,
          boldFont,
          TextAlignment.Center,
          rgb(1, 1, 1) // White text for header
        );
        currentX += column.width;
      }
      
      // Draw payment rows
      for (let i = 0; i < paymentRows.length; i++) {
        const row = paymentRows[i];
        const rowY = paymentY + 50 + (i * 20);
        
        // Draw alternating row background
        if (i % 2 === 1) {
          page.drawRectangle({
            x: 20,
            y: page.getHeight() - rowY,
            width: page.getWidth() - 40,
            height: 20,
            color: rgb(0.95, 0.95, 0.95) // Light gray for alternating rows
          });
        }
        
        // Draw cell values
        currentX = 20;
        for (let j = 0; j < paymentColumns.length; j++) {
          const column = paymentColumns[j];
          const value = row[j] || '';
          
          // Align right for amount column
          const align = (j === 2) ? TextAlignment.Right : TextAlignment.Left;
          const xPos = (j === 2) ? currentX + column.width - 5 : currentX + 5;
          
          await drawText(
            page,
            value,
            xPos,
            rowY + 10,
            9,
            font,
            align
          );
          
          currentX += column.width;
        }
      }
    }
    
    // 9. Add footer with page number
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
    console.error('Error generating purchase order PDF:', error);
    return null;
  }
}
