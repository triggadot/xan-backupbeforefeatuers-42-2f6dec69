import jsPDF from 'jspdf';
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
import { storePDF } from '../pdf-storage';
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
 *   pdfDoc.save('purchase-order.pdf');
 * }
 */
export function generatePurchaseOrderPDF(purchaseOrder: PurchaseOrderWithDetails): jsPDF {
  const doc = new jsPDF();
  
  // Add letterhead
  addLetterhead(doc, 'PURCHASE ORDER');
  
  // Add purchase order details
  doc.setFontSize(12);
  doc.text(`PO #: ${purchaseOrder.purchase_order_uid || 'N/A'}`, 20, 45);
  doc.text(`Date: ${formatShortDate(purchaseOrder.po_date)}`, 150, 45, { align: 'right' });
  
  // Add vendor details
  if (purchaseOrder.vendor) {
    addAccountDetails(doc, 'Vendor:', purchaseOrder.vendor, 60);
  }
  
  // Define the table styles
  const tableStyles = createTableStyles();
  
  // Map purchase order products to table rows
  const rows = purchaseOrder.lineItems?.map(item => [
    item.display_name,
    item.quantity,
    formatCurrency(item.unitPrice),
    formatCurrency(item.total)
  ]) || [];
  
  // Add the items table to the document
  (doc as any).autoTable({
    head: [['Product', 'Quantity', 'Unit Price', 'Total']],
    body: rows,
    startY: 80,
    ...tableStyles
  });
  
  // Get the final Y position of the table
  const finalY = (doc as any).autoTable.previous.finalY;
  
  // Add totals section
  doc.setFontSize(11);
  let currentY = finalY + 15;
  
  doc.text(`Total:`, 150, currentY, { align: 'right' });
  doc.text(formatCurrency(purchaseOrder.total_amount || purchaseOrder.totalCost || 0), 190, currentY, { align: 'right' });
  
  // Add payment information if available
  if (purchaseOrder.vendorPayments && purchaseOrder.vendorPayments.length > 0) {
    currentY += 20;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Payment Information', 20, currentY);
    doc.setFont(undefined, 'normal');
    
    currentY += 10;
    doc.setFontSize(10);
    
    // Add payment table
    const paymentRows = purchaseOrder.vendorPayments.map(payment => [
      formatShortDate(payment.date),
      payment.method,
      formatCurrency(payment.amount),
      payment.notes || ''
    ]);
    
    (doc as any).autoTable({
      head: [['Date', 'Method', 'Amount', 'Notes']],
      body: paymentRows,
      startY: currentY,
      ...tableStyles,
      headStyles: {
        ...tableStyles.headStyles,
        fillColor: [60, 60, 60] // Darker gray for payment table header
      }
    });
    
    currentY = (doc as any).autoTable.previous.finalY + 10;
  }
  
  // Add payment status
  currentY += 10;
  doc.setFontSize(11);
  doc.text(`Paid:`, 150, currentY, { align: 'right' });
  doc.text(formatCurrency(purchaseOrder.total_paid || 0), 190, currentY, { align: 'right' });
  
  currentY += 10;
  doc.text(`Balance:`, 150, currentY, { align: 'right' });
  doc.text(formatCurrency(purchaseOrder.balance || 0), 190, currentY, { align: 'right' });
  
  // Add notes if available
  if (purchaseOrder.po_notes) {
    currentY += 20;
    doc.setFontSize(11);
    doc.text('Notes:', 20, currentY);
    currentY += 10;
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
    
    // Store PDF using edge function
    const storageResult = await storePDF(pdfBlob, 'purchaseOrder', purchaseOrder.id, filename);
    
    if (!storageResult.success) {
      return createPDFError(
        PDFErrorType.STORAGE_ERROR,
        `Failed to store purchase order PDF: ${storageResult.message}`
      );
    }
    
    // If download is requested and we have a URL, trigger download
    if (download && storageResult.url) {
      try {
        // Use file-saver library instead of creating a temporary link
        const response = await fetch(storageResult.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        saveAs(blob, filename);
        console.log(`PDF downloaded successfully: ${filename}`);
      } catch (downloadError) {
        console.error('Error handling purchaseOrder PDF download:', downloadError);
        // Continue even if download fails
      }
    }
    
    return createPDFSuccess(storageResult.url!);
  } catch (error) {
    console.error('Error generating purchase order PDF:', error);
    return createPDFError(
      PDFErrorType.GENERATION_ERROR,
      error instanceof Error ? error.message : 'Unknown error generating purchase order PDF'
    );
  }
}
