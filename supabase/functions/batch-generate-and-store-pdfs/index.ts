import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { PDFDocument, rgb, StandardFonts, PageSizes } from 'https://cdn.skypack.dev/pdf-lib@1.17.1?dts';

console.log('Batch Generate and Store PDFs function booting up');

// Mapping document types to table names
const tableMap: { [key: string]: string } = {
  invoice: 'gl_invoices',
  estimate: 'gl_estimates',
  purchaseOrder: 'gl_purchase_orders',
  // Add other types if needed
};

// Generate a PDF for an invoice using pdf-lib
async function generateInvoicePDF(invoice: any): Promise<Uint8Array | null> {
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
    const dateText = invoice.invoice_order_date 
      ? new Date(invoice.invoice_order_date).toLocaleDateString()
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
    
    // Table header
    const tableY = height - 180;
    page.drawText('Product', {
      x: 50,
      y: tableY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Qty', {
      x: 300,
      y: tableY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Price', {
      x: 380,
      y: tableY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Total', {
      x: 480,
      y: tableY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw horizontal line
    page.drawLine({
      start: { x: 50, y: tableY - 10 },
      end: { x: 550, y: tableY - 10 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    
    // Line items
    let currentY = tableY - 30;
    
    // Fetch line items if needed
    let lines = invoice.lines || [];
    if (!lines.length && invoice.id) {
      // If lines aren't included in the invoice data, try to fetch them
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && serviceRoleKey) {
          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
          const { data: linesData } = await supabaseAdmin
            .from('gl_invoice_lines')
            .select('*')
            .eq('rowid_invoices', invoice.glide_row_id);
          
          if (linesData?.length) {
            lines = linesData;
          }
        }
      } catch (error) {
        console.error('Error fetching invoice lines:', error);
      }
    }
    
    if (lines.length > 0) {
      for (const line of lines) {
        const productName = line.product_name_display || line.renamed_product_name || 'Product';
        const qty = line.qty_sold || 0;
        const price = line.selling_price || 0;
        const total = line.line_total || 0;
        
        // Truncate product name if too long
        const maxChars = 30;
        const displayName = productName.length > maxChars
          ? productName.substring(0, maxChars) + '...'
          : productName;
        
        page.drawText(displayName, {
          x: 50,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        page.drawText(`${qty}`, {
          x: 300,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        page.drawText(`$${price.toFixed(2)}`, {
          x: 380,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        page.drawText(`$${total.toFixed(2)}`, {
          x: 480,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        currentY -= 20;
        
        // Add a new page if we're running out of space
        if (currentY < 100) {
          page = pdfDoc.addPage(PageSizes.A4);
          currentY = height - 50;
        }
      }
    }
    
    // Total section
    currentY -= 40;
    page.drawLine({
      start: { x: 380, y: currentY + 20 },
      end: { x: 550, y: currentY + 20 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    
    page.drawText('Total:', {
      x: 380,
      y: currentY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`$${(invoice.total_amount || 0).toFixed(2)}`, {
      x: 480,
      y: currentY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Save the PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return null;
  }
}

// Generate a PDF for a purchase order using pdf-lib
async function generatePurchaseOrderPDF(purchaseOrder: any): Promise<Uint8Array | null> {
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

// Generate a PDF for an estimate using pdf-lib
async function generateEstimatePDF(estimate: any): Promise<Uint8Array | null> {
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
    
    // Total summary
    page.drawText(`Total Amount: $${(estimate.total_amount || 0).toFixed(2)}`, {
      x: 50,
      y: height - 200,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // If there are notes
    if (estimate.notes) {
      page.drawText('Notes:', {
        x: 50,
        y: height - 240,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      // Split notes into lines
      const noteLines = estimate.notes.split('\n');
      let noteY = height - 260;
      
      for (const line of noteLines) {
        // Handle text wrapping
        const chunks = [];
        let currentChunk = '';
        const words = line.split(' ');
        
        for (const word of words) {
          if ((currentChunk + ' ' + word).length > 80) {
            chunks.push(currentChunk);
            currentChunk = word;
          } else {
            currentChunk = currentChunk ? `${currentChunk} ${word}` : word;
          }
        }
        
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        
        for (const chunk of chunks) {
          page.drawText(chunk, {
            x: 50,
            y: noteY,
            size: 10,
            font: regularFont,
            color: rgb(0, 0, 0),
          });
          noteY -= 15;
        }
      }
    }
    
    // Save the PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error generating estimate PDF:', error);
    return null;
  }
}

// Generic function to generate PDF based on document type
async function generatePDF(type: string, data: any): Promise<Uint8Array | null> {
  console.log(`Generating ${type} PDF for ID: ${data.id}`);
  
  switch (type.toLowerCase()) {
    case 'invoice':
      return await generateInvoicePDF(data);
    case 'purchaseorder':
      return await generatePurchaseOrderPDF(data);
    case 'estimate':
      return await generateEstimatePDF(data);
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

    // Parse request body
    const { items } = await req.json();
    if (!Array.isArray(items)) {
      throw new Error("Request body must contain an 'items' array.");
    }

    console.log(`Processing batch of ${items.length} items.`);
    const results = [];

    // Process items sequentially to avoid overwhelming resources
    for (const item of items) {
      const { id, type } = item;
      const tableName = tableMap[type];

      if (!id || !type || !tableName) {
        console.error('Invalid item:', item);
        results.push({ id, type, success: false, error: 'Invalid item data' });
        continue; // Skip to next item
      }

      let itemResult = { id, type, success: false, error: '', url: null };

      try {
        console.log(`Processing ${type} with ID: ${id}`);

        // 1. Fetch document data
        const { data: documentData, error: fetchError } = await supabaseAdmin
          .from(tableName)
          .select('*, gl_accounts:rowid_accounts(*)')
          .eq('id', id)
          .maybeSingle();

        if (fetchError || !documentData) {
          throw new Error(
            `Failed to fetch ${type} ${id}: ${fetchError?.message || 'Not found'}`,
          );
        }
        console.log(`Fetched data for ${type} ${id}`);
        
        // Conditionally fetch line items for invoices
        if (type === 'invoice') {
          try {
            const { data: lines } = await supabaseAdmin
              .from('gl_invoice_lines')
              .select('*')
              .eq('rowid_invoices', documentData.glide_row_id);
              
            if (lines?.length > 0) {
              documentData.lines = lines;
              console.log(`Added ${lines.length} line items to invoice data`);
            }
          } catch (lineError) {
            console.warn(`Failed to fetch invoice lines for ${id}:`, lineError);
            // Continue without lines if fetch fails
          }
        } else if (type === 'estimate') {
          try {
            const { data: lines } = await supabaseAdmin
              .from('gl_estimate_lines')
              .select('*')
              .eq('rowid_estimates', documentData.glide_row_id);
              
            if (lines?.length > 0) {
              documentData.lines = lines;
              console.log(`Added ${lines.length} line items to estimate data`);
            }
          } catch (lineError) {
            console.warn(`Failed to fetch estimate lines for ${id}:`, lineError);
            // Continue without lines if fetch fails
          }
        }

        // 2. Generate PDF using pdf-lib
        const pdfBytes = await generatePDF(type, documentData);
        if (!pdfBytes) {
          throw new Error(`Failed to generate PDF for ${type} ${id}`);
        }
        console.log(`Generated PDF for ${type} ${id}`);

        // 3. Upload PDF to Supabase Storage
        const fileName = `${type}/${id}.pdf`; // Consistent path structure
        const { error: uploadError } = await supabaseAdmin.storage
          .from('pdfs') // Use the 'pdfs' bucket
          .upload(fileName, pdfBytes, {
            contentType: 'application/pdf',
            upsert: true, // Overwrite if exists
          });

        if (uploadError) {
          throw new Error(
            `Failed to upload PDF for ${type} ${id}: ${uploadError.message}`,
          );
        }
        console.log(`Uploaded PDF to storage for ${type} ${id} at ${fileName}`);

        // 4. Get Public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('pdfs')
          .getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
          console.warn(`Could not get public URL for ${fileName}. Using path.`);
        }
        const publicUrl = urlData?.publicUrl || fileName;
        console.log(`Got public URL for ${type} ${id}: ${publicUrl}`);

        // 5. Update Database Record
        const { error: updateError } = await supabaseAdmin
          .from(tableName)
          .update({ supabase_pdf_url: publicUrl })
          .eq('id', id);

        if (updateError) {
          throw new Error(
            `Failed to update DB for ${type} ${id}: ${updateError.message}`,
          );
        }
        console.log(`Updated database for ${type} ${id}`);

        // Record success
        itemResult = { ...itemResult, success: true, url: publicUrl };
      } catch (error) {
        console.error(
          `Error processing ${type} ${id}:`,
          error.message || error,
        );
        itemResult = { ...itemResult, success: false, error: error.message };
      } finally {
        results.push(itemResult);
      }
    } // End loop

    console.log('Batch processing complete.');
    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Function error:', error.message || error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
