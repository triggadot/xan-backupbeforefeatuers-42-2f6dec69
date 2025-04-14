/**
 * @deprecated This function is deprecated. Please use the pdf-backend function instead.
 * See /supabase/functions/pdf-backend/README.md for complete documentation.
 * 
 * This is now a forwarding wrapper that calls the pdf-backend function with the 
 * appropriate parameters.
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { PDFDocument, rgb, StandardFonts, PageSizes } from 'https://cdn.skypack.dev/pdf-lib@1.17.1?dts';

console.log('DEPRECATED: Generate PDF function - Forwarding to pdf-backend');

// Mapping document types to table names
const tableMap: { [key: string]: string } = {
  invoice: 'gl_invoices',
  estimate: 'gl_estimates',
  purchaseOrder: 'gl_purchase_orders',
  // Add other types if needed
};

// NOTE: The original PDF generation functions are kept but not used anymore
// They are maintained for documentation purposes only

// Generate a PDF for an invoice using pdf-lib
/* istanbul ignore next */
async function generateInvoicePDF(invoice: any): Promise<Uint8Array | null> {
  console.warn('DEPRECATED: This function is no longer used directly');
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    
    // Add fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Header
    page.drawText('INVOICE', {
      x: 50,
      y: height - 50,
      size: 24,
      font: boldFont,
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
    const dateText = invoice.invoice_date 
      ? new Date(invoice.invoice_date).toLocaleDateString()
      : 'N/A';
    page.drawText(`Date: ${dateText}`, {
      x: 50,
      y: height - 120,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    
    // Customer info if available
    if (invoice.gl_accounts) {
      page.drawText(`Customer: ${invoice.gl_accounts.account_name || 'N/A'}`, {
        x: 50,
        y: height - 140,
        size: 12,
        font: regularFont,
        color: rgb(0, 0, 0),
      });
    }
    
    // Status
    page.drawText(`Status: ${invoice.payment_status || 'N/A'}`, {
      x: 50,
      y: height - 160,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    
    // Line Items table header
    if (invoice.lines && invoice.lines.length > 0) {
      let currentY = height - 200;
      
      page.drawText('Description', {
        x: 50,
        y: currentY,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      page.drawText('Qty', {
        x: 250,
        y: currentY,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      page.drawText('Price', {
        x: 300,
        y: currentY,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      page.drawText('Total', {
        x: 400,
        y: currentY,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      // Line item rows
      currentY -= 20;
      
      for (const line of invoice.lines) {
        // Skip to next page if we're near the bottom
        if (currentY < 100) {
          const newPage = pdfDoc.addPage(PageSizes.A4);
          currentY = newPage.getHeight() - 50;
        }
        
        // Description (with truncation if needed)
        const description = line.product_name_display || line.renamed_product_name || line.description || line.product_name || 'Unnamed Product';
        const truncatedDesc = description.length > 30 
          ? description.substring(0, 27) + '...' 
          : description;
        
        page.drawText(truncatedDesc, {
          x: 50,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        // Quantity
        page.drawText(String(line.quantity || 1), {
          x: 250,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        // Unit price
        page.drawText(`$${(line.unit_price || 0).toFixed(2)}`, {
          x: 300,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        // Total price
        const total = (line.quantity || 1) * (line.unit_price || 0);
        page.drawText(`$${total.toFixed(2)}`, {
          x: 400,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        currentY -= 15;
      }
      
      // Total amount
      currentY -= 20;
      page.drawText('Total:', {
        x: 300,
        y: currentY,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(`$${(invoice.total_amount || 0).toFixed(2)}`, {
        x: 400,
        y: currentY,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    } else {
      // Show total if no line items
      page.drawText(`Total Amount: $${(invoice.total_amount || 0).toFixed(2)}`, {
        x: 50,
        y: height - 200,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    }
    
    // Save the PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return null;
  }
}

// Generate a PDF for an estimate using pdf-lib
/* istanbul ignore next */
async function generateEstimatePDF(estimate: any): Promise<Uint8Array | null> {
  console.warn('DEPRECATED: This function is no longer used directly');
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    
    // Add fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Header
    page.drawText('ESTIMATE', {
      x: 50,
      y: height - 50,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Estimate number
    page.drawText(`Estimate #: ${estimate.estimate_uid || 'N/A'}`, {
      x: 50,
      y: height - 100,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    
    // Date
    const dateText = estimate.estimate_date 
      ? new Date(estimate.estimate_date).toLocaleDateString()
      : 'N/A';
    page.drawText(`Date: ${dateText}`, {
      x: 50,
      y: height - 120,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    
    // Customer info if available
    if (estimate.gl_accounts) {
      page.drawText(`Customer: ${estimate.gl_accounts.account_name || 'N/A'}`, {
        x: 50,
        y: height - 140,
        size: 12,
        font: regularFont,
        color: rgb(0, 0, 0),
      });
    }
    
    // Status
    page.drawText(`Status: ${estimate.status || 'Draft'}`, {
      x: 50,
      y: height - 160,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    
    // Line Items table header
    if (estimate.lines && estimate.lines.length > 0) {
      let currentY = height - 200;
      
      page.drawText('Description', {
        x: 50,
        y: currentY,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      page.drawText('Qty', {
        x: 250,
        y: currentY,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      page.drawText('Price', {
        x: 300,
        y: currentY,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      page.drawText('Total', {
        x: 400,
        y: currentY,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      // Line item rows
      currentY -= 20;
      
      for (const line of estimate.lines) {
        // Skip to next page if we're near the bottom
        if (currentY < 100) {
          const newPage = pdfDoc.addPage(PageSizes.A4);
          currentY = newPage.getHeight() - 50;
        }
        
        // Description (with truncation if needed)
        const description = line.product_name_display || line.renamed_product_name || line.description || line.product_name || 'Item';
        const truncatedDesc = description.length > 30 
          ? description.substring(0, 27) + '...' 
          : description;
        
        page.drawText(truncatedDesc, {
          x: 50,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        // Quantity
        page.drawText(String(line.quantity || 1), {
          x: 250,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        // Unit price
        page.drawText(`$${(line.unit_price || 0).toFixed(2)}`, {
          x: 300,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        // Total price
        const total = (line.quantity || 1) * (line.unit_price || 0);
        page.drawText(`$${total.toFixed(2)}`, {
          x: 400,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        currentY -= 15;
      }
      
      // Total amount
      currentY -= 20;
      page.drawText('Total:', {
        x: 300,
        y: currentY,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(`$${(estimate.total_amount || 0).toFixed(2)}`, {
        x: 400,
        y: currentY,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    } else {
      // Show total if no line items
      page.drawText(`Total Amount: $${(estimate.total_amount || 0).toFixed(2)}`, {
        x: 50,
        y: height - 200,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    }
    
    // Save the PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error generating estimate PDF:', error);
    return null;
  }
}

// Generate a PDF for a purchase order using pdf-lib
/* istanbul ignore next */
async function generatePurchaseOrderPDF(purchaseOrder: any): Promise<Uint8Array | null> {
  console.warn('DEPRECATED: This function is no longer used directly');
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    
    // Add fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Header
    page.drawText('PURCHASE ORDER', {
      x: 50,
      y: height - 50,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // PO number
    page.drawText(`PO #: ${purchaseOrder.purchase_order_uid || 'N/A'}`, {
      x: 50,
      y: height - 100,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    
    // Date
    const dateText = purchaseOrder.po_date 
      ? new Date(purchaseOrder.po_date).toLocaleDateString()
      : 'N/A';
    page.drawText(`Date: ${dateText}`, {
      x: 50,
      y: height - 120,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    
    // Vendor info if available
    if (purchaseOrder.gl_accounts) {
      page.drawText(`Vendor: ${purchaseOrder.gl_accounts.account_name || 'N/A'}`, {
        x: 50,
        y: height - 140,
        size: 12,
        font: regularFont,
        color: rgb(0, 0, 0),
      });
    }
    
    // Simple status display
    page.drawText(`Status: ${purchaseOrder.payment_status || 'N/A'}`, {
      x: 50,
      y: height - 160,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    
    // Total summary
    page.drawText(`Total Amount: $${(purchaseOrder.total_amount || 0).toFixed(2)}`, {
      x: 50,
      y: height - 200,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Save the PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error generating purchase order PDF:', error);
    return null;
  }
}

// Generate a PDF based on document type and data
/* istanbul ignore next */
async function generatePDF(type: string, data: any): Promise<Uint8Array | null> {
  console.warn('DEPRECATED: This function is no longer used directly');
  console.log(`Generating ${type} PDF for ID: ${data.id}`);
  
  switch (type.toLowerCase()) {
    case 'invoice':
      return await generateInvoicePDF(data);
    case 'estimate':
      return await generateEstimatePDF(data);
    case 'purchaseorder':
      return await generatePurchaseOrderPDF(data);
    default:
      console.error(`Unsupported document type: ${type}`);
      return null;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    declare var Deno: {
      env: {
        get(key: string): string | undefined;
      }
    };
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Initialize Supabase client with admin privileges
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Parse request body
    const requestData = await req.json();
    const { type, id, fetchOptions } = requestData;

    if (!type || !id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters: type and id',
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 400,
        }
      );
    }

    console.log(`[DEPRECATED] Forwarding PDF generation for ${type} ID ${id} to pdf-backend`);
    
    // Forward the request to the pdf-backend function
    // pdf-backend expects documentType in camelCase format
    const pdfBackendResponse = await supabaseAdmin.functions.invoke('pdf-backend', {
      body: JSON.stringify({
        action: 'generate',
        documentType: type, // pdf-backend accepts invoice, estimate, purchaseOrder
        documentId: id,
        forceRegenerate: true,
        // Include other original request parameters
        ...requestData
      })
    });
    
    // Handle any errors from the pdf-backend function
    if (pdfBackendResponse.error) {
      console.error('Error forwarding to pdf-backend:', pdfBackendResponse.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: `PDF backend function error: ${pdfBackendResponse.error.message || 'Unknown error'}`,
          originalError: pdfBackendResponse.error
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 500,
        }
      );
    }
    
    // Log the successful forwarding
    console.log(`Successfully forwarded to pdf-backend, response:`, pdfBackendResponse.data);
    
    // Map the pdf-backend response to match the expected format from generate-pdf
    const responseData = pdfBackendResponse.data;
    const publicUrl = responseData.url || responseData.pdfUrl;
    
    // When function was called directly (without client expecting storage)
    if (responseData.pdfBase64) {
      // Return the PDF data as requested
      return new Response(
        JSON.stringify({
          success: true,
          pdfBase64: responseData.pdfBase64,
          documentType: type,
          documentId: id,
          message: `PDF successfully generated for ${type} ${id} (via pdf-backend)`
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );
    }
    
    // Otherwise return the URL of the stored PDF
    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        documentType: type,
        documentId: id,
        message: `PDF successfully generated and stored for ${type} ${id} (via pdf-backend)`
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Function error:', error.message || error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unknown error occurred'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});
