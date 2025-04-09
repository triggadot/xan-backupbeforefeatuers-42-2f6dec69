import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { PDFDocument, rgb, StandardFonts, PageSizes } from 'https://cdn.skypack.dev/pdf-lib@1.17.1?dts';

console.log('Generate PDF function booting up');

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

// Generate a PDF based on document type and data
async function generatePDF(type: string, data: any): Promise<Uint8Array | null> {
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
    const { id, type } = await req.json();
    const tableName = tableMap[type];

    if (!id || !type || !tableName) {
      throw new Error("Invalid request: missing id, type, or unknown document type.");
    }

    console.log(`Processing ${type} with ID: ${id}`);
    
    try {
      // 1. Fetch document data (use Glidebase pattern, not foreign key joins)
      const { data: documentData, error: fetchError } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError || !documentData) {
        throw new Error(
          `Failed to fetch ${type} ${id}: ${fetchError?.message || 'Not found'}`,
        );
      }
      console.log(`Fetched data for ${type} ${id}`);
      
      // Separately fetch the related account following Glidebase pattern
      if (documentData.rowid_accounts) {
        try {
          const { data: accountData } = await supabaseAdmin
            .from('gl_accounts')
            .select('*')
            .eq('glide_row_id', documentData.rowid_accounts)
            .maybeSingle();
            
          if (accountData) {
            // Manually attach the account data
            documentData.gl_accounts = accountData;
            console.log(`Added account data to ${type} ${id}`);
          }
        } catch (accountError) {
          console.warn(`Failed to fetch account for ${type} ${id}:`, accountError);
          // Continue without account if fetch fails
        }
      }
      
      // Fetch line items if needed
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
        }
      }
      
      // 2. Generate PDF using pdf-lib
      const pdfBytes = await generatePDF(type, documentData);
      if (!pdfBytes) {
        throw new Error(`Failed to generate PDF for ${type} ${id}`);
      }
      console.log(`Generated PDF for ${type} ${id}`);

      // 3. Upload PDF to Supabase Storage with clean UID-based naming
      let fileName = ''; // Default fallback
      
      // Use exactly the document UID without prefixing with document type
      if (type === 'invoice' && documentData.invoice_uid) {
        fileName = `${documentData.invoice_uid}.pdf`;
      } 
      else if (type === 'estimate' && documentData.estimate_uid) {
        fileName = `${documentData.estimate_uid}.pdf`;
      }
      else if (type === 'purchaseorder' && documentData.purchase_order_uid) {
        fileName = `${documentData.purchase_order_uid}.pdf`;
      }
      else {
        // Fallback if no UID is found
        fileName = `${id}.pdf`;
      }
      
      // Store files in type-specific folders
      const storageKey = `${type}/${fileName}`;
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from('pdfs')
        .upload(storageKey, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload PDF: ${uploadError.message}`);
      }
      console.log(`Uploaded PDF to storage: ${storageKey}`);

      // 4. Get Public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('pdfs')
        .getPublicUrl(storageKey);

      if (!urlData?.publicUrl) {
        console.warn(`Could not get public URL for ${storageKey}. Using path.`);
      }

      const publicUrl = urlData?.publicUrl || storageKey;
      
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

      // 6. Send webhook notification if configured
      try {
        // Get webhook URL from vault
        const { data: webhookData, error: webhookError } = await supabaseAdmin
          .from('vault.secrets')
          .select('secret')
          .eq('name', 'n8n_pdf_webhook')
          .single();
          
        if (webhookError) {
          console.warn(`Could not retrieve webhook URL from vault: ${webhookError.message}`);
        } else if (webhookData?.secret) {
          console.log(`Sending webhook notification for ${type} ${id}`);
          
          // Prepare notification payload with metadata
          const notificationPayload = {
            event: 'pdf_generated',
            timestamp: new Date().toISOString(),
            documentType: type,
            documentId: id,
            glideRowId: documentData.glide_row_id,
            documentUid: documentData.invoice_uid || documentData.estimate_uid || documentData.purchase_order_uid,
            pdfUrl: publicUrl,
            tableUpdated: tableName,
            storageKey: storageKey,
            fromFunction: 'generate-pdf'
          };
          
          // Send webhook notification
          const webhookResponse = await fetch(webhookData.secret, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(notificationPayload)
          });
          
          if (!webhookResponse.ok) {
            console.warn(`Webhook notification failed: ${webhookResponse.status} ${webhookResponse.statusText}`);
          } else {
            console.log(`Webhook notification sent successfully for ${type} ${id}`);
          }
        }
      } catch (webhookError) {
        // Log webhook error but don't fail the operation
        console.error(`Error sending webhook notification: ${webhookError.message}`);
      }

      // Return success with URL
      return new Response(JSON.stringify({ success: true, url: publicUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (error) {
      console.error(
        `Error processing ${type} ${id}:`,
        error.message || error,
      );
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  } catch (error) {
    console.error('Function error:', error.message || error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
