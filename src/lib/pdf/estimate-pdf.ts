/**
 * @deprecated This client-side PDF generation is deprecated.
 * Please use the triggerPDFGeneration function from pdf-utils.ts instead,
 * which leverages the standardized pdf-backend edge function.
 * 
 * Example:
 * ```typescript
 * import { triggerPDFGeneration } from '@/lib/pdf-utils';
 * const pdfUrl = await triggerPDFGeneration('estimate', estimateData);
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
  createPDFSuccess,
  createPDFFailure
} from './common';
import { saveAs } from 'file-saver';

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

export async function fetchEstimateForPDF(estimateId: string): Promise<EstimateWithDetails | null> {
  try {
    console.log(`Fetching estimate data for PDF generation: ${estimateId}`);
    
    let { data: estimateData, error: estimateError } = await supabase
      .from('gl_estimates')
      .select('*')
      .eq('id', estimateId)
      .maybeSingle();
    
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

    const estimateWithDetails: EstimateWithDetails = {
      ...estimateData,
      estimateLines: [],
      credits: []
    };

    if (estimateData.rowid_accounts) {
      const { data: accountData, error: accountError } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('glide_row_id', estimateData.rowid_accounts)
        .single();

      if (accountError) {
        console.error('Error fetching account:', accountError);
      } else if (accountData) {
        estimateWithDetails.account = accountData;
      }
    }

    const { data: linesData, error: linesError } = await supabase
      .from('gl_estimate_lines')
      .select('*')
      .eq('rowid_estimates', estimateData.glide_row_id);

    if (linesError) {
      console.error('Error fetching estimate lines:', linesError);
    } else if (linesData && linesData.length > 0) {
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

    const { data: creditData, error: creditError } = await supabase
      .from('gl_customer_credits')
      .select('*')
      .eq('rowid_estimates', estimateData.glide_row_id);

    if (creditError) {
      console.error('Error fetching credits:', creditError);
    } else if (creditData) {
      estimateWithDetails.credits = creditData;
    }

    return estimateWithDetails;
  } catch (error) {
    console.error('Exception fetching estimate data for PDF:', error);
    return null;
  }
}

type EstimateIdInput = string | { id?: string; glide_row_id?: string };

export function generateEstimatePDF(estimate: EstimateWithDetails): jsPDF {
  const doc = new jsPDF({
    compress: true, 
    putOnlyUsedFonts: true
  });
  
  const themeColor = [0, 51, 102];

  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTIMATE', 15, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${estimate.estimate_uid || ''}`, 15, 28);
  doc.text(`Date: ${formatShortDate(estimate.estimate_date || new Date())}`, 195, 28, { align: 'right' });
  
  doc.setDrawColor(...themeColor);
  doc.setLineWidth(1.5);
  doc.line(15, 32, 195, 32);
  
  const tableStartY = 45;
  
  const tableStyles = {
    theme: 'striped',
    headStyles: {
      fillColor: themeColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      textColor: [50, 50, 50]
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
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
  
  const rows = estimate.estimateLines?.map(line => {
    const productName = line.sale_product_name || 
      line.product_name_display || 
      line.product_name || 
      (line.productDetails?.vendor_product_name || 
       line.productDetails?.main_new_product_name || 
       line.productDetails?.main_vendor_product_name || 
       'Product Description');
    
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
  
  autoTable(doc, {
    ...tableStyles,
    body: rows,
    startY: tableStartY,
  });
  
  const finalY = doc.lastAutoTable.finalY;
  
  doc.setFontSize(11);
  let currentY = finalY + 10;
  
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
  
  if (estimate.notes) {
    currentY += 15;
    doc.setFontSize(11);
    doc.text('Notes:', 20, currentY);
    currentY += 7;
    doc.setFontSize(10);
    
    const splitNotes = doc.splitTextToSize(estimate.notes, 170);
    doc.text(splitNotes, 20, currentY);
  }
  
  if (estimate.terms) {
    currentY += 15;
    doc.setFontSize(11);
    doc.text('Terms & Conditions:', 20, currentY);
    currentY += 7;
    doc.setFontSize(10);
    
    const splitTerms = doc.splitTextToSize(estimate.terms, 170);
    doc.text(splitTerms, 20, currentY);
  }
  
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
  }
  
  return doc;
}

export async function generateAndStoreEstimatePDF(
  estimateId: EstimateIdInput,
  download: boolean = false
): Promise<PDFOperationResult> {
  try {
    const id = typeof estimateId === 'object' 
      ? (estimateId.id || estimateId.glide_row_id || JSON.stringify(estimateId)) 
      : estimateId;
    
    console.log(`Generating PDF for estimate with ID: ${id}`);
    
    const estimate = await fetchEstimateForPDF(id);
    
    if (!estimate) {
      return createPDFFailure({
        type: PDFErrorType.FETCH_ERROR,
        message: `Failed to fetch estimate with ID: ${id}`
      });
    }
    
    const pdfDoc = generateEstimatePDF(estimate);
    
    const pdfBlob = await new Promise<Blob>((resolve) => {
      const blob = pdfDoc.output('blob');
      resolve(blob);
    });
    
    // Use the Supabase-generated estimate_uid directly for the filename
    const filename = estimate.estimate_uid 
      ? `${estimate.estimate_uid}.pdf`
      : generateFilename('EST', estimate.id);
    
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
      console.log(`Invoking store-pdf for estimate ID: ${estimate.id}`);
      const { data: storageData, error: functionError } = await supabase.functions.invoke('store-pdf', {
        body: JSON.stringify({
          documentType: 'estimate',
          documentId: estimate.id,
          pdfBase64: base64Data,
          fileName: filename,
        }),
      });

      if (functionError) {
        console.error(`Error calling store-pdf function for estimate ${estimate.id}:`, functionError);
      } else {
        console.log(`Successfully stored PDF for estimate ${estimate.id}`, storageData);
        
        // Update database with PDF URL if available from storage function
        if (storageData?.url) {
          const { error: updateError } = await supabase
            .from('gl_estimates')
            .update({ supabase_pdf_url: storageData.url })
            .eq('id', estimate.id);
            
          if (updateError) {
            console.error(`Error updating estimate with PDF URL: ${updateError.message}`);
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
      console.error(`Error during PDF storage for estimate ${estimate.id}:`, storageError);
      
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
    
    const blobUrl = URL.createObjectURL(pdfBlob);
    
    return createPDFSuccess(blobUrl);
  } catch (error) {
    console.error('Error generating estimate PDF:', 
      error instanceof Error 
        ? JSON.stringify({ message: error.message, stack: error.stack }, null, 2) 
        : String(error)
    );
    return createPDFFailure({
      type: PDFErrorType.GENERATION_ERROR,
      message: error instanceof Error ? error.message : 'Unknown error generating estimate PDF'
    });
  }
}
