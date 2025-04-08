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

/**
 * Generate a PDF for an estimate
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
  const doc = new jsPDF();
  
  // Add letterhead
  addLetterhead(doc, 'ESTIMATE');
  
  // Add estimate details
  doc.setFontSize(12);
  doc.text(`Estimate #: ${estimate.estimate_uid || 'N/A'}`, 20, 45);
  doc.text(`Date: ${formatShortDate(estimate.created_at)}`, 150, 45, { align: 'right' });
  
  if (estimate.expiration_date) {
    doc.text(`Expiration: ${formatShortDate(estimate.expiration_date)}`, 150, 55, { align: 'right' });
  }
  
  // Add customer details
  addAccountDetails(doc, 'Customer:', estimate.account, 60);
  
  // Define the table styles
  const tableStyles = createTableStyles();
  
  // Map estimate products to table rows
  const rows = estimate.estimateLines?.map(line => {
    const productName = line.product_name || 
      (line.productDetails?.vendor_product_name || 
       line.productDetails?.main_new_product_name || 
       line.productDetails?.main_vendor_product_name || 
       'N/A');
    
    return [
      productName,
      line.qty || 0,
      formatCurrency(line.price || 0),
      formatCurrency(line.line_total || 0)
    ];
  }) || [];
  
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
  
  doc.text(`Subtotal:`, 150, currentY, { align: 'right' });
  doc.text(formatCurrency(estimate.subtotal || 0), 190, currentY, { align: 'right' });
  
  if (estimate.tax_rate && estimate.tax_rate > 0) {
    currentY += 10;
    doc.text(`Tax (${estimate.tax_rate}%):`, 150, currentY, { align: 'right' });
    doc.text(formatCurrency(estimate.tax_amount || 0), 190, currentY, { align: 'right' });
  }
  
  // Add credits if available
  if (estimate.credits && estimate.credits.length > 0) {
    currentY += 10;
    doc.text(`Credits:`, 150, currentY, { align: 'right' });
    doc.text(formatCurrency(estimate.credits.reduce((sum, credit) => sum + (Number(credit.amount) || 0), 0)), 190, currentY, { align: 'right' });
  }
  
  currentY += 10;
  doc.text(`Total:`, 150, currentY, { align: 'right' });
  doc.text(formatCurrency(estimate.total || 0), 190, currentY, { align: 'right' });
  
  // Add notes if available
  if (estimate.notes) {
    currentY += 20;
    doc.setFontSize(11);
    doc.text('Notes:', 20, currentY);
    currentY += 10;
    doc.setFontSize(10);
    
    // Split notes into multiple lines if needed
    const splitNotes = doc.splitTextToSize(estimate.notes, 170);
    doc.text(splitNotes, 20, currentY);
  }
  
  // Add terms if available
  if (estimate.terms) {
    currentY += 20;
    doc.setFontSize(11);
    doc.text('Terms & Conditions:', 20, currentY);
    currentY += 10;
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
  estimateId: string | any,
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
      'Estimate',
      estimate.estimate_uid?.replace(/^EST#/, '') || estimate.id,
      estimate.created_at || new Date()
    );
    
    // Store PDF using edge function
    const storageResult = await storePDF(pdfBlob, 'estimate', estimate.id, filename);
    
    if (!storageResult.success) {
      return createPDFError(
        PDFErrorType.STORAGE_ERROR,
        `Failed to store estimate PDF: ${storageResult.message}`
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
        console.error('Error handling estimate PDF download:', downloadError);
        // Continue even if download fails
      }
    }
    
    return createPDFSuccess(storageResult.url!);
  } catch (error) {
    console.error('Error generating estimate PDF:', error);
    return createPDFError(
      PDFErrorType.GENERATION_ERROR,
      error instanceof Error ? error.message : 'Unknown error generating estimate PDF'
    );
  }
}
