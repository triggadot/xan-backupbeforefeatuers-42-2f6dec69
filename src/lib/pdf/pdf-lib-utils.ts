
/**
 * @file PDF-Lib Utility Functions
 * @description Utilities for working with pdf-lib for more advanced PDF operations
 */

import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import { Invoice, PurchaseOrder, Estimate } from './pdf-utils-api';

/**
 * Create a new PDF document with pdf-lib
 *
 * @returns A new PDFDocument instance
 */
export async function createPDFDocument() {
  return await PDFDocument.create();
}

/**
 * Load an existing PDF from a URL
 *
 * @param url - URL of the PDF to load
 * @returns The loaded PDFDocument
 */
export async function loadPDFFromUrl(url: string) {
  const response = await fetch(url);
  const pdfBytes = await response.arrayBuffer();
  return await PDFDocument.load(pdfBytes);
}

/**
 * Add a watermark to an existing PDF
 *
 * @param pdfBytes - The original PDF as ArrayBuffer
 * @param watermarkText - Text to use as watermark
 * @returns New PDF with watermark as Uint8Array
 */
export async function addWatermark(pdfBytes: ArrayBuffer, watermarkText: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const fontSize = 50;
    const textWidth = helveticaFont.widthOfTextAtSize(watermarkText, fontSize);

    // Draw the watermark diagonally across the page
    page.drawText(watermarkText, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: fontSize,
      font: helveticaFont,
      color: rgb(0.8, 0.8, 0.8),
      opacity: 0.3,
      rotate: Math.PI / 4,
    });
  }

  return await pdfDoc.save();
}

/**
 * Merge multiple PDFs into a single document
 *
 * @param pdfUrls - Array of PDF URLs to merge
 * @returns Merged PDF as Uint8Array
 */
export async function mergePDFs(pdfUrls: string[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const url of pdfUrls) {
    try {
      const response = await fetch(url);
      const pdfBytes = await response.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);

      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    } catch (error) {
      console.error(`Error merging PDF from ${url}:`, error);
    }
  }

  return await mergedPdf.save();
}

/**
 * Generate a PDF from an invoice using pdf-lib (more customizable alternative)
 *
 * @param invoice - Invoice data
 * @returns PDF as Uint8Array
 */
export async function generateInvoicePDFWithPdfLib(invoice: Invoice): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Add header
  page.drawText('INVOICE', {
    x: 50,
    y: height - 50,
    size: 24,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Invoice number
  page.drawText(`Invoice #: ${invoice.invoice_uid || 'N/A'}`, {
    x: 50,
    y: height - 100,
    size: 12,
    font: regularFont,
    color: rgb(0, 0, 0),
  });

  // Date
  page.drawText(`Date: ${invoice.date_of_invoicenew Date(invoice.datdate_of_invoicecaleDateString() : 'N/A'} `, {
    x: 50,
    y: height - 120,
    size: 12,
    font: regularFont,
    color: rgb(0, 0, 0),
  });

  // Customer
  page.drawText(`Customer: ${ invoice.gl_accounts?.account_name || 'N/A' } `, {
    x: 50,
    y: height - 140,
    size: 12,
    font: regularFont,
    color: rgb(0, 0, 0),
  });

  // Line items header
  const lineY = height - 180;
  page.drawText('Description', {
    x: 50,
    y: lineY,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText('Quantity', {
    x: 300,
    y: lineY,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText('Price', {
    x: 380,
    y: lineY,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText('Total', {
    x: 480,
    y: lineY,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Line items
  let currentY = lineY - 20;
  if (invoice.lines && invoice.lines.length > 0) {
    for (const line of invoice.lines) {
      page.drawText(line.renamed_product_name || 'Unnamed Product', {
        x: 50,
        y: currentY,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0),
      });

      page.drawText(`${ line.qty_sold || 0 } `, {
        x: 300,
        y: currentY,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0),
      });

      page.drawText(`$${ line.selling_price?.toFixed(2) || '0.00' } `, {
        x: 380,
        y: currentY,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0),
      });

      page.drawText(`$${ line.line_total?.toFixed(2) || '0.00' } `, {
        x: 480,
        y: currentY,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0),
      });

      currentY -= 20;
    }
  }

  // Total
  currentY -= 20;
  page.drawText('Total:', {
    x: 380,
    y: currentY,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`$${ invoice.total_amount?.toFixed(2) || '0.00' } `, {
    x: 480,
    y: currentY,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });

  return await pdfDoc.save();
}

/**
 * Convert pdf-lib output to a Blob
 *
 * @param pdfBytes - PDF as Uint8Array from pdf-lib
 * @returns PDF as Blob
 */
export function pdfToBlob(pdfBytes: Uint8Array): Blob {
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Save pdf-lib generated PDF to a file
 *
 * @param pdfBytes - PDF as Uint8Array from pdf-lib
 * @param fileName - Filename to save as
 */
export function savePDF(pdfBytes: Uint8Array, fileName: string): void {
  const blob = pdfToBlob(pdfBytes);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
