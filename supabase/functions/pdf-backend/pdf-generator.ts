/**
 * PDF generator module using pdf-lib
 * 
 * This module provides PDF generation functionality matching the frontend jsPDF implementation
 * but using pdf-lib which is better suited for Deno/edge functions environment
 */
import { PDFDocument, rgb, StandardFonts, PageSizes, TextAlignment } from 'pdf-lib';
import { DocumentType, Invoice, PurchaseOrder, Estimate } from './types.ts';
import { 
  formatCurrency, 
  formatShortDate, 
  formatDate,
  splitTextToLines
} from './utils.ts';

// Import specific PDF generators
import { generateInvoicePDF } from './invoice-generator.ts';
import { generatePurchaseOrderPDF } from './purchase-order-generator.ts';
import { generateEstimatePDF } from './estimate-generator.ts';

/**
 * Main function to generate a PDF document
 * 
 * @param {DocumentType} documentType - Type of document to generate
 * @param {any} documentData - Document data for generating the PDF
 * @returns {Promise<Uint8Array | null>} PDF content as bytes or null if generation fails
 */
export async function generatePDF(
  documentType: DocumentType,
  documentData: any
): Promise<Uint8Array | null> {
  try {
    console.log(`Generating ${documentType} PDF...`);
    
    let pdfDoc: PDFDocument | null = null;
    
    switch (documentType) {
      case DocumentType.INVOICE:
        pdfDoc = await generateInvoicePDF(documentData as Invoice);
        break;
      case DocumentType.PURCHASE_ORDER:
        pdfDoc = await generatePurchaseOrderPDF(documentData as PurchaseOrder);
        break;
      case DocumentType.ESTIMATE:
        pdfDoc = await generateEstimatePDF(documentData as Estimate);
        break;
      default:
        console.error(`Unsupported document type: ${documentType}`);
        return null;
    }
    
    if (!pdfDoc) {
      console.error(`Failed to generate ${documentType} PDF`);
      return null;
    }
    
    return await pdfDoc.save();
  } catch (error) {
    console.error(`Error generating ${documentType} PDF:`, error);
    return null;
  }
}

/**
 * Draw text with specified formatting
 * pdf-lib utility function to simplify text drawing with specific alignment
 * 
 * @param {PDFDocument} page - PDF page to draw on
 * @param {string} text - Text to draw
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} size - Font size
 * @param {any} font - Font to use
 * @param {TextAlignment} align - Text alignment
 * @param {any} color - Text color
 */
export async function drawText(
  page,
  text,
  x,
  y,
  size = 10,
  font,
  align = TextAlignment.Left,
  color = rgb(0, 0, 0)
) {
  page.drawText(text, {
    x,
    y: page.getHeight() - y, // Convert to pdf-lib coordinate system
    size,
    font,
    color,
    alignment: align
  });
}

/**
 * Add letterhead to a PDF page
 * 
 * @param {any} page - PDF page to add letterhead to
 * @param {any} font - Font to use for letterhead
 * @param {string} companyName - Company name
 * @param {string} companyInfo - Company information (address, phone, etc.)
 */
export async function addLetterhead(page, font, companyName, companyInfo) {
  // Draw company name at top center, large and bold
  await drawText(
    page,
    companyName,
    page.getWidth() / 2,
    40,
    14,
    font,
    TextAlignment.Center
  );
  
  // Draw company info below name, smaller font
  const infoLines = splitTextToLines(companyInfo, 150, 9);
  let yPos = 55;
  
  for (const line of infoLines) {
    await drawText(
      page,
      line,
      page.getWidth() / 2,
      yPos,
      9,
      font,
      TextAlignment.Center
    );
    yPos += 12;
  }
}

/**
 * Add account details (customer or vendor) to a PDF page
 * 
 * @param {any} page - PDF page to add account details to
 * @param {any} font - Font to use for account details
 * @param {string} title - Section title (e.g., "Bill To:", "Vendor:")
 * @param {string} accountName - Account name
 * @param {string} accountInfo - Account details (address, contact info, etc.)
 * @param {number} x - X position (right-aligned sections use right margin)
 * @param {number} y - Starting Y position
 */
export async function addAccountDetails(
  page,
  font,
  title,
  accountName,
  accountInfo,
  x = 20,
  y = 60
) {
  // Draw section title
  await drawText(
    page,
    title,
    x,
    y,
    10,
    font,
    TextAlignment.Left,
    rgb(0.3, 0.3, 0.3)
  );
  
  // Draw account name
  await drawText(
    page,
    accountName,
    x,
    y + 15,
    12,
    font
  );
  
  // Draw account info as multiple lines
  const infoLines = splitTextToLines(accountInfo, 160, 9);
  let yPos = y + 30;
  
  for (const line of infoLines) {
    await drawText(
      page,
      line,
      x,
      yPos,
      9,
      font
    );
    yPos += 12;
  }
}

/**
 * Draw a line on the PDF page
 * 
 * @param {any} page - PDF page to draw line on
 * @param {number} x1 - Starting X position
 * @param {number} y1 - Starting Y position
 * @param {number} x2 - Ending X position
 * @param {number} y2 - Ending Y position
 * @param {any} color - Line color
 * @param {number} thickness - Line thickness
 */
export function drawLine(
  page,
  x1,
  y1,
  x2,
  y2,
  color = rgb(0.7, 0.7, 0.7),
  thickness = 1
) {
  page.drawLine({
    start: { x: x1, y: page.getHeight() - y1 },
    end: { x: x2, y: page.getHeight() - y2 },
    thickness,
    color
  });
}

/**
 * Draw a table on the PDF page
 * This is a simplified table drawing function that attempts to match jsPDF-autoTable
 * 
 * @param {any} page - PDF page to draw table on
 * @param {any} font - Font to use for table text
 * @param {Array<{header: string, width: number}>} columns - Table columns with headers and widths
 * @param {Array<Array<string>>} rows - Table rows with cell values
 * @param {number} x - Table starting X position
 * @param {number} y - Table starting Y position
 * @param {boolean} drawHeader - Whether to draw the header row
 * @returns {number} Ending Y position after drawing the table
 */
export async function drawTable(
  page,
  font,
  columns,
  rows,
  x = 20,
  y = 100,
  drawHeader = true
) {
  const pageWidth = page.getWidth();
  const margin = 20;
  const availableWidth = pageWidth - (margin * 2);
  
  // Calculate column widths based on percentages if not explicitly defined
  let totalWidth = 0;
  for (const col of columns) {
    if (!col.width) {
      col.width = availableWidth / columns.length;
    }
    totalWidth += col.width;
  }
  
  // Scale widths if total exceeds available width
  if (totalWidth > availableWidth) {
    const scale = availableWidth / totalWidth;
    for (const col of columns) {
      col.width *= scale;
    }
  }
  
  // Calculate row height (approximate based on font size)
  const rowHeight = 20;
  let currentY = y;
  
  // Draw header row if requested
  if (drawHeader) {
    // Draw header background
    page.drawRectangle({
      x,
      y: page.getHeight() - currentY,
      width: availableWidth,
      height: rowHeight,
      color: rgb(0.25, 0.25, 0.25)
    });
    
    // Draw header text
    let currentX = x;
    for (const column of columns) {
      await drawText(
        page,
        column.header,
        currentX + column.width / 2,
        currentY + rowHeight / 2 + 3, // Center text vertically
        9,
        font,
        TextAlignment.Center,
        rgb(1, 1, 1) // White text for header
      );
      currentX += column.width;
    }
    
    currentY += rowHeight;
  }
  
  // Draw data rows
  let rowIndex = 0;
  for (const row of rows) {
    // Draw alternating row background for striped effect
    if (rowIndex % 2 === 1) {
      page.drawRectangle({
        x,
        y: page.getHeight() - currentY,
        width: availableWidth,
        height: rowHeight,
        color: rgb(0.95, 0.95, 0.95)
      });
    }
    
    // Draw cell values
    let currentX = x;
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const value = row[i] || '';
      
      // Determine text alignment based on content type (right-align numbers)
      let align = TextAlignment.Left;
      if (typeof value === 'string' && value.startsWith('$')) {
        align = TextAlignment.Right;
        currentX += column.width - 5; // Adjust for right alignment with padding
      } else {
        currentX += 5; // Left padding for left-aligned text
      }
      
      await drawText(
        page,
        value,
        currentX,
        currentY + rowHeight / 2 + 3, // Center text vertically
        9,
        font,
        align
      );
      
      currentX = x + column.width;
      for (let j = 0; j <= i; j++) {
        currentX += columns[j].width;
      }
    }
    
    currentY += rowHeight;
    rowIndex++;
  }
  
  return currentY;
}
