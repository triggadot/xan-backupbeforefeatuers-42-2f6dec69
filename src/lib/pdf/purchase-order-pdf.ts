/**
 * @deprecated This client-side PDF generation is deprecated.
 * Please use the triggerPDFGeneration function from pdf-utils.ts instead,
 * which leverages the standardized pdf-backend edge function.
 * 
 * Example:
 * ```typescript
 * import { triggerPDFGeneration } from '@/lib/pdf-utils';
 * const pdfUrl = await triggerPDFGeneration('purchaseOrder', purchaseOrderData);
 * ```
 * 
 * See /supabase/functions/pdf-backend/README.md for complete documentation.
 */

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
    // Specify type for productData
    let productData: Database['public']['Tables']['gl_products']['Row'][] = [];
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
        // Specify type for product in forEach
        productData.forEach((product: Database['public']['Tables']['gl_products']['Row']) => {
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
      // Specify type for payment in map
      poWithDetails.vendorPayments = paymentData ? paymentData.map((payment: Database['public']['Tables']['gl_vendor_payments']['Row']) => ({
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

// Define a more specific type for the purchaseOrderId parameter
type PurchaseOrderIdInput = string | { id?: string; glide_row_id?: string };

/**
 * Generate and store a purchase order PDF
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
  const doc = new jsPDF({
    compress: true, 
    putOnlyUsedFonts: true
  });
  
  // Set theme color - dark blue
  const themeColor = [0, 51, 102]; // Dark blue RGB
  
  // Add header
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('PURCHASE ORDER', 15, 20);
  
  // Add PO ID and date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${purchaseOrder.purchase_order_uid || ''}`, 15, 28);
  doc.text(`Date: ${formatShortDate(purchaseOrder.po_date || new Date())}`, 195, 28, { align: 'right' });
  
  // Add horizontal line
  doc.setDrawColor(...themeColor);
  doc.setLineWidth(1.5);
  doc.line(15, 32, 195, 32);
  
  // Start product table immediately after the header
  const tableStartY = 45;
  
  // Define the table styles with better alignment
  const tableStyles = {
    theme: 'striped',
    headStyles: {
      fillColor: [0, 51, 102],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left' // Default alignment for headers
    },
    bodyStyles: {
      textColor: [50, 50, 50]
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0: { halign: 'left' },   // Product name left-aligned
      1: { halign: 'center' }, // Quantity center-aligned
      2: { halign: 'right' },  // Price right-aligned
      3: { halign: 'right' }   // Total right-aligned
    },
    head: [
      [
        { content: 'Product', styles: { halign: 'left' } },
        { content: 'Qty', styles: { halign: 'center' } },
        { content: 'Price', styles: { halign: 'right' } },
        { content: 'Total', styles: { halign: 'right' } }
      ]
    ],
    body: purchaseOrder.lineItems?.map(line => {
      // Use the same display name logic as in the detail view component
      const productName = line.display_name || line.new_product_name || line.vendor_product_name || 'Unnamed Product';
      const quantity = line.quantity || line.total_qty_purchased || 0;
      const unitCost = line.unit_price || line.cost || 0;
      const total = line.line_total || (quantity * unitCost) || 0;
      
      return [
        productName,
        quantity,
        formatCurrency(unitCost),
        formatCurrency(total)
      ];
    }) || [],
    startY: tableStartY
  };
  
  // Add the items table to the document
  autoTable(doc, tableStyles);
  
  // Get the final Y position of the table
  const finalY = doc.lastAutoTable.finalY;
  
  // Calculate totals correctly
  const totalQuantity = purchaseOrder.lineItems?.reduce((sum, item) => {
    const quantity = Math.round(Number(item.quantity) || Number(item.total_qty_purchased) || 0);
    return sum + quantity;
  }, 0) || 0;

  const subtotal = purchaseOrder.subtotal || purchaseOrder.lineItems?.reduce((sum, item) => {
    const quantity = item.quantity || item.total_qty_purchased || 0;
    const unitCost = item.unit_price || item.cost || 0;
    return sum + (quantity * unitCost);
  }, 0) || 0;
  
  // Calculate total payments
  const totalPayments = purchaseOrder.vendorPayments?.reduce((sum, payment) => {
    return sum + (payment.amount || 0);
  }, 0) || 0;
  
  // Add totals section with reduced spacing and bold text for key figures
  doc.setFontSize(11);
  let currentYPos = finalY + 10;
  
  doc.text(`Subtotal (${totalQuantity} item${totalQuantity === 1 ? '' : 's'}):`, 150, currentYPos, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(subtotal), 190, currentYPos, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  
  if (purchaseOrder.tax_rate && purchaseOrder.tax_rate > 0) {
    currentYPos += 7;
    doc.text(`Tax (${purchaseOrder.tax_rate}%):`, 150, currentYPos, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(purchaseOrder.tax_amount || 0), 190, currentYPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  }
  
  // Add total paid on first page
  currentYPos += 7;
  doc.text(`Total Paid:`, 150, currentYPos, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(purchaseOrder.total_paid || totalPayments), 190, currentYPos, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  
  // Add balance
  currentYPos += 7;
  doc.text(`Balance:`, 150, currentYPos, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  
  // Calculate balance as total minus payments, using the same fields as in the detail view
  const total = purchaseOrder.total_amount || purchaseOrder.total || subtotal + (purchaseOrder.tax_amount || 0);
  const balance = purchaseOrder.balance || (total - (purchaseOrder.total_paid || totalPayments));
  
  doc.text(formatCurrency(balance), 190, currentYPos, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  
  // Add payment details on a new page if available
  if (purchaseOrder.vendorPayments && purchaseOrder.vendorPayments.length > 0) {
    // Add a new page for payment history
    doc.addPage();
    
    // Add header to the new page
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('PURCHASE ORDER', 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${purchaseOrder.purchase_order_uid || ''}`, 15, 28);
    doc.text(`Date: ${formatShortDate(purchaseOrder.po_date || new Date())}`, 195, 28, { align: 'right' });
    
    // Add horizontal line
    doc.setDrawColor(...themeColor);
    doc.setLineWidth(1.5);
    doc.line(15, 32, 195, 32);
    
    // Payment history title
    currentYPos = 50;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment History', 15, currentYPos);
    doc.setFont('helvetica', 'normal');
    currentYPos += 10;
    
    const paymentRows = purchaseOrder.vendorPayments.map(payment => [
      formatShortDate(payment.date),
      payment.method || '',
      formatCurrency(payment.amount || 0),
      payment.notes || ''
    ]);
    
    const paymentTableStyles = {
      theme: 'striped',
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left' // Default alignment for headers
      },
      bodyStyles: {
        textColor: [50, 50, 50]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { halign: 'left' },   // Date left-aligned
        1: { halign: 'left' },   // Method left-aligned
        2: { halign: 'right' },  // Amount right-aligned
        3: { halign: 'left' }    // Notes left-aligned
      },
      head: [
        [
          { content: 'Date', styles: { halign: 'left' } },
          { content: 'Method', styles: { halign: 'left' } },
          { content: 'Amount', styles: { halign: 'right' } },
          { content: 'Notes', styles: { halign: 'left' } }
        ]
      ],
      body: paymentRows,
      startY: currentYPos
    };
    
    // Add the payment history table
    autoTable(doc, paymentTableStyles);
    
    // Add total payments after the payment history table
    const paymentTableFinalY = doc.lastAutoTable.finalY;
    currentYPos = paymentTableFinalY + 10;
    
    doc.text(`Total Paid:`, 150, currentYPos, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(purchaseOrder.total_paid || totalPayments), 190, currentYPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  }
  
  // Add notes if available with reduced spacing
  if (purchaseOrder.po_notes) {
    currentYPos += 15;
    doc.setFontSize(11);
    doc.text('Notes:', 20, currentYPos);
    currentYPos += 7;
    doc.setFontSize(10);
    
    // Split notes into multiple lines if needed
    const splitNotes = doc.splitTextToSize(purchaseOrder.po_notes, 170);
    doc.text(splitNotes, 20, currentYPos);
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
 * Generate, save locally, and upload a purchase order PDF to Supabase storage
 * 
 * @param purchaseOrderId - The ID of the purchase order
 * @param download - Whether to download the PDF after generation
 * @returns Promise resolving to the operation result
 */
export async function generateAndStorePurchaseOrderPDF(
  purchaseOrderId: PurchaseOrderIdInput,
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
    
    // Use the Supabase-generated purchase_order_uid directly for the filename
    const filename = purchaseOrder.purchase_order_uid 
      ? `${purchaseOrder.purchase_order_uid}.pdf`
      : generateFilename('PO', purchaseOrder.id);
    
    // First store the PDF in Supabase regardless of download option
    try {
      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string)?.split(',')[1];
          if (base64String) {
            resolve(base64String);
          } else {
            reject(new Error('Failed to read blob as base64'));
          }
        };
        reader.onerror = (error) => reject(error);
      });

      // Invoke the correct Edge Function
      console.log(`Invoking store-pdf for purchase order ID: ${purchaseOrder.id}`);
      const { data: storageData, error: functionError } = await supabase.functions.invoke('store-pdf', {
        body: JSON.stringify({
          documentType: 'purchase-order',
          documentId: purchaseOrder.id,
          pdfBase64: base64Data,
          fileName: filename,
        }),
      });

      if (functionError) {
        console.error(`Error calling store-pdf function for purchase order ${purchaseOrder.id}:`, functionError);
      } else {
        console.log(`Successfully stored PDF for purchase order ${purchaseOrder.id}`, storageData);
        
        // Update database with PDF URL if available from storage function
        if (storageData?.url) {
          const { error: updateError } = await supabase
            .from('gl_purchase_orders')
            .update({ supabase_pdf_url: storageData.url })
            .eq('id', purchaseOrder.id);
            
          if (updateError) {
            console.error(`Error updating purchase order with PDF URL: ${updateError.message}`);
          }
        }
      }
      
      // Handle download separately after attempting storage
      if (download) {
        try {
          saveAs(pdfBlob, filename);
          console.log(`PDF downloaded successfully: ${filename}`);
        } catch (dlError) {
          console.error('Download error:', dlError);
        }
      }
    } catch (storageError) {
      console.error(`Error during PDF storage for purchase order ${purchaseOrder.id}:`, storageError);
      
      // If storage fails but download was requested, still try to download
      if (download) {
        try {
          saveAs(pdfBlob, filename);
          console.log(`PDF downloaded successfully despite storage error: ${filename}`);
        } catch (dlError) {
          console.error('Download error after storage failure:', dlError);
        }
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
