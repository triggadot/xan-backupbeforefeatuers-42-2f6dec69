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
export type PurchaseOrder = Database['public']['Tables']['gl_purchase_orders']['Row'];
export type Product = Database['public']['Tables']['gl_products']['Row'];
export type VendorPayment = Database['public']['Tables']['gl_vendor_payments']['Row'];

export interface PurchaseOrderLineItem {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  description: string;
  productId: string;
  product_name: string;
  new_product_name: string;
  vendor_product_name: string;
  display_name: string;
  unit_price: number;
  notes: string;
  samples: boolean;
  fronted: boolean;
  category: string;
  total_units: number;
}

export interface PurchaseOrderWithDetails extends PurchaseOrder {
  lineItems: PurchaseOrderLineItem[];
  vendorPayments: {
    id: string;
    amount: number;
    date: string;
    method: string;
    notes: string;
  }[];
  vendor?: Database['public']['Tables']['gl_accounts']['Row'];
  vendorName?: string;
  number?: string;
  date?: string;
  status?: string;
  totalUnits?: number;
  totalCost?: number;
}

/**
 * Fetch purchase order data with all related information needed for PDF generation
 * 
 * @param purchaseOrderId - The ID of the purchase order to fetch
 * @returns Promise resolving to the purchase order with all details or null if not found
 * 
 * @example
 * const poData = await fetchPurchaseOrderForPDF('123e4567-e89b-12d3-a456-426614174000');
 * if (poData) {
 *   const pdf = generatePurchaseOrderPDF(poData);
 * }
 */
export async function fetchPurchaseOrderForPDF(purchaseOrderId: string): Promise<PurchaseOrderWithDetails | null> {
  try {
    console.log(`Fetching purchase order data for PDF generation: ${purchaseOrderId}`);
    
    // Try to fetch purchase order by id first
    let { data: poData, error: poError } = await supabase
      .from('gl_purchase_orders')
      .select('*')
      .eq('id', purchaseOrderId)
      .maybeSingle();
    
    // If not found by id, try by glide_row_id
    if (!poData) {
      const { data, error } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .eq('glide_row_id', purchaseOrderId)
        .maybeSingle();
      
      poData = data;
      poError = error;
    }

    if (poError) {
      console.error('Error fetching purchase order:', poError);
      return null;
    }
    
    if (!poData) {
      console.error(`Purchase order not found with ID: ${purchaseOrderId}`);
      return null;
    }

    // Initialize purchase order with empty arrays
    const poWithDetails: PurchaseOrderWithDetails = {
      ...poData,
      lineItems: [],
      vendorPayments: [],
      number: poData.purchase_order_uid,
      date: poData.po_date,
      status: poData.payment_status || 'draft',
      total_amount: Number(poData.total_amount) || 0,
      total_paid: Number(poData.total_paid) || 0,
      balance: Number(poData.balance) || 0
    };

    // Fetch accounts (vendors)
    const { data: accountData, error: accountError } = await supabase
      .from('gl_accounts')
      .select('*');

    if (accountError) {
      console.error('Error fetching accounts:', accountError);
    } else {
      // Create lookup maps for related data
      const accountMap = new Map();
      if (accountData) {
        accountData.forEach((account: any) => {
          accountMap.set(account.glide_row_id, account);
        });
      }

      // Add vendor information
      if (poData.rowid_accounts) {
        const vendor = accountMap.get(poData.rowid_accounts);
        if (vendor) {
          poWithDetails.vendor = vendor;
          poWithDetails.vendorName = vendor.account_name;
        }
      }
    }

    // Fetch products that serve as purchase order line items
    // First try using rowid_purchase_orders
    const { data: productData1, error: productError1 } = await supabase
      .from('gl_products')
      .select('*')
      .eq('rowid_purchase_orders', poData.glide_row_id);
    
    // Also try using purchase_order_uid
    const { data: productData2, error: productError2 } = await supabase
      .from('gl_products')
      .select('*')
      .eq('purchase_order_uid', poData.purchase_order_uid);
    
    // Combine results, removing duplicates
    let productData: any[] = [];
    if (productData1) {
      productData = [...productData1];
    }
    
    if (productData2) {
      // Add products from second query that aren't already in the result
      productData2.forEach(product => {
        if (!productData.some(p => p.id === product.id)) {
          productData.push(product);
        }
      });
    }

    if (productError1 && productError2) {
      console.error('Error fetching products:', productError1);
    } else {
      // Process line items (products)
      if (productData && productData.length > 0) {
        productData.forEach((product: any) => {
          const hasVendorProductName = 'vendor_product_name' in product;
          
          const lineItem: PurchaseOrderLineItem = {
            id: product.id,
            quantity: Number(product.total_qty_purchased) || 0,
            unitPrice: Number(product.cost) || 0,
            total: (Number(product.total_qty_purchased) || 0) * (Number(product.cost) || 0),
            description: product.purchase_notes || '',
            productId: product.glide_row_id,
            product_name: product.new_product_name || 'Unnamed Product',
            new_product_name: product.new_product_name || '',
            vendor_product_name: hasVendorProductName ? product.vendor_product_name || '' : '',
            display_name: product.display_name || product.new_product_name || product.vendor_product_name || 'Unnamed Product',
            unit_price: Number(product.cost) || 0,
            notes: product.purchase_notes || '',
            samples: product.samples || false,
            fronted: product.fronted || false,
            category: product.category || '',
            total_units: Number(product.total_qty_purchased) || 0
          };
          
          poWithDetails.lineItems.push(lineItem);
        });
      }
    }

    // Fetch vendor payments
    const { data: paymentData, error: paymentError } = await supabase
      .from('gl_vendor_payments')
      .select('*')
      .eq('rowid_purchase_orders', poData.glide_row_id);

    if (paymentError) {
      console.error('Error fetching vendor payments:', paymentError);
    } else {
      // Process payments
      poWithDetails.vendorPayments = paymentData ? paymentData.map((payment: any) => ({
        id: payment.id,
        amount: Number(payment.payment_amount) || 0,
        date: payment.date_of_payment,
        method: payment.payment_method || '',
        notes: payment.vendor_purchase_note || ''
      })) : [];
    }

    // Calculate totals
    poWithDetails.totalUnits = poWithDetails.lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    poWithDetails.totalCost = poWithDetails.lineItems.reduce((sum, item) => sum + (item.total || 0), 0);

    return poWithDetails;
  } catch (error) {
    console.error('Exception fetching purchase order data for PDF:', error);
    return null;
  }
}

/**
 * Generate a PDF for a purchase order
 * 
 * @param purchaseOrder - The purchase order data with related vendor and line items
 * @returns jsPDF document object
 * 
 * @example
 * const po = await fetchPurchaseOrderForPDF('123');
 * if (po) {
 *   const pdfDoc = generatePurchaseOrderPDF(po);
 * }
 */
export function generatePurchaseOrderPDF(purchaseOrder: PurchaseOrderWithDetails): jsPDF {
  const doc = new jsPDF();
  
  // Set theme color - dark blue
  const themeColor = [0, 51, 102]; // Dark blue RGB
  
  // Add header
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('PURCHASE ORDER', 20, 30);
  
  // Add PO ID directly below header
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`ID: ${purchaseOrder.purchase_order_uid || ''}`, 20, 40);
  
  // Add date on the same line as ID but right-aligned
  doc.text(`Date: ${formatShortDate(purchaseOrder.po_date || new Date())}`, 190, 40, { align: 'right' });
  
  // Add horizontal line
  doc.setDrawColor(...themeColor);
  doc.setLineWidth(0.5);
  doc.line(20, 45, 190, 45);
  
  // Add vendor details if available
  let yPos = 55;
  if (purchaseOrder.vendor) {
    doc.setFontSize(11);
    doc.text(purchaseOrder.vendor.account_name || 'N/A', 20, yPos);
    yPos += 5;
    
    if (purchaseOrder.vendor.address_line_1) {
      doc.setFontSize(10);
      doc.text(purchaseOrder.vendor.address_line_1, 20, yPos);
      yPos += 5;
    }
    
    if (purchaseOrder.vendor.address_line_2) {
      doc.text(purchaseOrder.vendor.address_line_2, 20, yPos);
      yPos += 5;
    }
    
    const cityStateZip = [
      purchaseOrder.vendor.city,
      purchaseOrder.vendor.state,
      purchaseOrder.vendor.postal_code
    ].filter(Boolean).join(', ');
    
    if (cityStateZip) {
      doc.text(cityStateZip, 20, yPos);
      yPos += 5;
    }
    
    if (purchaseOrder.vendor.country) {
      doc.text(purchaseOrder.vendor.country, 20, yPos);
      yPos += 5;
    }
  }
  
  // Define the table styles with better alignment
  const tableStyles = {
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
      0: { halign: 'left' },    // Product name
      1: { halign: 'center' },  // Quantity
      2: { halign: 'right' },   // Unit price
      3: { halign: 'right' }    // Total
    },
    margin: { top: 10, right: 20, bottom: 10, left: 20 }
  };
  
  // Map purchase order lines to table rows
  const rows = purchaseOrder.lineItems?.map(line => {
    const productName = line.vendor_product_name || line.new_product_name || 'N/A';
    const quantity = line.quantity || line.total_qty_purchased || 0;
    const unitCost = line.unit_price || line.cost || 0;
    const total = line.line_total || (quantity * unitCost) || 0;
    
    return [
      productName,
      quantity,
      formatCurrency(unitCost),
      formatCurrency(total)
    ];
  }) || [];
  
  // Add the items table to the document
  autoTable(doc, {
    head: [['Product', 'Qty', 'Price', 'Total']],
    body: rows,
    startY: 70,
    ...tableStyles
  });
  
  // Get the final Y position of the table
  const finalY = doc.lastAutoTable.finalY;
  
  // Add totals section with reduced spacing and bold text for key figures
  doc.setFontSize(11);
  let currentY = finalY + 10;
  
  doc.text(`Subtotal:`, 150, currentY, { align: 'right' });
  doc.setFont(undefined, 'bold');
  doc.text(formatCurrency(purchaseOrder.subtotal || 0), 190, currentY, { align: 'right' });
  doc.setFont(undefined, 'normal');
  
  if (purchaseOrder.tax_rate && purchaseOrder.tax_rate > 0) {
    currentY += 7;
    doc.text(`Tax (${purchaseOrder.tax_rate}%):`, 150, currentY, { align: 'right' });
    doc.setFont(undefined, 'bold');
    doc.text(formatCurrency(purchaseOrder.tax_amount || 0), 190, currentY, { align: 'right' });
    doc.setFont(undefined, 'normal');
  }
  
  currentY += 7;
  doc.text(`Total:`, 150, currentY, { align: 'right' });
  doc.setFont(undefined, 'bold');
  doc.text(formatCurrency(purchaseOrder.total || 0), 190, currentY, { align: 'right' });
  doc.setFont(undefined, 'normal');
  
  // Add payment details if available
  if (purchaseOrder.vendorPayments && purchaseOrder.vendorPayments.length > 0) {
    currentY += 15;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Payment History', 20, currentY);
    doc.setFont(undefined, 'normal');
    currentY += 7;
    
    const paymentRows = purchaseOrder.vendorPayments.map(payment => [
      formatShortDate(payment.date),
      payment.method || '',
      formatCurrency(payment.amount || 0),
      payment.notes || ''
    ]);
    
    autoTable(doc, {
      head: [['Date', 'Method', 'Amount', 'Notes']],
      body: paymentRows,
      startY: currentY,
      ...{
        ...tableStyles,
        margin: { top: 10, right: 20, bottom: 10, left: 20 }
      }
    });
    
    currentY = doc.lastAutoTable.finalY + 10;
  }
  
  // Add payment status
  if (purchaseOrder.payment_status) {
    doc.setFontSize(11);
    doc.text(`Payment Status: ${purchaseOrder.payment_status}`, 20, currentY);
  }
  
  // Add notes if available with reduced spacing
  if (purchaseOrder.po_notes) {
    currentY += 15;
    doc.setFontSize(11);
    doc.text('Notes:', 20, currentY);
    currentY += 7;
    doc.setFontSize(10);
    
    // Split notes into multiple lines if needed
    const splitNotes = doc.splitTextToSize(purchaseOrder.po_notes, 170);
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
 * Generate and store a purchase order PDF
 * 
 * @param purchaseOrderId - The ID of the purchase order
 * @param download - Whether to download the PDF after generation
 * @returns Promise resolving to the operation result
 * 
 * @example
 * const result = await generateAndStorePurchaseOrderPDF('123', true);
 * if (result.success) {
 *   console.log('PDF URL:', result.url);
 * } else {
 *   console.error('Error:', result.error?.message);
 * }
 */
export async function generateAndStorePurchaseOrderPDF(
  purchaseOrderId: string | any,
  download: boolean = false
): Promise<PDFOperationResult> {
  try {
    // Ensure purchaseOrderId is a string
    const id = typeof purchaseOrderId === 'object' 
      ? (purchaseOrderId.id || purchaseOrderId.glide_row_id || JSON.stringify(purchaseOrderId)) 
      : purchaseOrderId;
    
    console.log(`Generating PDF for purchase order with ID: ${id}`);
    
    // Fetch purchase order data
    const purchaseOrder = await fetchPurchaseOrderForPDF(id);
    
    if (!purchaseOrder) {
      return createPDFError(
        PDFErrorType.FETCH_ERROR,
        `Failed to fetch purchase order with ID: ${id}`
      );
    }
    
    // Generate PDF
    const pdfDoc = generatePurchaseOrderPDF(purchaseOrder);
    
    // Convert to blob
    const pdfBlob = await new Promise<Blob>((resolve) => {
      const blob = pdfDoc.output('blob');
      resolve(blob);
    });
    
    // Generate filename
    const filename = generateFilename(
      'PO',
      purchaseOrder.purchase_order_uid?.replace(/^PO#/, '') || purchaseOrder.id,
      purchaseOrder.po_date || new Date()
    );
    
    // If download is requested, trigger download directly
    if (download) {
      try {
        saveAs(pdfBlob, filename);
        console.log(`PDF downloaded successfully: ${filename}`);
      } catch (downloadError) {
        console.error('Error handling purchaseOrder PDF download:', 
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
    console.error('Error generating purchase order PDF:', 
      error instanceof Error 
        ? JSON.stringify({ message: error.message, stack: error.stack }, null, 2) 
        : String(error)
    );
    return createPDFError(
      PDFErrorType.GENERATION_ERROR,
      error instanceof Error ? error.message : 'Unknown error generating purchase order PDF'
    );
  }
}
