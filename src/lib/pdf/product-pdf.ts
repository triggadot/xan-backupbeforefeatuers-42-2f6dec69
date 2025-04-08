import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Database } from '@/integrations/supabase/types';
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
import { saveAs } from 'file-saver'; // Import file-saver library

// Type definitions
export type Product = Database['public']['Tables']['gl_products']['Row'];
export type InvoiceLine = Database['public']['Tables']['gl_invoice_lines']['Row'] & {
  invoice?: Database['public']['Tables']['gl_invoices']['Row'];
};
export type EstimateLine = Database['public']['Tables']['gl_estimate_lines']['Row'] & {
  estimate?: Database['public']['Tables']['gl_estimates']['Row'];
};

export interface ProductDetail extends Product {
  vendor?: Database['public']['Tables']['gl_accounts']['Row'] | null;
  invoiceLines: InvoiceLine[];
  estimateLines: EstimateLine[];
  purchaseOrder?: Database['public']['Tables']['gl_purchase_orders']['Row'] | null;
}

/**
 * Fetch product data with all related information needed for PDF generation
 * 
 * @param productId - The ID or glide_row_id of the product to fetch
 * @returns Promise resolving to the product with all details or null if not found
 * 
 * @example
 * const productData = await fetchProductForPDF('123e4567-e89b-12d3-a456-426614174000');
 * if (productData) {
 *   const pdf = generateProductPDF(productData);
 * }
 */
export async function fetchProductForPDF(productId: string): Promise<ProductDetail | null> {
  try {
    console.log(`Fetching product data for PDF generation: ${productId}`);
    
    // Try to fetch product by id first
    let { data: productData, error: productError } = await supabase
      .from('gl_products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();
    
    // If not found by id, try by glide_row_id
    if (!productData) {
      const { data, error } = await supabase
        .from('gl_products')
        .select('*')
        .eq('glide_row_id', productId)
        .maybeSingle();
      
      productData = data;
      productError = error;
    }

    if (productError) {
      console.error('Error fetching product:', productError);
      return null;
    }
    
    if (!productData) {
      console.error(`Product not found with ID: ${productId}`);
      return null;
    }

    // Initialize product with empty arrays
    const productDetail: ProductDetail = {
      ...productData,
      invoiceLines: [],
      estimateLines: []
    };

    // Fetch vendor account if available
    if (productData.rowid_accounts) {
      const { data: vendorData, error: vendorError } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('glide_row_id', productData.rowid_accounts)
        .single();
        
      if (vendorError) {
        console.error(`Error fetching vendor: ${vendorError.message}`);
      } else if (vendorData) {
        productDetail.vendor = vendorData;
      }
    }

    // Fetch purchase order if available
    if (productData.rowid_purchase_orders) {
      const { data: po, error: poError } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .eq('glide_row_id', productData.rowid_purchase_orders)
        .single();

      if (poError) {
        console.error(`Error fetching purchase order: ${poError.message}`);
      } else {
        productDetail.purchaseOrder = po;
      }
    }

    // Fetch related invoice lines
    const { data: invoiceLines, error: invoiceLinesError } = await supabase
      .from('gl_invoice_lines')
      .select('*')
      .eq('rowid_products', productData.glide_row_id);

    if (invoiceLinesError) {
      console.error(`Error fetching invoice lines: ${invoiceLinesError.message}`);
    } else if (invoiceLines && invoiceLines.length > 0) {
      // Fetch related invoices
      const invoiceIds = invoiceLines
        .map(line => line.rowid_invoices)
        .filter((id): id is string => id !== null && id !== undefined);
        
      if (invoiceIds.length > 0) {
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('gl_invoices')
          .select('*')
          .in('glide_row_id', invoiceIds);
          
        if (invoicesError) {
          console.error(`Error fetching invoices: ${invoicesError.message}`);
        } else if (invoicesData) {
          // Create a lookup map for invoices
          const invoiceMap = new Map();
          invoicesData.forEach(invoice => {
            invoiceMap.set(invoice.glide_row_id, invoice);
          });
          
          // Join invoice lines with invoices
          productDetail.invoiceLines = invoiceLines.map(line => {
            if (line.rowid_invoices) {
              return {
                ...line,
                invoice: invoiceMap.get(line.rowid_invoices)
              };
            }
            return line;
          });
        }
      } else {
        productDetail.invoiceLines = invoiceLines;
      }
    }

    // Fetch estimate lines related to this product
    const { data: estimateLines, error: estimateLinesError } = await supabase
      .from('gl_estimate_lines')
      .select('*')
      .eq('rowid_products', productData.glide_row_id);

    if (estimateLinesError) {
      console.error(`Error fetching estimate lines: ${estimateLinesError.message}`);
    } else if (estimateLines && estimateLines.length > 0) {
      // Fetch related estimates
      const estimateIds = estimateLines
        .map(line => line.rowid_estimates)
        .filter((id): id is string => id !== null && id !== undefined);
        
      if (estimateIds.length > 0) {
        const { data: estimatesData, error: estimatesError } = await supabase
          .from('gl_estimates')
          .select('*')
          .in('glide_row_id', estimateIds);
          
        if (estimatesError) {
          console.error(`Error fetching estimates: ${estimatesError.message}`);
        } else if (estimatesData) {
          // Create a lookup map for estimates
          const estimateMap = new Map();
          estimatesData.forEach(estimate => {
            estimateMap.set(estimate.glide_row_id, estimate);
          });
          
          // Join estimate lines with estimates
          productDetail.estimateLines = estimateLines.map(line => {
            if (line.rowid_estimates) {
              return {
                ...line,
                estimate: estimateMap.get(line.rowid_estimates)
              };
            }
            return line;
          });
        }
      } else {
        productDetail.estimateLines = estimateLines;
      }
    }

    return productDetail;
  } catch (error) {
    console.error('Exception fetching product data for PDF:', error);
    return null;
  }
}

/**
 * Generate a PDF for a product
 * 
 * @param product - The product data with related information
 * @returns jsPDF document object
 * 
 * @example
 * const product = await fetchProductForPDF('123');
 * if (product) {
 *   const pdfDoc = generateProductPDF(product);
 *   pdfDoc.save('product.pdf');
 * }
 */
export function generateProductPDF(product: ProductDetail): jsPDF {
  const doc = new jsPDF();
  
  // Set theme color - dark blue
  const themeColor = [0, 51, 102]; // Dark blue RGB
  
  // Add header
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('PRODUCT DETAILS', 20, 30);
  
  // Add product ID directly below header
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`ID: ${product.product_uid || ''}`, 20, 40);
  
  // Add date on the same line as ID but right-aligned
  const today = new Date();
  doc.text(`Date: ${formatShortDate(today)}`, 190, 40, { align: 'right' });
  
  // Add horizontal line
  doc.setDrawColor(...themeColor);
  doc.setLineWidth(0.5);
  doc.line(20, 45, 190, 45);
  
  // Add product name and description
  let yPos = 55;
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(product.vendor_product_name || product.main_new_product_name || product.main_vendor_product_name || 'Unnamed Product', 20, yPos);
  doc.setFont(undefined, 'normal');
  
  // Add product description if available
  if (product.product_description) {
    yPos += 10;
    doc.setFontSize(10);
    const splitDescription = doc.splitTextToSize(product.product_description, 170);
    doc.text(splitDescription, 20, yPos);
    yPos += splitDescription.length * 5;
  } else {
    yPos += 10;
  }
  
  // Add product details table
  const detailsData = [
    ['Category', product.category || 'N/A'],
    ['Cost', formatCurrency(Number(product.cost) || 0)],
    ['Retail Price', formatCurrency(Number(product.retail_price) || 0)],
    ['Quantity', product.total_qty_purchased?.toString() || 'N/A'],
    ['Status', product.status || 'N/A']
  ];
  
  // Add vendor information if available
  if (product.vendor && product.vendor.name) {
    detailsData.push(['Vendor', product.vendor.name]);
  }
  
  // Add SKU if available
  if (product.sku) {
    detailsData.push(['SKU', product.sku]);
  }
  
  // Add barcode if available
  if (product.barcode) {
    detailsData.push(['Barcode', product.barcode]);
  }
  
  // Define the details table styles
  const detailsTableStyles = {
    headStyles: {
      fillColor: themeColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      textColor: [50, 50, 50]
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left', cellWidth: 40 },
      1: { halign: 'left' }
    },
    margin: { top: 10, right: 20, bottom: 10, left: 20 }
  };
  
  // Add the details table
  autoTable(doc, {
    body: detailsData,
    startY: yPos,
    theme: 'grid',
    ...detailsTableStyles
  });
  
  // Get the final Y position of the details table
  let currentY = doc.lastAutoTable.finalY + 15;
  
  // Add sales history if available
  if (product.invoiceLines && product.invoiceLines.length > 0) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Sales History', 20, currentY);
    doc.setFont(undefined, 'normal');
    currentY += 10;
    
    const salesTableStyles = {
      headStyles: {
        fillColor: themeColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left'
      },
      bodyStyles: {
        textColor: [50, 50, 50]
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      margin: { top: 10, right: 20, bottom: 10, left: 20 }
    };
    
    const salesRows = product.invoiceLines.map(line => [
      formatShortDate(line.invoice ? line.invoice.invoice_order_date : 'N/A'),
      line.qty_sold?.toString() || '0',
      formatCurrency(Number(line.selling_price) || 0),
      line.invoice ? line.invoice.invoice_uid || 'N/A' : 'N/A'
    ]);
    
    autoTable(doc, {
      head: [['Date', 'Quantity', 'Price', 'Invoice']],
      body: salesRows,
      startY: currentY,
      ...salesTableStyles
    });
  }
  
  // Add notes if available
  if (product.purchase_notes) {
    currentY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Notes', 20, currentY);
    doc.setFont(undefined, 'normal');
    currentY += 7;
    doc.setFontSize(10);
    
    // Split notes into multiple lines if needed
    const splitNotes = doc.splitTextToSize(product.purchase_notes, 170);
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
 * Generate and store a product PDF
 * 
 * @param productId - The ID of the product
 * @param download - Whether to download the PDF after generation
 * @returns Promise resolving to the operation result
 * 
 * @example
 * const result = await generateAndStoreProductPDF('123', true);
 * if (result.success) {
 *   console.log('PDF URL:', result.url);
 * } else {
 *   console.error('Error:', result.error?.message);
 * }
 */
export async function generateAndStoreProductPDF(
  productId: string | any,
  download: boolean = false
): Promise<PDFOperationResult> {
  try {
    // Ensure productId is a string
    const id = typeof productId === 'object' 
      ? (productId.id || productId.glide_row_id || JSON.stringify(productId)) 
      : productId;
    
    console.log(`Generating PDF for product with ID: ${id}`);
    
    // Fetch product data
    const product = await fetchProductForPDF(id);
    
    if (!product) {
      return createPDFError(
        PDFErrorType.FETCH_ERROR,
        `Failed to fetch product with ID: ${id}`
      );
    }
    
    // Generate PDF
    const pdfDoc = generateProductPDF(product);
    
    // Convert to blob
    const pdfBlob = await new Promise<Blob>((resolve) => {
      const blob = pdfDoc.output('blob');
      resolve(blob);
    });
    
    // Generate filename
    const filename = generateFilename(
      'PROD',
      product.product_uid?.replace(/^PROD#/, '') || product.id,
      new Date()
    );
    
    // If download is requested, trigger download directly
    if (download) {
      try {
        saveAs(pdfBlob, filename);
        console.log(`PDF downloaded successfully: ${filename}`);
      } catch (downloadError) {
        console.error('Error handling product PDF download:', 
          downloadError instanceof Error 
            ? JSON.stringify({ message: downloadError.message, stack: downloadError.stack }, null, 2) 
            : String(downloadError)
        );
        // Continue even if download fails
      }
    }
    
    // Create a temporary URL for the blob
    const blobUrl = URL.createObjectURL(pdfBlob);
    
    return createPDFSuccess(blobUrl);
  } catch (error) {
    console.error('Error generating product PDF:', 
      error instanceof Error 
        ? JSON.stringify({ message: error.message, stack: error.stack }, null, 2) 
        : String(error)
    );
    return createPDFError(
      PDFErrorType.GENERATION_ERROR,
      error instanceof Error ? error.message : 'Unknown error generating product PDF'
    );
  }
}
