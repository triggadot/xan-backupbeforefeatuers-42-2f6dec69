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
export type Estimate = Database['public']['Tables']['gl_estimates']['Row'];
export type EstimateLine = Database['public']['Tables']['gl_estimate_lines']['Row'] & {
  productDetails?: Database['public']['Tables']['gl_products']['Row'];
};
export type Credit = Database['public']['Tables']['gl_customer_credits']['Row'];

export interface EstimateWithDetails extends Estimate {
  estimateLines: EstimateLine[];
  credits: Credit[];
  account?: Database['public']['Tables']['gl_accounts']['Row'];
}

/**
 * Fetch estimate data with all related information needed for PDF generation
 * 
 * @param estimateId - The ID of the estimate to fetch
 * @returns Promise resolving to the estimate with all details or null if not found
 * 
 * @example
 * const estimateData = await fetchEstimateForPDF('123e4567-e89b-12d3-a456-426614174000');
 * if (estimateData) {
 *   const pdf = generateEstimatePDF(estimateData);
 * }
 */
export async function fetchEstimateForPDF(estimateId: string): Promise<EstimateWithDetails | null> {
  try {
    console.log(`Fetching estimate data for PDF generation: ${estimateId}`);
    
    // Try to fetch estimate by id first
    let { data: estimateData, error: estimateError } = await supabase
      .from('gl_estimates')
      .select('*')
      .eq('id', estimateId)
      .maybeSingle();
    
    // If not found by id, try by glide_row_id
    if (!estimateData) {
      const { data, error } = await supabase
        .from('gl_estimates')
        .select('*')
        .eq('glide_row_id', estimateId)
        .maybeSingle();
      
      estimateData = data;
      estimateError = error;
    }

    if (estimateError) {
      console.error('Error fetching estimate:', estimateError);
      return null;
    }
    
    if (!estimateData) {
      console.error(`Estimate not found with ID: ${estimateId}`);
      return null;
    }

    // Initialize estimate with empty arrays
    const estimateWithDetails: EstimateWithDetails = {
      ...estimateData,
      estimateLines: [],
      credits: []
    };

    // Fetch account information if rowid_accounts is available
    if (estimateData.rowid_accounts) {
      const { data: accountData, error: accountError } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('glide_row_id', estimateData.rowid_accounts)
        .single();

      if (accountError) {
        console.error('Error fetching account:', accountError);
        // We'll still proceed with the estimate, just without account info
      } else if (accountData) {
        // Add account info to the estimate
        estimateWithDetails.account = accountData;
      }
    }

    // Fetch estimate line items using glide_row_id relationship
    const { data: linesData, error: linesError } = await supabase
      .from('gl_estimate_lines')
      .select('*')
      .eq('rowid_estimates', estimateData.glide_row_id);

    if (linesError) {
      console.error('Error fetching estimate lines:', linesError);
      // We'll still proceed with the estimate, just without line items
    } else if (linesData && linesData.length > 0) {
      // Fetch product details for each line
      const lineItems = await Promise.all(
        linesData.map(async (line) => {
          if (line.rowid_products) {
            const { data: productData, error: productError } = await supabase
              .from('gl_products')
              .select('*')
              .eq('glide_row_id', line.rowid_products)
              .single();

            if (productError) {
              console.error('Error fetching product:', productError);
              return {
                ...line,
                qty: Number(line.qty) || 0,
                price: Number(line.price) || 0,
                line_total: Number(line.line_total) || 0
              };
            }

            return {
              ...line,
              qty: Number(line.qty) || 0,
              price: Number(line.price) || 0,
              line_total: Number(line.line_total) || 0,
              productDetails: productData
            };
          }
          return {
            ...line,
            qty: Number(line.qty) || 0,
            price: Number(line.price) || 0,
            line_total: Number(line.line_total) || 0
          };
        })
      );

      estimateWithDetails.estimateLines = lineItems;
    }

    // Fetch credits
    const { data: creditData, error: creditError } = await supabase
      .from('gl_customer_credits')
      .select('*')
      .eq('rowid_estimates', estimateData.glide_row_id);

    if (creditError) {
      console.error('Error fetching credits:', creditError);
      // We'll still proceed with the estimate, just without credits
    } else if (creditData) {
      estimateWithDetails.credits = creditData;
    }

    return estimateWithDetails;
  } catch (error) {
    console.error('Exception fetching estimate data for PDF:', error);
    return null;
  }
}

// Define a more specific type for the estimateId parameter
type EstimateIdInput = string | { id?: string; glide_row_id?: string };

/**
 * Generate and store an estimate PDF
 * 
 * @param estimate - The estimate data with related account and line items
 * @returns jsPDF document object
 * 
 * @example
 * const estimate = await fetchEstimateForPDF('123');
 * if (estimate) {
 *   const pdfDoc = generateEstimatePDF(estimate);
 *   pdfDoc.save('estimate.pdf');
 * }
 */
export function generateEstimatePDF(estimate: EstimateWithDetails): jsPDF {
  const doc = new jsPDF({
    compress: true, 
    putOnlyUsedFonts: true
  });
  
  // Set theme color - dark blue
  const themeColor = [0, 51, 102]; // Dark blue RGB
  
  // Add header
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTIMATE', 15, 20);
  
  // Add estimate ID and date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${estimate.estimate_uid || ''}`, 15, 28);
  doc.text(`Date: ${formatShortDate(estimate.estimate_date || new Date())}`, 195, 28, { align: 'right' });
  
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
      fillColor: themeColor,
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
      0: { halign: 'left' },    // Product name
      1: { halign: 'center' },  // Quantity
      2: { halign: 'right' },   // Unit price
      3: { halign: 'right' }    // Total
    },
    head: [
      [
        { content: 'Product', styles: { halign: 'left' } },
        { content: 'Qty', styles: { halign: 'center' } },
        { content: 'Price', styles: { halign: 'right' } },
        { content: 'Total', styles: { halign: 'right' } }
      ]
    ],
    margin: { top: 10, right: 20, bottom: 10, left: 20 }
  };
  
  // Map estimate products to table rows
  const rows = estimate.estimateLines?.map(line => {
    const productName = line.sale_product_name || 
      line.product_name_display || 
      line.product_name || 
      (line.productDetails?.vendor_product_name || 
       line.productDetails?.main_new_product_name || 
       line.productDetails?.main_vendor_product_name || 
       'Product Description');
    
    // Match the same fields used in EstimateDetailView
    const quantity = Math.round(Number(line.qty_sold) || Number(line.qty) || 0);
    const unitPrice = Number(line.selling_price) || Number(line.price) || 0;
    const lineTotal = Number(line.line_total) || (quantity * unitPrice);
    
    return [
      productName,
      quantity,
      formatCurrency(unitPrice),
      formatCurrency(lineTotal)
    ];
  }) || [];
  
  // Add the items table to the document
  autoTable(doc, {
    ...tableStyles,
    body: rows,
    startY: tableStartY,
  });
  
  // Get the final Y position of the table
  const finalY = doc.lastAutoTable.finalY;
  
  // Add totals section with reduced spacing and bold text for key figures
  doc.setFontSize(11);
  let currentY = finalY + 10;
  
  // Calculate totals
  const totalQuantity = estimate.estimateLines?.reduce((total, line) => 
    total + (Math.round(Number(line.qty_sold) || Number(line.qty) || 0)), 0) || 0;
    
  const subtotal = estimate.total_amount || 
    estimate.estimateLines?.reduce((total, line) => 
      total + (Number(line.line_total) || 
      (Number(line.qty_sold) || Number(line.qty) || 0) * 
      (Number(line.selling_price) || Number(line.price) || 0)), 0) || 0;

  const creditsApplied = estimate.total_credits || 
    estimate.credits?.reduce((total, credit) => 
      total + (Number(credit.amount) || 0), 0) || 0;

  const balanceDue = estimate.balance || (subtotal - creditsApplied);
  
  doc.text(`Subtotal (${totalQuantity} item${totalQuantity === 1 ? '' : 's'}):`, 150, currentY, { align: 'right' });
  doc.setFont(undefined, 'bold');
  doc.text(formatCurrency(subtotal), 190, currentY, { align: 'right' });
  doc.setFont(undefined, 'normal');
  
  if (estimate.tax_rate && estimate.tax_rate > 0) {
    currentY += 7;
    doc.text(`Tax (${(estimate.tax_rate * 100).toFixed(2)}%):`, 150, currentY, { align: 'right' });
    doc.setFont(undefined, 'bold');
    doc.text(formatCurrency(estimate.tax_amount || (estimate.subtotal || 0) * (estimate.tax_rate || 0)), 190, currentY, { align: 'right' });
    doc.setFont(undefined, 'normal');
  }
  
  if (estimate.credits && estimate.credits.length > 0) {
    currentY += 7;
    doc.text(`Credit(s) Applied:`, 150, currentY, { align: 'right' });
    doc.setFont(undefined, 'bold');
    doc.text(formatCurrency(creditsApplied), 190, currentY, { align: 'right' });
    doc.setFont(undefined, 'normal');
  }
  
  currentY += 7;
  doc.text(`Balance Due:`, 150, currentY, { align: 'right' });
  doc.setFont(undefined, 'bold');
  doc.text(formatCurrency(balanceDue), 190, currentY, { align: 'right' });
  doc.setFont(undefined, 'normal');
  
  // Add notes if available with reduced spacing
  if (estimate.notes) {
    currentY += 15;
    doc.setFontSize(11);
    doc.text('Notes:', 20, currentY);
    currentY += 7;
    doc.setFontSize(10);
    
    // Split notes into multiple lines if needed
    const splitNotes = doc.splitTextToSize(estimate.notes, 170);
    doc.text(splitNotes, 20, currentY);
  }
  
  // Add terms if available with reduced spacing
  if (estimate.terms) {
    currentY += 15;
    doc.setFontSize(11);
    doc.text('Terms & Conditions:', 20, currentY);
    currentY += 7;
    doc.setFontSize(10);
    
    // Split terms into multiple lines if needed
    const splitTerms = doc.splitTextToSize(estimate.terms, 170);
    doc.text(splitTerms, 20, currentY);
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
 * Generate and store an estimate PDF
 * 
 * @param estimateId - The ID of the estimate
 * @param download - Whether to download the PDF after generation
 * @returns Promise resolving to the operation result
 * 
 * @example
 * const result = await generateAndStoreEstimatePDF('123', true);
 * if (result.success) {
 *   console.log('PDF URL:', result.url);
 * } else {
 *   console.error('Error:', result.error?.message);
 * }
 */
export async function generateAndStoreEstimatePDF(
  estimateId: EstimateIdInput, // Use the specific type
  download: boolean = false
): Promise<PDFOperationResult> {
  try {
    // Ensure estimateId is a string
    const id = typeof estimateId === 'object' 
      ? (estimateId.id || estimateId.glide_row_id || JSON.stringify(estimateId)) 
      : estimateId;
    
    console.log(`Generating PDF for estimate with ID: ${id}`);
    
    // Fetch estimate data
    const estimate = await fetchEstimateForPDF(id);
    
    if (!estimate) {
      return createPDFError(
        PDFErrorType.FETCH_ERROR,
        `Failed to fetch estimate with ID: ${id}`
      );
    }
    
    // Generate PDF
    const pdfDoc = generateEstimatePDF(estimate);
    
    // Convert to blob
    const pdfBlob = await new Promise<Blob>((resolve) => {
      const blob = pdfDoc.output('blob');
      resolve(blob);
    });
    
    // Generate filename
    const filename = generateFilename(
      'EST',
      estimate.estimate_uid?.replace(/^EST#/, '') || estimate.id,
      estimate.estimate_date || new Date()
    );
    
    // If download is requested, trigger download directly
    if (download) {
      try {
        saveAs(pdfBlob, filename);
        console.log(`PDF downloaded successfully: ${filename}`);

        // --- Start Background Storage ---
        // Asynchronously store the PDF in Supabase after download starts
        const storePdfInBackground = async () => {
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

            // Invoke the Edge Function
            console.log(`Invoking store-pdf for estimate ID: ${estimate.id}`);
            const { error: functionError } = await supabase.functions.invoke('store-pdf', {
              body: JSON.stringify({ // Ensure body is stringified JSON
                id: estimate.id, // Use the actual estimate ID (uuid)
                type: 'estimate',
                pdfData: base64Data,
                fileName: filename,
              }),
            });

            if (functionError) {
              console.error(`Error calling store-pdf function for estimate ${estimate.id}:`, functionError);
            } else {
              console.log(`Successfully triggered background storage for estimate ${estimate.id}`);
            }
          } catch (bgError) {
            console.error(`Error during background PDF storage for estimate ${estimate.id}:`, bgError);
          }
        };

        storePdfInBackground(); // Fire and forget
        // --- End Background Storage ---

      } catch (downloadError) {
        console.error('Error handling estimate PDF download:', 
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
    console.error('Error generating estimate PDF:', 
      error instanceof Error 
        ? JSON.stringify({ message: error.message, stack: error.stack }, null, 2) 
        : String(error)
    );
    return createPDFError(
      PDFErrorType.GENERATION_ERROR,
      error instanceof Error ? error.message : 'Unknown error generating estimate PDF'
    );
  }
}
