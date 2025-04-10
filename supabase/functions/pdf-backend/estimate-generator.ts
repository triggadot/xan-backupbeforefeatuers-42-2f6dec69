/**
 * Estimate PDF generator module using pdf-lib
 * 
 * This module matches the exact layout, positioning, and styling of the frontend jsPDF implementation
 * to ensure visual consistency in estimate PDFs generated server-side
 */
import { PDFDocument, rgb, StandardFonts, PageSizes, TextAlignment } from 'pdf-lib';
import { Estimate } from './types.ts';
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
 * Generate an estimate PDF document
 * 
 * @param {Estimate} estimate - Estimate data for generating the PDF
 * @returns {Promise<PDFDocument | null>} Generated PDF document or null if generation fails
 */
export async function generateEstimatePDF(estimate: Estimate): Promise<PDFDocument | null> {
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
    const customer = estimate.account || {};
    const customerName = customer.account_name || 'N/A';
    const customerInfo = [
      customer.account_address,
      customer.account_city && customer.account_state ? 
        `${customer.account_city}, ${customer.account_state} ${customer.account_zip || ''}` : 
        customer.account_city || customer.account_state || '',
      customer.account_phone,
      customer.account_email
    ].filter(Boolean).join('\n');
    
    // 1. Add estimate title (add SAMPLE if it's a sample)
    const isASample = safeGetBoolean(estimate, 'is_a_sample', false);
    const title = isASample ? 'SAMPLE ESTIMATE' : 'ESTIMATE';
    
    await drawText(
      page,
      title,
      page.getWidth() / 2,
      20,
      18,
      boldFont,
      TextAlignment.Center
    );
    
    // 2. Add company letterhead
    await addLetterhead(page, font, companyName, companyInfo);
    
    // 3. Add customer details (right side)
    await addAccountDetails(
      page,
      font,
      'Customer:',
      customerName,
      customerInfo,
      140, // X position matches frontend jsPDF implementation
      60    // Y position matches frontend jsPDF implementation
    );
    
    // 4. Add estimate details (left side)
    const estimateUid = safeGetString(estimate, 'estimate_uid', 'N/A');
    const estimateDate = formatShortDate(estimate.estimate_date);
    const status = safeGetString(estimate, 'status', 'N/A');
    
    await drawText(page, 'Estimate #:', 20, 60, 10, font);
    await drawText(page, estimateUid, 70, 60, 10, font);
    
    await drawText(page, 'Date:', 20, 70, 10, font);
    await drawText(page, estimateDate, 70, 70, 10, font);
    
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
    
    const rows = (estimate.lines || []).map(line => [
      line.product_name_display || 'N/A',
      String(line.quantity || 0),
      formatCurrency(line.price || 0),
      formatCurrency(line.total || 0)
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
        'No items found for this estimate',
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
    const totalAmount = safeGetNumber(estimate, 'total_amount', 0);
    
    // Total Estimate
    await drawText(page, 'Total Estimate:', 140, finalY, 10, boldFont);
    await drawText(page, formatCurrency(totalAmount), 190, finalY, 10, boldFont, TextAlignment.Right);
    finalY += 20;
    
    // Credits/Deposits
    if (estimate.customer_credits && estimate.customer_credits.length > 0) {
      const totalCredits = estimate.customer_credits.reduce(
        (total, credit) => total + (credit.payment_amount || 0), 
        0
      );
      
      if (totalCredits > 0) {
        await drawText(page, 'Deposits Received:', 140, finalY, 10, font);
        await drawText(page, formatCurrency(totalCredits), 190, finalY, 10, font, TextAlignment.Right);
        finalY += 20;
      }
    }
    
    // Balance
    const balance = safeGetNumber(estimate, 'balance', totalAmount);
    await drawText(page, 'Balance Due:', 140, finalY, 12, boldFont);
    await drawText(page, formatCurrency(balance), 190, finalY, 12, boldFont, TextAlignment.Right);
    finalY += 30;
    
    // 7. Add notes section
    if (estimate.estimate_notes) {
      await drawText(page, 'Notes:', 20, finalY, 10, boldFont);
      finalY += 15;
      
      // Split notes into multiple lines
      const notes = String(estimate.estimate_notes);
      const noteLines = notes.split('\n');
      
      for (const line of noteLines) {
        await drawText(page, line, 20, finalY, 9, font);
        finalY += 12;
      }
    }
    
    // 8. Add sample watermark if needed
    if (isASample) {
      // Draw a diagonal "SAMPLE" watermark
      page.drawText('SAMPLE', {
        x: page.getWidth() / 2 - 80, // Center horizontally
        y: page.getHeight() / 2, // Center vertically
        size: 60,
        font: boldFont,
        color: rgb(0.8, 0.2, 0.2), // Red
        opacity: 0.4,
        rotate: {
          type: 'degrees',
          angle: 45
        }
      });
    }
    
    // 9. Add payment/credit history
    if (estimate.customer_credits && estimate.customer_credits.length > 0) {
      finalY += 20;
      await drawText(page, 'Deposits/Credits:', 100, finalY, 10, boldFont);
      finalY += 10;
      
      const paymentColumns = [
        { header: 'Date', width: 60 },
        { header: 'Method', width: 60 },
        { header: 'Amount', width: 60 },
        { header: 'Note', width: 90 }
      ];
      
      const paymentRows = estimate.customer_credits.map(credit => [
        formatShortDate(credit.date_of_payment),
        credit.payment_type || 'N/A',
        formatCurrency(credit.payment_amount || 0),
        credit.payment_note || ''
      ]);
      
      // Draw credit table header
      // Draw table header background
      page.drawRectangle({
        x: 100,
        y: page.getHeight() - finalY,
        width: page.getWidth() - 120,
        height: 20,
        color: headerColor
      });
      
      // Draw table headers with white text
      let currentX = 100;
      for (const column of paymentColumns) {
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
      
      // Draw payment rows
      finalY += 20;
      for (let i = 0; i < paymentRows.length; i++) {
        const row = paymentRows[i];
        const rowY = finalY + (i * 20);
        
        // Draw alternating row background
        if (i % 2 === 1) {
          page.drawRectangle({
            x: 100,
            y: page.getHeight() - rowY,
            width: page.getWidth() - 120,
            height: 20,
            color: rgb(0.95, 0.95, 0.95) // Light gray for alternating rows
          });
        }
        
        // Draw cell values
        currentX = 100;
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
    console.error('Error generating estimate PDF:', error);
    return null;
  }
}
