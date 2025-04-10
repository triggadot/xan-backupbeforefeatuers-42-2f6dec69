import { PageSizes, PDFDocument, rgb, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib@1.17.1?dts';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Batch Generate and Store PDFs function booting up');

/**
 * Supported document types for PDF generation
 */
enum DocumentType {
  INVOICE = 'invoice',
  ESTIMATE = 'estimate',
  PURCHASE_ORDER = 'purchaseorder',
}

/**
 * Document type mapping configuration
 */
interface DocumentTypeConfig {
  /** Table name for the main document */
  tableName: string;
  /** Table name for line items if any */
  linesTableName?: string;
  /** Field to use for the filename */
  uidField: string;
  /** Field referencing the account (using Glidebase pattern) */
  accountRefField: string;
  /** Storage folder path */
  storageFolder: string;
  /** Additional relations for specific document types */
  additionalRelations?: {
    /** Table name of the related entity */
    tableName: string;
    /** Field in the related entity referencing the document */
    referenceField: string;
  }[];
}

/**
 * Configuration for each document type including table names and field mappings
 * Following the Glidebase pattern of using glide_row_id for relationships
 */
const documentTypeConfig: Record<DocumentType, DocumentTypeConfig> = {
  [DocumentType.INVOICE]: {
    tableName: 'gl_invoices',
    linesTableName: 'gl_invoice_lines',
    uidField: 'invoice_uid',
    accountRefField: 'rowid_accounts',
    storageFolder: 'Invoices',
    additionalRelations: [
      {
        tableName: 'gl_shipping_records',
        referenceField: 'rowid_invoices'
      },
      {
        tableName: 'gl_customer_payments',
        referenceField: 'rowid_invoices'
      }
    ]
  },
  [DocumentType.ESTIMATE]: {
    tableName: 'gl_estimates',
    linesTableName: 'gl_estimate_lines',
    uidField: 'estimate_uid',
    accountRefField: 'rowid_accounts',
    storageFolder: 'Estimates',
    additionalRelations: [
      {
        tableName: 'gl_customer_credits',
        referenceField: 'rowid_estimates'
      }
    ]
  },
  [DocumentType.PURCHASE_ORDER]: {
    tableName: 'gl_purchase_orders',
    uidField: 'purchase_order_uid',
    accountRefField: 'rowid_accounts',
    storageFolder: 'PurchaseOrders',
    additionalRelations: [
      {
        tableName: 'gl_vendor_payments',
        referenceField: 'rowid_purchase_orders'
      }
    ]
  }
};

// Mapping for alternative document type formats to standardized enum
const documentTypeAliases: Record<string, DocumentType> = {
  'invoice': DocumentType.INVOICE,
  'invoices': DocumentType.INVOICE,

  'estimate': DocumentType.ESTIMATE,
  'estimates': DocumentType.ESTIMATE,

  'purchaseorder': DocumentType.PURCHASE_ORDER,
  'purchaseorders': DocumentType.PURCHASE_ORDER,
  'purchase-order': DocumentType.PURCHASE_ORDER,
  'purchase-orders': DocumentType.PURCHASE_ORDER,
  'purchase_order': DocumentType.PURCHASE_ORDER,
  'purchase_orders': DocumentType.PURCHASE_ORDER,
  'purchaseOrder': DocumentType.PURCHASE_ORDER,
};

/**
 * Standardizes document type format for internal processing.
 * Converts various input strings (case-insensitive, with/without plurals/hyphens)
 * into a standard DocumentType enum value using the documentTypeAliases map.
 *
 * @param {string} type - The document type string to normalize (case-insensitive).
 * @returns {DocumentType} Normalized DocumentType enum value.
 * @throws {Error} If the type is empty, null, or not found in the aliases map.
 *
 * @example
 * const normalized = normalizeDocumentType('Invoices');
 * // normalized will be DocumentType.INVOICE
 *
 * @example
 * normalizeDocumentType('purchase-order');
 * // returns DocumentType.PURCHASE_ORDER
 */
function normalizeDocumentType(type: string): DocumentType {
  if (!type) {
    throw new Error('Document type is required');
  }

  // Convert to lowercase and trim whitespace
  const normalized = type.toLowerCase().trim();

  // Look up in our aliases map
  const documentType = documentTypeAliases[normalized];

  if (!documentType) {
    throw new Error(`Unsupported document type: ${type}`);
  }

  return documentType;
}

/**
 * Formats a numerical value as a US dollar currency string.
 * Handles undefined or null values by returning '$0.00'.
 *
 * @param {number} [value] - The numerical value to format.
 * @returns {string} The formatted currency string (e.g., '$1,234.56').
 *
 * @example
 * formatCurrency(1500); // Returns "$1,500.00"
 * formatCurrency(99.9);  // Returns "$99.90"
 * formatCurrency();     // Returns "$0.00"
 */
function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
}

/**
 * Formats a date string into a more readable format (e.g., "Jan 1, 2023").
 * Handles invalid or missing date strings by returning 'N/A'.
 *
 * @param {string} [dateStr] - The date string to format (should be parseable by new Date()).
 * @returns {string} The formatted date string or 'N/A' on error/missing input.
 *
 * @example
 * formatDate('2023-10-26T10:00:00Z'); // Returns "Oct 26, 2023"
 * formatDate('invalid-date');         // Returns "N/A"
 * formatDate();                     // Returns "N/A"
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    // Check if the date is valid after parsing
    if (isNaN(date.getTime())) {
        return 'N/A';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.warn(`Error formatting date '${dateStr}': ${error.message}`);
    return 'N/A';
  }
}

/**
 * Formats a date string into a short MM/DD/YYYY format.
 * Handles invalid or missing date strings by returning 'N/A'.
 *
 * @param {string} [dateStr] - The date string to format (should be parseable by new Date()).
 * @returns {string} The formatted date string (MM/DD/YYYY) or 'N/A' on error/missing input.
 *
 * @example
 * formatShortDate('2023-10-26T10:00:00Z'); // Returns "10/26/2023"
 * formatShortDate('2024-01-05');         // Returns "01/05/2024"
 * formatShortDate();                     // Returns "N/A"
 */
function formatShortDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    // Check if the date is valid after parsing
    if (isNaN(date.getTime())) {
        return 'N/A';
    }
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch (error) {
    console.warn(`Error formatting short date '${dateStr}': ${error.message}`);
    return 'N/A';
  }
}

/**
 * Generates the PDF document structure and content specifically for an Invoice.
 * Uses the provided invoice data object (including related lines, account, payments)
 * to draw elements onto the PDF pages using pdf-lib. Handles pagination for line items.
 *
 * @param {any} invoice - The comprehensive invoice data object, expected to contain details like invoice_uid, invoice_order_date, total_amount, and nested arrays for `lines` and `customer_payments`, plus a nested `account` object.
 * @returns {Promise<Uint8Array | null>} A promise that resolves with the generated PDF as a Uint8Array, or null if an error occurs during generation.
 *
 * @example
 * // Assuming 'fetchedInvoiceData' contains all necessary invoice details
 * const pdfBytes = await generateInvoicePDF(fetchedInvoiceData);
 * if (pdfBytes) {
 *   // Use the PDF bytes (e.g., upload to storage)
 * }
 */
async function generateInvoicePDF(invoice: any): Promise<Uint8Array | null> {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage(PageSizes.A4); // Use 'let' for pagination
    const { width, height } = page.getSize();

    // Add fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Header
    page.drawText('INVOICE', {
      x: width / 2, // Centered
      y: height - 40, // Adjusted Y
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0),
      maxWidth: width - 100, // Prevent overflow
      align: "center", // Use pdf-lib's align property
    });

    // Invoice number and date
    const invoiceNumber = invoice.invoice_uid || 'N/A';
    const invoiceDate = formatShortDate(invoice.invoice_order_date);
    page.drawText(`Invoice #: ${invoiceNumber}`, {
      x: 50,
      y: height - 70,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    page.drawText(`Date: ${invoiceDate}`, {
      x: 50,
      y: height - 85,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });

    // --- Placeholder for Bill To / Account Info ---
    if (invoice.account) {
        const account = invoice.account;
        const customerName = account.account_name || account.name || 'N/A';
        // Add Bill To Address rendering here if needed
        page.drawText(`Bill To:`, { x: 350, y: height - 70, size: 11, font: boldFont });
        page.drawText(`${customerName}`, { x: 350, y: height - 85, size: 11, font: regularFont });
        // Add more address lines...
    }
    // --- End Placeholder ---


    // Table header
    const tableStartY = height - 120; // Start table lower
    const tableHeaderY = tableStartY;
    const tableXPositions = { product: 50, qty: 280, price: 360, total: 460 };
    const tableEndX = 550; // Right edge of table/lines

    page.drawText('Product / Description', {
      x: tableXPositions.product,
      y: tableHeaderY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText('Qty', {
      x: tableXPositions.qty,
      y: tableHeaderY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText('Unit Price', {
      x: tableXPositions.price,
      y: tableHeaderY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText('Line Total', {
      x: tableXPositions.total,
      y: tableHeaderY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Draw horizontal line below header
    page.drawLine({
      start: { x: tableXPositions.product, y: tableHeaderY - 10 },
      end: { x: tableEndX, y: tableHeaderY - 10 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Line items
    let currentY = tableHeaderY - 30;
    let itemCount = 0;
    let pageNumber = 1;
    const lines = invoice.lines || []; // Use already fetched lines
    const itemsPerPageEstimate = 25; // Adjust as needed
    const totalPages = Math.max(1, Math.ceil(lines.length / itemsPerPageEstimate)); // Estimate total pages
    const pageBottomMargin = 70; // Where to trigger page break

    if (lines.length > 0) {
      for (const line of lines) {
        // Add a new page if we're running out of space
        if (currentY < pageBottomMargin && itemCount < lines.length) {
          // Add page number to current page
          page.drawText(`Page ${pageNumber} of ${totalPages}`, { // Use estimated total pages
            x: width / 2 - 30,
            y: 30,
            size: 10,
            font: regularFont,
            color: rgb(0.5, 0.5, 0.5), // Lighter color for footer text
          });

          // Add new page
          page = pdfDoc.addPage(PageSizes.A4);
          pageNumber++;
          currentY = height - 50; // Reset Y for new page content

          // Add header to new page
          page.drawText(`INVOICE #${invoiceNumber} (continued)`, {
            x: width / 2,
            y: height - 40,
            size: 16, // Slightly smaller for continuation
            font: boldFont,
            color: rgb(0, 0, 0),
            align: "center"
          });

          // Re-draw Table header on new page
          const contTableHeaderY = height - 70; // Y position for header on new page
          page.drawText('Product / Description', { x: tableXPositions.product, y: contTableHeaderY, size: 12, font: boldFont });
          page.drawText('Qty', { x: tableXPositions.qty, y: contTableHeaderY, size: 12, font: boldFont });
          page.drawText('Unit Price', { x: tableXPositions.price, y: contTableHeaderY, size: 12, font: boldFont });
          page.drawText('Total', { x: tableXPositions.total, y: contTableHeaderY, size: 12, font: boldFont });
          page.drawLine({
            start: { x: tableXPositions.product, y: contTableHeaderY - 10 },
            end: { x: tableEndX, y: contTableHeaderY - 10 },
            thickness: 1,
            color: rgb(0.7, 0.7, 0.7),
          });
          currentY = contTableHeaderY - 30; // Reset Y below header
        }

        // Get line item details
        let productName = 'N/A';
        if (line.product) {
          productName = line.product.name || line.product.product_name || line.product.display_name || 'Product';
        } else {
          // Fallback using fields directly on the line item if product join didn't happen or wasn't needed
          productName = line.product_name_display || line.renamed_product_name || line.product_name || 'Product Detail';
        }

        const qty = line.qty_sold || 0;
        const price = line.selling_price || 0;
        const total = line.line_total || (qty * price); // Calculate if missing

        // Truncate product name if too long - consider text wrapping instead if needed
        const maxChars = 40; // Allow more characters
        const displayName = productName.length > maxChars
          ? productName.substring(0, maxChars) + '...'
          : productName;

        // Draw line item details (Corrected version - removed duplicates)
        page.drawText(displayName, {
          x: tableXPositions.product,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });

        page.drawText(`${qty}`, { // Display quantity as string
          x: tableXPositions.qty,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });

        page.drawText(formatCurrency(price), {
          x: tableXPositions.price,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });

        page.drawText(formatCurrency(total), {
          x: tableXPositions.total,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });

        currentY -= 20; // Move down for next line
        itemCount++;
      }
    } else {
        // If no lines, maybe draw a message
        page.drawText('No line items associated with this invoice.', {
            x: 50, y: currentY, size: 10, font: regularFont, color: rgb(0.5, 0.5, 0.5)
        });
        currentY -= 20;
    }

    // --- Summary Section ---
    // Ensure summary starts below the last line item, or below header if no items
    currentY = Math.min(currentY, tableStartY - 40); // Ensure space below table line
    const summaryX = 360; // X position for summary labels/values

    // Calculate summaries
    const subTotalAmount = invoice.total_amount || 0; // Assuming total_amount is subtotal before payments
    let totalPaid = 0;
    if (invoice.customer_payments && Array.isArray(invoice.customer_payments)) {
      invoice.customer_payments.forEach((payment: any) => {
        if (typeof payment.amount === 'number') {
          totalPaid += payment.amount;
        }
      });
    }
    const balanceDue = subTotalAmount - totalPaid;

    // Draw Summary Lines
    page.drawLine({ // Line above summary
      start: { x: summaryX - 10, y: currentY + 5 },
      end: { x: tableEndX, y: currentY + 5 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    currentY -= 15;

    page.drawText(`Subtotal:`, { x: summaryX, y: currentY, size: 10, font: regularFont });
    page.drawText(formatCurrency(subTotalAmount), { x: tableXPositions.total, y: currentY, size: 10, font: regularFont });
    currentY -= 15;

    page.drawText(`Payments/Credits:`, { x: summaryX, y: currentY, size: 10, font: regularFont });
    page.drawText(formatCurrency(totalPaid), { x: tableXPositions.total, y: currentY, size: 10, font: regularFont });
    currentY -= 15;

    // Balance Due (Bold)
    page.drawText(`Balance Due:`, { x: summaryX, y: currentY, size: 12, font: boldFont });
    page.drawText(formatCurrency(balanceDue), { x: tableXPositions.total, y: currentY, size: 12, font: boldFont });
    currentY -= 20;

    // --- Footer / Notes ---
    // Add Terms or Notes here if needed, potentially checking for page breaks

    // Add page number to the last page
    page.drawText(`Page ${pageNumber} of ${totalPages}`, {
      x: width / 2 - 30,
      y: 30,
      size: 10,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Save the PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error(`Error generating invoice PDF for ${invoice?.id || 'unknown ID'}:`, error);
    return null;
  }
}


/**
 * Generates the PDF document structure and content specifically for a Purchase Order.
 * Uses the provided PO data object (including related lines, account, payments)
 * to draw elements onto the PDF pages using pdf-lib. Handles pagination.
 *
 * @param {any} purchaseOrder - The comprehensive PO data object, expected to contain details like purchase_order_uid, po_date, total_amount, and nested arrays for `lineItems` (PO lines) and `vendor_payments`, plus a nested `account` object (vendor).
 * @returns {Promise<Uint8Array | null>} A promise that resolves with the generated PDF as a Uint8Array, or null if an error occurs during generation.
 *
 * @example
 * // Assuming 'fetchedPOData' contains all necessary PO details
 * const pdfBytes = await generatePurchaseOrderPDF(fetchedPOData);
 * if (pdfBytes) {
 *   // Use the PDF bytes
 * }
 */
async function generatePurchaseOrderPDF(purchaseOrder: any): Promise<Uint8Array | null> {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();

    // Add fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Header
    page.drawText('PURCHASE ORDER', {
      x: width / 2,
      y: height - 40,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0),
      align: "center",
    });

    // PO number and date
    const poNumber = purchaseOrder.purchase_order_uid || 'N/A';
    const poDate = formatShortDate(purchaseOrder.po_date);
    page.drawText(`PO #: ${poNumber}`, {
      x: 50,
      y: height - 70,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    page.drawText(`Date: ${poDate}`, {
      x: 50,
      y: height - 85,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });

    // Vendor info if available
    if (purchaseOrder.account) {
        const account = purchaseOrder.account;
        const vendorName = account.account_name || account.name || 'N/A';
        page.drawText(`Vendor:`, { x: 350, y: height - 70, size: 11, font: boldFont });
        page.drawText(`${vendorName}`, { x: 350, y: height - 85, size: 11, font: regularFont });
        // Add more vendor address details here if needed
    }

    // Status (Optional - Add if needed)
    const status = purchaseOrder.payment_status || purchaseOrder.status || 'N/A'; // Example status field
    page.drawText(`Status: ${status}`, {
        x: 50, y: height - 105, size: 11, font: regularFont, color: rgb(0, 0, 0)
    });

    // Table setup
    const tableStartY = height - 130;
    const tableHeaderY = tableStartY;
    const tableXPositions = { product: 50, qty: 280, price: 360, total: 460 };
    const tableEndX = 550;
    const pageBottomMargin = 150; // Leave more space for summary/payments at bottom

    // Table header
    page.drawText('Item / Description', { x: tableXPositions.product, y: tableHeaderY, size: 12, font: boldFont });
    page.drawText('Qty', { x: tableXPositions.qty, y: tableHeaderY, size: 12, font: boldFont });
    page.drawText('Unit Cost', { x: tableXPositions.price, y: tableHeaderY, size: 12, font: boldFont });
    page.drawText('Total Cost', { x: tableXPositions.total, y: tableHeaderY, size: 12, font: boldFont });
    page.drawLine({
        start: { x: tableXPositions.product, y: tableHeaderY - 10 },
        end: { x: tableEndX, y: tableHeaderY - 10 },
        thickness: 1, color: rgb(0.7, 0.7, 0.7),
    });

    // Line items
    let currentY = tableHeaderY - 30;
    let itemCount = 0;
    let pageNumber = 1;
    const lineItems = purchaseOrder.lineItems || []; // Use fetched line items
    const itemsPerPageEstimate = 20; // Fewer items per page potentially
    const totalPages = Math.max(1, Math.ceil(lineItems.length / itemsPerPageEstimate)); // Estimate pages

    if (lineItems.length > 0) {
        for (const item of lineItems) {
            // Page break logic
            if (currentY < pageBottomMargin && itemCount < lineItems.length) {
                page.drawText(`Page ${pageNumber} of ${totalPages}`, { x: width / 2 - 30, y: 30, size: 10, font: regularFont, color: rgb(0.5, 0.5, 0.5) });
                page = pdfDoc.addPage(PageSizes.A4);
                pageNumber++;
                currentY = height - 50; // Reset Y

                page.drawText(`PURCHASE ORDER #${poNumber} (continued)`, { x: width / 2, y: height - 40, size: 16, font: boldFont, align: "center" });
                // Re-draw header
                const contTableHeaderY = height - 70;
                page.drawText('Item / Description', { x: tableXPositions.product, y: contTableHeaderY, size: 12, font: boldFont });
                page.drawText('Qty', { x: tableXPositions.qty, y: contTableHeaderY, size: 12, font: boldFont });
                page.drawText('Unit Cost', { x: tableXPositions.price, y: contTableHeaderY, size: 12, font: boldFont });
                page.drawText('Total Cost', { x: tableXPositions.total, y: contTableHeaderY, size: 12, font: boldFont });
                page.drawLine({ start: { x: tableXPositions.product, y: contTableHeaderY - 10 }, end: { x: tableEndX, y: contTableHeaderY - 10 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
                currentY = contTableHeaderY - 30;
            }

            // Get item details
            const productName = item.display_name || item.vendor_product_name || item.new_product_name || 'N/A';
            const quantity = item.quantity || 0;
            const unitPrice = item.unitPrice || item.unit_cost || 0; // Check multiple fields
            const total = item.total || (quantity * unitPrice);

            const maxChars = 40;
            const displayName = productName.length > maxChars ? productName.substring(0, maxChars) + '...' : productName;

            // Draw item details (Corrected version)
            page.drawText(displayName, { x: tableXPositions.product, y: currentY, size: 10, font: regularFont });
            page.drawText(`${quantity}`, { x: tableXPositions.qty, y: currentY, size: 10, font: regularFont });
            page.drawText(formatCurrency(unitPrice), { x: tableXPositions.price, y: currentY, size: 10, font: regularFont });
            page.drawText(formatCurrency(total), { x: tableXPositions.total, y: currentY, size: 10, font: regularFont });

            currentY -= 20;
            itemCount++;
        }
    } else {
        page.drawText('No line items associated with this purchase order.', { x: 50, y: currentY, size: 10, font: regularFont, color: rgb(0.5, 0.5, 0.5) });
        currentY -= 20;
    }


    // --- Summary & Payments Section (Ensure it's below lines) ---
    currentY = Math.min(currentY, tableStartY - 40); // Position below table line
    const summaryX = 360; // X position for summary labels/values

    // Calculate totals
    const totalAmount = purchaseOrder.total_amount || 0;
    let totalPaid = 0;
    if (purchaseOrder.vendor_payments && Array.isArray(purchaseOrder.vendor_payments)) {
        purchaseOrder.vendor_payments.forEach((payment: any) => {
            if (typeof payment.amount === 'number') {
                totalPaid += payment.amount;
            }
        });
    }
    const balance = totalAmount - totalPaid;

    // Draw Summary/Payment Info
     page.drawLine({ // Line above summary
      start: { x: summaryX - 10, y: currentY + 5 },
      end: { x: tableEndX, y: currentY + 5 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    currentY -= 15;

    page.drawText(`Total Amount:`, { x: summaryX, y: currentY, size: 10, font: regularFont });
    page.drawText(formatCurrency(totalAmount), { x: tableXPositions.total, y: currentY, size: 10, font: regularFont });
    currentY -= 15;

    page.drawText(`Total Paid:`, { x: summaryX, y: currentY, size: 10, font: regularFont });
    page.drawText(formatCurrency(totalPaid), { x: tableXPositions.total, y: currentY, size: 10, font: regularFont });
    currentY -= 15;

    page.drawText(`Balance Due:`, { x: summaryX, y: currentY, size: 12, font: boldFont });
    page.drawText(formatCurrency(balance), { x: tableXPositions.total, y: currentY, size: 12, font: boldFont });
    currentY -= 20;

    // Optionally list vendor payments if needed (check space, add pages if required)
    if (purchaseOrder.vendor_payments && purchaseOrder.vendor_payments.length > 0 && currentY > pageBottomMargin + 20) {
        currentY -= 10; // Space before payments list
        page.drawText('Payment History:', { x: 50, y: currentY, size: 11, font: boldFont });
        currentY -= 15;
        for (const payment of purchaseOrder.vendor_payments) {
             if (currentY < 60) break; // Stop if near bottom
             const paymentDate = payment.payment_date ? formatShortDate(payment.payment_date) : 'N/A';
             const amount = payment.amount || 0;
             page.drawText(`${paymentDate}: ${formatCurrency(amount)}`, { x: 50, y: currentY, size: 10, font: regularFont });
             currentY -= 15;
        }
    }

    // Add page number to the last page
    // BUG FIX: Use calculated page number and total pages
    page.drawText(`Page ${pageNumber} of ${totalPages}`, {
      x: width / 2 - 30,
      y: 30,
      size: 10,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Save the PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error(`Error generating purchase order PDF for ${purchaseOrder?.id || 'unknown ID'}:`, error);
    return null;
  }
}


/**
 * Generates the PDF document structure and content specifically for an Estimate.
 * Uses the provided estimate data object (including related lines, account, credits, notes)
 * to draw elements onto the PDF pages using pdf-lib. Handles pagination for line items and notes.
 *
 * @param {any} estimate - The comprehensive estimate data object, expected to contain details like estimate_uid, estimate_date, total_amount, status, notes, and nested arrays for `lines` and `customer_credits`, plus a nested `account` object and potentially a linked `invoice` object.
 * @returns {Promise<Uint8Array | null>} A promise that resolves with the generated PDF as a Uint8Array, or null if an error occurs during generation.
 *
 * @example
 * // Assuming 'fetchedEstimateData' contains all necessary estimate details
 * const pdfBytes = await generateEstimatePDF(fetchedEstimateData);
 * if (pdfBytes) {
 *   // Use the PDF bytes
 * }
 */
async function generateEstimatePDF(estimate: any): Promise<Uint8Array | null> {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();

    // Add fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Header
    page.drawText('ESTIMATE', {
      x: width / 2,
      y: height - 40,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0),
      align: "center",
    });

    // Estimate number and date
    const estimateNumber = estimate.estimate_uid || 'N/A';
    const estimateDate = formatShortDate(estimate.estimate_date);
     page.drawText(`Estimate #: ${estimateNumber}`, {
      x: 50,
      y: height - 70,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    page.drawText(`Date: ${estimateDate}`, {
      x: 50,
      y: height - 85,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });

    // Customer info if available
    if (estimate.account) {
      const account = estimate.account;
      const customerName = account.account_name || account.name || 'N/A';
      page.drawText(`Customer:`, { x: 350, y: height - 70, size: 11, font: boldFont });
      page.drawText(`${customerName}`, { x: 350, y: height - 85, size: 11, font: regularFont });
      // Add more customer address details here if needed
    }

    // Status display
    const status = estimate.status || 'Draft';
    page.drawText(`Status: ${status}`, {
        x: 50, y: height - 105, size: 11, font: regularFont
    });

    // Table setup
    const tableStartY = height - 130;
    const tableHeaderY = tableStartY;
    const tableXPositions = { product: 50, qty: 280, price: 360, total: 460 };
    const tableEndX = 550;
    const pageBottomMargin = 100; // Margin before triggering page break for lines

    // Table header
    page.drawText('Product / Service', { x: tableXPositions.product, y: tableHeaderY, size: 12, font: boldFont });
    page.drawText('Qty', { x: tableXPositions.qty, y: tableHeaderY, size: 12, font: boldFont });
    page.drawText('Unit Price', { x: tableXPositions.price, y: tableHeaderY, size: 12, font: boldFont });
    page.drawText('Line Total', { x: tableXPositions.total, y: tableHeaderY, size: 12, font: boldFont });
    page.drawLine({
        start: { x: tableXPositions.product, y: tableHeaderY - 10 },
        end: { x: tableEndX, y: tableHeaderY - 10 },
        thickness: 1, color: rgb(0.7, 0.7, 0.7)
    });

    // Line items
    let currentY = tableHeaderY - 30;
    let itemCount = 0;
    let pageNumber = 1;
    const lines = estimate.lines || []; // Use fetched lines
    const itemsPerPageEstimate = 25;
    let linePages = Math.max(1, Math.ceil(lines.length / itemsPerPageEstimate)); // Pages just for lines

    // --- Line Item Loop ---
    if (lines.length > 0) {
        for (const line of lines) {
            // Page break logic
            if (currentY < pageBottomMargin && itemCount < lines.length) {
                page.drawText(`Page ${pageNumber}`, { x: width / 2 - 30, y: 30, size: 10, font: regularFont, color: rgb(0.5, 0.5, 0.5) }); // Temp page number
                page = pdfDoc.addPage(PageSizes.A4);
                pageNumber++;
                currentY = height - 50; // Reset Y

                page.drawText(`ESTIMATE #${estimateNumber} (continued)`, { x: width / 2, y: height - 40, size: 16, font: boldFont, align: "center" });
                // Re-draw header
                const contTableHeaderY = height - 70;
                page.drawText('Product / Service', { x: tableXPositions.product, y: contTableHeaderY, size: 12, font: boldFont });
                page.drawText('Qty', { x: tableXPositions.qty, y: contTableHeaderY, size: 12, font: boldFont });
                page.drawText('Unit Price', { x: tableXPositions.price, y: contTableHeaderY, size: 12, font: boldFont });
                page.drawText('Line Total', { x: tableXPositions.total, y: contTableHeaderY, size: 12, font: boldFont });
                page.drawLine({ start: { x: tableXPositions.product, y: contTableHeaderY - 10 }, end: { x: tableEndX, y: contTableHeaderY - 10 }, thickness: 1, color: rgb(0.7, 0.7, 0.7) });
                currentY = contTableHeaderY - 30;
            }

            // Get line item details
            let productName = 'N/A';
             if (line.product) {
                productName = line.product.name || line.product.product_name || line.product.display_name || 'Product';
            } else {
                productName = line.product_name_display || line.renamed_product_name || line.sale_product_name || line.description || line.product_name || 'Unnamed Product';
            }
            const qty = line.quantity || line.qty_sold || 0;
            const price = line.unit_price || line.selling_price || 0;
            const total = line.line_total || (qty * price);

            const maxChars = 40;
            const displayName = productName.length > maxChars ? productName.substring(0, maxChars) + '...' : productName;

            // Draw line item details (Corrected Version)
            page.drawText(displayName, { x: tableXPositions.product, y: currentY, size: 10, font: regularFont });
            page.drawText(`${qty}`, { x: tableXPositions.qty, y: currentY, size: 10, font: regularFont });
            page.drawText(formatCurrency(price), { x: tableXPositions.price, y: currentY, size: 10, font: regularFont });
            page.drawText(formatCurrency(total), { x: tableXPositions.total, y: currentY, size: 10, font: regularFont });

            currentY -= 20;
            itemCount++;
        }
    } else {
        page.drawText('No line items included in this estimate.', { x: 50, y: currentY, size: 10, font: regularFont, color: rgb(0.5, 0.5, 0.5) });
        currentY -= 20;
    }
    // --- End Line Item Loop ---

    // --- Summary Section ---
    currentY = Math.min(currentY, tableStartY - 40); // Ensure space below table line
    const summaryX = 360;

    // Calculate credits if available
    let totalCredits = 0;
    if (estimate.customer_credits && Array.isArray(estimate.customer_credits)) {
        estimate.customer_credits.forEach((credit: any) => {
            if (typeof credit.amount === 'number') {
                totalCredits += credit.amount;
            }
        });
    }

    // Draw Summary Lines
    page.drawLine({ // Line above summary
      start: { x: summaryX - 10, y: currentY + 5 },
      end: { x: tableEndX, y: currentY + 5 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
    currentY -= 15;

    page.drawText(`Subtotal:`, { x: summaryX, y: currentY, size: 10, font: regularFont });
    page.drawText(formatCurrency(estimate.total_amount || 0), { x: tableXPositions.total, y: currentY, size: 10, font: regularFont });
    currentY -= 15;

    if (totalCredits > 0) {
        page.drawText(`Applied Credits:`, { x: summaryX, y: currentY, size: 10, font: regularFont });
        page.drawText(formatCurrency(totalCredits), { x: tableXPositions.total, y: currentY, size: 10, font: regularFont });
        currentY -= 15;
    }

    // Grand Total (Bold)
    const grandTotal = (estimate.total_amount || 0) - totalCredits;
    page.drawText(`Estimated Total:`, { x: summaryX, y: currentY, size: 12, font: boldFont });
    page.drawText(formatCurrency(grandTotal), { x: tableXPositions.total, y: currentY, size: 12, font: boldFont });
    currentY -= 20;

    // If estimate is linked to an invoice
    if (estimate.invoice && estimate.status === 'converted') {
        currentY -= 10;
        const invoiceText = estimate.invoice.invoice_uid
            ? `Converted to Invoice: ${estimate.invoice.invoice_uid}`
            : 'Converted to Invoice';
        page.drawText(invoiceText, { x: 50, y: currentY, size: 10, font: regularFont });
        currentY -= 15;
    }

    // --- Notes Section ---
    let notesAdded = false;
    if (estimate.notes && estimate.notes.trim()) {
        notesAdded = true;
        const notesText = estimate.notes.trim();
        const noteLines = notesText.split('\n');
        const notesStartY = currentY - 20; // Start notes lower down
        const noteLineHeight = 15;
        const noteFontSize = 10;
        const noteMaxWidth = width - 100; // Max width for notes text

        // Check if notes need a new page
        if (notesStartY < pageBottomMargin + (noteLines.length * noteLineHeight)) {
            page.drawText(`Page ${pageNumber}`, { x: width / 2 - 30, y: 30, size: 10, font: regularFont, color: rgb(0.5, 0.5, 0.5) }); // Temp page num
            page = pdfDoc.addPage(PageSizes.A4);
            pageNumber++;
            currentY = height - 50; // Reset Y for notes page
            page.drawText('NOTES (continued)', { x: 50, y: currentY, size: 14, font: boldFont });
            currentY -= 30;
        } else {
            currentY = notesStartY; // Use calculated start Y
            page.drawText('NOTES', { x: 50, y: currentY, size: 14, font: boldFont });
            currentY -= 20;
        }

        // Draw notes with basic wrapping
        for (const line of noteLines) {
            // Simple word wrapping (can be improved)
            const words = line.split(' ');
            let currentLine = '';
            for (const word of words) {
                 // Check width using font (approximation)
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const textWidth = regularFont.widthOfTextAtSize(testLine, noteFontSize);

                if (textWidth > noteMaxWidth) {
                     if (currentY < 50) { // Page break within notes
                        page.drawText(`Page ${pageNumber}`, { x: width / 2 - 30, y: 30, size: 10, font: regularFont, color: rgb(0.5, 0.5, 0.5) }); // Temp page num
                        page = pdfDoc.addPage(PageSizes.A4);
                        pageNumber++;
                        currentY = height - 50;
                     }
                    page.drawText(currentLine, { x: 50, y: currentY, size: noteFontSize, font: regularFont });
                    currentY -= noteLineHeight;
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            // Draw the last part of the line
            if (currentY < 50) { // Page break before drawing last part
                 page.drawText(`Page ${pageNumber}`, { x: width / 2 - 30, y: 30, size: 10, font: regularFont, color: rgb(0.5, 0.5, 0.5) }); // Temp page num
                 page = pdfDoc.addPage(PageSizes.A4);
                 pageNumber++;
                 currentY = height - 50;
            }
            page.drawText(currentLine, { x: 50, y: currentY, size: noteFontSize, font: regularFont });
            currentY -= noteLineHeight;
        }
    }

    // --- Final Page Numbering ---
    // Recalculate total pages more accurately AFTER layout
    const finalTotalPages = pdfDoc.getPageCount();
    const pages = pdfDoc.getPages();
    pages.forEach((p, index) => {
         p.drawText(`Page ${index + 1} of ${finalTotalPages}`, {
            x: p.getWidth() / 2 - 30,
            y: 30,
            size: 10,
            font: regularFont,
            color: rgb(0.5, 0.5, 0.5),
        });
    });


    // Save the PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error(`Error generating estimate PDF for ${estimate?.id || 'unknown ID'}:`, error);
    return null;
  }
}


/**
 * Dispatches PDF generation to the appropriate function based on document type.
 * Takes a normalized document type and the fully fetched data object.
 *
 * @param {DocumentType} normalizedType - The standardized document type enum value.
 * @param {any} data - The complete data object for the document, including all related fetched data (lines, account, etc.).
 * @returns {Promise<Uint8Array | null>} A promise resolving to the generated PDF bytes (Uint8Array) or null if generation fails or the type is unsupported by a generator function.
 *
 * @example
 * const type = normalizeDocumentType('invoice');
 * const pdfBytes = await generatePDF(type, fullInvoiceData);
 */
async function generatePDF(normalizedType: DocumentType, data: any): Promise<Uint8Array | null> {
  // NOTE: The `type` parameter string was removed as the function now expects the already normalized `DocumentType` enum.
  console.log(`Generating ${normalizedType} PDF for ID: ${data.id || data.glide_row_id || 'unknown'}`);

  switch (normalizedType) {
    case DocumentType.INVOICE:
      return await generateInvoicePDF(data);
    case DocumentType.PURCHASE_ORDER:
      return await generatePurchaseOrderPDF(data);
    case DocumentType.ESTIMATE:
      return await generateEstimatePDF(data);
    default:
      // This case should theoretically not be reached if normalizeDocumentType works correctly
      // and all enum values have a corresponding generator.
      console.error(`Unsupported document type passed to generatePDF: ${normalizedType}`);
      return null;
  }
}


/**
 * Generates a standardized filename for the PDF document.
 * The format aims to match a specific pattern: Prefix + Account UID + Date (MMDDYY).
 * Includes fallbacks if account UID or date are missing.
 *
 * @param {DocumentType} documentType - The normalized type of the document (e.g., DocumentType.INVOICE).
 * @param {any} documentData - The data object for the document, expected to contain a nested `account` object with `account_uid` or `glide_row_id`, and a relevant date field (e.g., `invoice_order_date`, `po_date`, `estimate_date`). It should also have a UID field (e.g., `invoice_uid`) as a fallback.
 * @returns {string} The generated filename string (e.g., "INV#ACC123102623.pdf").
 *
 * @example
 * const filename = generateFileName(DocumentType.ESTIMATE, estimateData);
 * // Possible result: "EST#CUST456010524.pdf"
 */
/**
 * Generate a filename for PDF documents prioritizing document UIDs
 * Matches the frontend implementation for consistency
 * 
 * @param documentType - Type of document (INVOICE, PURCHASE_ORDER, ESTIMATE, etc.)
 * @param documentData - The document data object
 * @returns Filename string based on document UID or fallback
 */
function generateFileName(documentType: DocumentType, documentData: any): string {
  try {
    // Get the document UID based on document type
    let documentUid = null;
    let fallbackPrefix = 'DOC#';
    
    switch (documentType) {
      case DocumentType.INVOICE:
        documentUid = documentData.invoice_uid;
        fallbackPrefix = 'INV#';
        break;
      case DocumentType.PURCHASE_ORDER:
        documentUid = documentData.purchase_order_uid;
        fallbackPrefix = 'PO#';
        break;
      case DocumentType.ESTIMATE:
        documentUid = documentData.estimate_uid;
        fallbackPrefix = documentData.is_a_sample === true ? 'SMP#' : 'EST#';
        break;
      // Add other document types as needed
    }
    
    // If we have a valid document UID, use it directly
    if (documentUid) {
      console.log(`Using document UID for filename: ${documentUid}.pdf`);
      return `${documentUid}.pdf`;
    }
    
    // For documents without UIDs, use a fallback approach
    console.warn(`No document UID found for ${documentType}, using fallback ID`);
    
    // Use the document ID or glide_row_id as fallback
    const fallbackId = documentData?.id || documentData?.glide_row_id || 'UNKNOWNID';
    const fallbackFilename = `${fallbackPrefix}${fallbackId}.pdf`;
    
    console.log(`Using fallback filename: ${fallbackFilename}`);
    return fallbackFilename;
  } catch (error) {
    console.error('Critical error during filename generation:', error);
    // Final desperate fallback
    const fallbackId = documentData?.id || documentData?.glide_row_id || Date.now();
    return `${documentType.toLowerCase()}-${fallbackId}-ERROR.pdf`;
  }
}


// --- Main Server Handler ---
serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Ensure environment variables are set
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Missing environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
      );
    }

    // Create Supabase client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Project ID for reference in logs (Hardcoded - Consider making dynamic if needed)
    const projectId = "swrfsullhirscyxqneay";
    console.log(`Executing Edge Function in project: ${projectId}`);

    // Parse request body
     if (!req.body) {
      throw new Error("Request has no body.");
    }
    const { items } = await req.json();
    if (!Array.isArray(items)) {
      throw new Error("Request body must contain an 'items' array.");
    }
    if (items.length === 0) {
        console.log("Received empty 'items' array. Nothing to process.");
        return new Response(JSON.stringify({ results: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    console.log(`Processing batch of ${items.length} items.`);
    const results = [];

    // Process items sequentially to avoid overwhelming resources
    for (const item of items) {
      // Validate basic item structure
      if (!item || typeof item !== 'object' || !item.id || !item.type) {
          console.warn('Skipping invalid item in batch:', item);
          results.push({ id: item?.id || 'unknown', type: item?.type || 'unknown', success: false, error: 'Invalid item format (missing id or type)', url: null });
          continue;
      }

      const { id, type } = item;

      // Start with a default result for this item
      let itemResult = { id, type, success: false, error: '', url: null };

      try {
        // 1. Normalize the document type
        const normalizedType = normalizeDocumentType(type);
        const config = documentTypeConfig[normalizedType];
        // Item result type updated to normalized version
        itemResult.type = normalizedType;

        // Config should exist if normalization succeeded, but double-check
        if (!config) {
           throw new Error(`Internal Error: No configuration found for normalized type: ${normalizedType}`);
        }

        console.log(`Processing ${normalizedType} with ID: ${id}`);

        // 2. Fetch document data from the main table
        // --- Construct dynamic select query based on config (optional optimization) ---
        // let selectQuery = '*, '; // Start with all base fields
        // if (config.accountRefField) selectQuery += `${config.accountRefField}, `;
        // // Potentially add other needed fields based on config/PDF needs
        // selectQuery = selectQuery.replace(/,\s*$/, ''); // Remove trailing comma

        const { data: documentData, error: fetchError } = await supabaseAdmin
          .from(config.tableName)
          .select('*') // Using '*' for simplicity, but could be optimized
          .eq('id', id)
          .maybeSingle();

        if (fetchError) {
          throw new Error(
            `Database error fetching ${normalizedType} ${id}: ${fetchError.message}`,
          );
        }
        if (!documentData) {
          // Use specific error for not found vs other errors
          throw new Error(
            `${normalizedType} with ID ${id} not found in table ${config.tableName}.`,
          );
        }
        console.log(`Fetched base data for ${normalizedType} ${id}`);

        // --- Glidebase Pattern: Fetch related data MANUALLY ---

        // 3. Fetch Account Data
        const accountRowId = documentData[config.accountRefField];
        if (accountRowId) {
          try {
            console.log(`Fetching account using ${config.accountRefField}: ${accountRowId}`);
            const { data: accountData, error: accountError } = await supabaseAdmin
              .from('gl_accounts') // Assuming 'gl_accounts' is always the table name
              .select('*')
              .eq('glide_row_id', accountRowId) // Assuming account relationship is always via glide_row_id
              .maybeSingle();

            if (accountError) {
              // Log error but don't necessarily fail the whole process if account is non-critical
              console.warn(`Error fetching account for ${normalizedType} ${id}: ${accountError.message}`);
            } else if (accountData) {
              documentData.account = accountData; // Attach account data
              console.log(`Attached account data to ${normalizedType} ${id}`);
            } else {
              console.warn(`No account found with glide_row_id: ${accountRowId} for ${normalizedType} ${id}`);
            }
          } catch (accFetchError) {
            console.warn(`Exception fetching account for ${normalizedType} ${id}:`, accFetchError.message);
          }
        } else {
          console.log(`No account reference (${config.accountRefField}) found for ${normalizedType} ${id}`);
        }

        // 4. Fetch Line Items (if applicable)
        if (config.linesTableName && documentData.glide_row_id) { // Need glide_row_id of the main doc
           const lineItemRefField = `rowid_${config.tableName.replace('gl_', '')}`; // Construct reference field name
           try {
                console.log(`Fetching line items from ${config.linesTableName} using ${lineItemRefField}: ${documentData.glide_row_id}`);
                const { data: linesData, error: linesError } = await supabaseAdmin
                    .from(config.linesTableName)
                    .select('*, product:rowid_products(*)') // Attempt to fetch product via foreign key relationship (if set up)
                    // If FK relationship isn't set up, use manual fetch below
                    // .select('*')
                    .eq(lineItemRefField, documentData.glide_row_id);

                if (linesError) {
                     console.warn(`Error fetching line items for ${normalizedType} ${id}: ${linesError.message}`);
                     documentData.lines = [];
                } else if (linesData && linesData.length > 0) {
                    documentData.lines = linesData;
                    console.log(`Attached ${linesData.length} line items to ${normalizedType} ${id}`);

                    // --- Manual Product Fetch (if FK join didn't work or more fields needed) ---
                    // This part is redundant if the select('*, product:rowid_products(*)') works
                    /*
                    const productRefs = linesData
                        .map(line => line.rowid_products)
                        .filter(ref => ref); // Get non-null product refs

                    if (productRefs.length > 0) {
                        const uniqueProductRefs = [...new Set(productRefs)];
                        console.log(`Fetching ${uniqueProductRefs.length} unique products manually...`);
                        const { data: productsData, error: productsError } = await supabaseAdmin
                            .from('gl_products')
                            .select('*')
                            .in('glide_row_id', uniqueProductRefs);

                        if (productsError) {
                             console.warn(`Error fetching products for lines: ${productsError.message}`);
                        } else if (productsData && productsData.length > 0) {
                             const productMap = new Map(productsData.map(p => [p.glide_row_id, p]));
                             documentData.lines.forEach(line => {
                                if (line.rowid_products && productMap.has(line.rowid_products)) {
                                    line.product = productMap.get(line.rowid_products);
                                }
                             });
                             console.log(`Manually attached product data to line items for ${normalizedType} ${id}`);
                        }
                    }
                    */
                    // --- End Manual Product Fetch ---

                } else {
                    documentData.lines = [];
                    console.log(`No line items found for ${normalizedType} ${id}`);
                }
           } catch (linesFetchError) {
               console.warn(`Exception fetching line items for ${normalizedType} ${id}:`, linesFetchError.message);
               documentData.lines = []; // Ensure lines is an empty array on error
           }
        } else if (config.linesTableName && !documentData.glide_row_id) {
            console.warn(`Cannot fetch lines for ${normalizedType} ${id} because main document glide_row_id is missing.`);
            documentData.lines = [];
        }

        // 5. Fetch Purchase Order Line Items (Specific Case, different table/ref)
        // Note: This duplicates line fetching slightly; consider merging logic if PO lines follow same pattern.
        // If PO line items are ALWAYS in gl_purchase_order_lines, keep separate.
        if (normalizedType === DocumentType.PURCHASE_ORDER && documentData.glide_row_id) {
          try {
            console.log(`Fetching purchase order line items for PO ${id}`);
            const { data: poLineItems, error: poLinesError } = await supabaseAdmin
              .from('gl_purchase_order_lines') // Specific table for PO lines
              .select('*') // Add product join here if needed/possible: select('*, product:rowid_products(*)')
              .eq('rowid_purchase_orders', documentData.glide_row_id); // Specific reference field

            if (poLinesError) {
              console.warn(`Error fetching PO line items for ${id}: ${poLinesError.message}`);
              documentData.lineItems = []; // Use distinct property name
            } else if (poLineItems && poLineItems.length > 0) {
              documentData.lineItems = poLineItems;
              console.log(`Attached ${poLineItems.length} PO line items to purchase order ${id}`);
              // Add manual product fetch here if needed for PO lines
            } else {
              documentData.lineItems = [];
              console.log(`No PO line items found for purchase order ${id}`);
            }
          } catch (poLinesFetchError) {
            console.warn(`Exception fetching PO line items for ${id}:`, poLinesFetchError.message);
            documentData.lineItems = [];
          }
        }


        // 6. Fetch Additional Relations (using config)
        if (config.additionalRelations && documentData.glide_row_id) {
          for (const relation of config.additionalRelations) {
            try {
              console.log(`Fetching relation ${relation.tableName} using ${relation.referenceField}: ${documentData.glide_row_id}`);
              const { data: relatedData, error: relatedError } = await supabaseAdmin
                .from(relation.tableName)
                .select('*')
                .eq(relation.referenceField, documentData.glide_row_id);

              if (relatedError) {
                console.warn(`Error fetching relation ${relation.tableName} for ${normalizedType} ${id}: ${relatedError.message}`);
              } else if (relatedData && relatedData.length > 0) {
                // Attach using a property name derived from the table name
                const relationPropertyName = relation.tableName.replace(/^gl_/, ''); // Remove 'gl_' prefix
                documentData[relationPropertyName] = relatedData;
                console.log(`Attached ${relatedData.length} ${relationPropertyName}(s) to ${normalizedType} ${id}`);
              } else {
                 console.log(`No related records found in ${relation.tableName} for ${normalizedType} ${id}`);
              }
            } catch (relationFetchError) {
              console.warn(`Exception fetching relation ${relation.tableName} for ${normalizedType} ${id}:`, relationFetchError.message);
            }
          }
        }

        // 7. Fetch Linked Invoice (Special case for Estimates)
        if (normalizedType === DocumentType.ESTIMATE && documentData.rowid_invoices) {
          try {
            console.log(`Estimate ${id} linked to invoice rowid: ${documentData.rowid_invoices}. Fetching...`);
            const { data: invoiceData, error: invoiceError } = await supabaseAdmin
              .from('gl_invoices') // Assumes invoice table name
              .select('*')
              .eq('glide_row_id', documentData.rowid_invoices)
              .maybeSingle();

            if (invoiceError) {
              console.warn(`Error fetching linked invoice for estimate ${id}: ${invoiceError.message}`);
            } else if (invoiceData) {
              documentData.invoice = invoiceData; // Attach linked invoice data
              console.log(`Attached linked invoice data to estimate ${id}`);
            } else {
                console.log(`Linked invoice with rowid ${documentData.rowid_invoices} not found.`);
            }
          } catch (linkedInvoiceError) {
            console.warn(`Exception fetching linked invoice for estimate ${id}:`, linkedInvoiceError.message);
          }
        }

        // --- All Data Fetching Complete ---

        // 8. Generate PDF using the appropriate function
        const pdfBytes = await generatePDF(normalizedType, documentData); // Pass normalized type
        if (!pdfBytes) {
          // Error should have been logged inside generatePDF function
          throw new Error(`PDF generation function returned null/empty for ${normalizedType} ${id}. Check specific generator logs.`);
        }
        console.log(`Successfully generated PDF bytes for ${normalizedType} ${id}`);

        // 9. Generate Filename
        const fileName = generateFileName(normalizedType, documentData);
        if (!fileName || fileName.endsWith('-ERROR.pdf')) {
            // generation failed or hit critical fallback
             throw new Error(`Failed to generate a valid filename for ${normalizedType} ${id}. See previous logs.`);
        }

        // 10. Define Storage Path
        const storageKey = `${config.storageFolder}/${fileName}`;
        console.log(`Generated storage key: ${storageKey}`);

        // 11. Check/Create Bucket (Optional but good practice)
        // This check adds overhead; remove if buckets are guaranteed to exist
        // or if service role lacks storage admin permissions.
        try {
          console.log('Checking storage buckets...');
          const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();

          if (bucketsError) {
            // Log warning but proceed with upload attempt
            console.warn(`Could not list storage buckets: ${bucketsError.message}. Proceeding with upload attempt...`);
          } else {
            const pdfsBucketExists = buckets.some(b => b.name === 'pdfs');
            if (!pdfsBucketExists) {
              console.log("'pdfs' bucket not found. Attempting to create...");
              const { error: createError } = await supabaseAdmin.storage.createBucket('pdfs', {
                public: true, // Ensure this matches your access needs
                // fileSizeLimit: 10 * 1024 * 1024 // Example: 10MB limit
              });
              if (createError) {
                  // If creation fails, maybe we don't have permission, log and continue upload attempt
                 console.warn(`Failed to create 'pdfs' bucket (may lack permissions): ${createError.message}. Continuing upload attempt...`);
              } else {
                 console.log("'pdfs' bucket created successfully.");
              }
            } else {
                 console.log("'pdfs' bucket exists.");
            }
          }
        } catch (bucketCheckError) {
          console.warn(`Error during bucket check/creation: ${bucketCheckError.message}. Proceeding with upload attempt...`);
        }


        // 12. Upload PDF to Storage
        console.log(`Uploading PDF to storage path: pdfs/${storageKey}`);
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('pdfs') // Target bucket name
          .upload(storageKey, pdfBytes, {
            contentType: 'application/pdf',
            upsert: true, // Overwrite if file exists
          });

        if (uploadError) {
          // Provide more context in error message
          throw new Error(
            `Storage upload failed for ${storageKey}: ${uploadError.message}`
          );
        }
        // Upload succeeded, log confirmation
        console.log(`PDF successfully uploaded for ${normalizedType} ${id}. Path: ${uploadData?.path}`);

        // 13. Get Public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('pdfs')
          .getPublicUrl(storageKey);

        // Construct URL manually as fallback if getPublicUrl fails or returns unexpected data
        const publicUrl = urlData?.publicUrl || `https://${projectId}.supabase.co/storage/v1/object/public/pdfs/${storageKey}`;
        console.log(`Public URL for ${normalizedType} ${id}: ${publicUrl}`);

        // 14. Update Database Record with PDF URL
        console.log(`Updating ${config.tableName} record ${id} with URL...`);
        const { error: updateError } = await supabaseAdmin
          .from(config.tableName)
          .update({ supabase_pdf_url: publicUrl }) // Field name to update
          .eq('id', id); // Match the record by its primary ID

        if (updateError) {
          // Log error but consider the PDF generation/upload successful, maybe retry update later?
          // For now, we throw to indicate the full process didn't complete.
          throw new Error(
            `DB update failed for ${normalizedType} ${id} after successful upload: ${updateError.message}`
          );
        }
        console.log(`Successfully updated ${normalizedType} record ${id} with PDF URL.`);

        // 15. Send Webhook Notification (Optional)
        try {
          const { data: webhookSecret, error: vaultError } = await supabaseAdmin
            .from('vault.secrets')
            .select('secret')
            .eq('name', 'n8n_pdf_webhook') // Ensure this secret name is correct
            .maybeSingle(); // Use maybeSingle in case secret doesn't exist

          if (vaultError) {
            console.warn(`Could not retrieve webhook secret from vault: ${vaultError.message}`);
          } else if (webhookSecret?.secret) {
            const webhookUrl = webhookSecret.secret;
            console.log(`Sending webhook notification for ${normalizedType} ${id} to configured endpoint...`);

            const notificationPayload = {
              event: 'pdf_generated_stored',
              timestamp: new Date().toISOString(),
              documentInfo: {
                  type: normalizedType,
                  id: id,
                  glideRowId: documentData.glide_row_id,
                  uid: documentData[config.uidField] || null, // Use configured UID field
                  tableName: config.tableName,
              },
              pdf: {
                  url: publicUrl,
                  filename: fileName,
                  storageKey: storageKey,
                  bucket: 'pdfs',
              },
              sourceFunction: 'batch-generate-and-store-pdfs' // Identify the source
            };

            // Non-blocking fetch for webhook
            fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(notificationPayload)
            }).then(response => {
              if (!response.ok) {
                console.warn(`Webhook notification failed for ${id}: ${response.status} ${response.statusText}`);
                // Optionally log response body if needed: response.text().then(text => console.warn(text));
              } else {
                console.log(`Webhook notification sent successfully for ${id}.`);
              }
            }).catch(webhookError => {
              console.error(`Error sending webhook notification for ${id}: ${webhookError.message}`);
            });

          } else {
              console.log("Webhook URL secret 'n8n_pdf_webhook' not found in vault. Skipping notification.");
          }
        } catch (webhookProcessingError) {
          // Log error in webhook logic but don't fail the main PDF process
          console.error(`Error processing webhook step for ${id}: ${webhookProcessingError.message}`);
        }

        // If all steps succeeded
        itemResult = { ...itemResult, success: true, url: publicUrl };

      } catch (error) {
        // Catch errors specific to processing this single item
        console.error(
          `Failed to process ${itemResult.type} ID ${id}:`,
          error.message || error,
        );
        // Record the specific error for this item
        itemResult = { ...itemResult, success: false, error: error.message || String(error) };
      } finally {
        // Add the result (success or failure) for this item to the overall results array
        results.push(itemResult);
      }
    } // End of loop through items

    console.log('Batch processing complete. Returning results.');
    // Return the collected results for all items processed
    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Indicate the batch function itself completed successfully
    });

  } catch (error) {
    // Catch errors in the main function setup (e.g., env vars, request parsing)
    console.error('Critical Function Error:', error.message || error);
    return new Response(JSON.stringify({ error: `Critical Function Error: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Server error
    });
  }
});