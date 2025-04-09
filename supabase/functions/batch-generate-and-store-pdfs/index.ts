import { PageSizes, PDFDocument, rgb, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib@1.17.1?dts';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Batch Generate and Store PDFs function booting up');

// Mapping document types to table names
const tableMap: { [key: string]: string } = {
  invoice: 'gl_invoices',
  estimate: 'gl_estimates',
  purchaseorder: 'gl_purchase_orders',
  // Also support these alternative formats that might be used
  invoices: 'gl_invoices',
  estimates: 'gl_estimates',
  purchaseorders: 'gl_purchase_orders',
  'purchase-order': 'gl_purchase_orders',
  'purchase-orders': 'gl_purchase_orders',
  'purchase_order': 'gl_purchase_orders',
  'purchase_orders': 'gl_purchase_orders'
};

// Standardize document type format for internal processing
function normalizeDocumentType(type: string): string {
  // Convert to lowercase and remove any hyphens or underscores
  const normalized = type.toLowerCase().trim();
  
  if (normalized === 'purchase-order' || 
      normalized === 'purchase_order' || 
      normalized === 'purchaseorders' ||
      normalized === 'purchase-orders' ||
      normalized === 'purchase_orders') {
    return 'purchaseorder';
  }
  
  if (normalized === 'invoices') {
    return 'invoice';
  }
  
  if (normalized === 'estimates') {
    return 'estimate';
  }
  
  return normalized;
}

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
    let lines = estimate.lines || [];
    if (!lines.length && estimate.id) {
      // If lines aren't included in the estimate data, try to fetch them
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && serviceRoleKey) {
          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
          const { data: linesData } = await supabaseAdmin
            .from('gl_estimate_lines')
            .select('*')
            .eq('rowid_estimates', estimate.glide_row_id);
          
          if (linesData?.length) {
            lines = linesData;
          }
        }
      } catch (error) {
        console.error('Error fetching estimate lines:', error);
      }
    }
    
    if (lines.length > 0) {
      for (const line of lines) {
        const productName = line.product_name_display || line.renamed_product_name || line.description || line.product_name || 'Unnamed Product';
        const qty = line.quantity || 0;
        const price = line.unit_price || 0;
        const total = (qty * price) || line.total || 0;
        
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
    
    // Status
    page.drawText(`Status: ${estimate.status || 'Draft'}`, {
      x: 50,
      y: height - 240,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    
    // Total summary
    page.drawText(`Total Amount: $${(estimate.total_amount || 0).toFixed(2)}`, {
      x: 50,
      y: height - 260,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // If there are notes
    if (estimate.notes) {
      page.drawText('Notes:', {
        x: 50,
        y: height - 300,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      // Split notes into lines
      const noteLines = estimate.notes.split('\n');
      let noteY = height - 320;
      
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
  // Normalize the type to handle different input formats
  const normalizedType = normalizeDocumentType(type);
  console.log(`Generating ${normalizedType} PDF for ID: ${data.id}`);
  
  switch (normalizedType) {
    case 'invoice':
      return await generateInvoicePDF(data);
    case 'purchaseorder':
      return await generatePurchaseOrderPDF(data);
    case 'estimate':
      return await generateEstimatePDF(data);
    default:
      console.error(`Unsupported document type: ${type} (normalized to ${normalizedType})`);
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
      
      // Normalize the document type
      const normalizedType = normalizeDocumentType(type);
      const tableName = tableMap[normalizedType];

      if (!id || !normalizedType || !tableName) {
        console.error('Invalid item:', { id, type, normalizedType, tableName });
        results.push({ 
          id, 
          type, 
          normalizedType,
          success: false, 
          error: `Invalid item data or unsupported document type: ${type}` 
        });
        continue; // Skip to next item
      }
      
      let itemResult = { id, type: normalizedType, success: false, error: '', url: null };

      try {
        console.log(`Processing ${normalizedType} with ID: ${id}`);

        // 1. Fetch document data
        const { data: documentData, error: fetchError } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchError || !documentData) {
          throw new Error(
            `Failed to fetch ${normalizedType} ${id}: ${fetchError?.message || 'Not found'}`,
          );
        }
        console.log(`Fetched data for ${normalizedType} ${id}`);
        
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
              console.log(`Added account data to ${normalizedType} ${id}`);
            }
          } catch (accountError) {
            console.warn(`Failed to fetch account for ${normalizedType} ${id}:`, accountError);
            // Continue without account if fetch fails
          }
        }

        // Conditionally fetch line items for invoices
        if (normalizedType === 'invoice') {
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
        } else if (normalizedType === 'estimate') {
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
        const pdfBytes = await generatePDF(normalizedType, documentData);
        if (!pdfBytes) {
          throw new Error(`Failed to generate PDF for ${normalizedType} ${id}`);
        }
        console.log(`Generated PDF for ${normalizedType} ${id}`);

        // Generate filename using just the document UID
        let fileName = ''; // Default fallback
        
        // Use exactly the document UID without prefixing with document type
        if (normalizedType === 'invoice' && documentData.invoice_uid) {
          fileName = `${documentData.invoice_uid}.pdf`;
        } 
        else if (normalizedType === 'estimate' && documentData.estimate_uid) {
          fileName = `${documentData.estimate_uid}.pdf`;
        }
        else if (normalizedType === 'purchaseorder' && documentData.purchase_order_uid) {
          fileName = `${documentData.purchase_order_uid}.pdf`;
        }
        else {
          // Fallback if no UID is found
          fileName = `${id}.pdf`;
        }
        
        // Store files in type-specific folders
        const storageKey = `${normalizedType}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('pdfs')
          .upload(storageKey, pdfBytes, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadError) {
          throw new Error(
            `Failed to upload PDF for ${normalizedType} ${id}: ${uploadError.message}`,
          );
        }
        console.log(`Uploaded PDF to storage for ${normalizedType} ${id} at ${storageKey}`);

        // 4. Get Public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('pdfs')
          .getPublicUrl(storageKey);

        if (!urlData?.publicUrl) {
          console.warn(`Could not get public URL for ${storageKey}. Using path.`);
        }
        const publicUrl = urlData?.publicUrl || storageKey;
        console.log(`Got public URL for ${normalizedType} ${id}: ${publicUrl}`);

        // 5. Update Database Record
        const { error: updateError } = await supabaseAdmin
          .from(tableName)
          .update({ supabase_pdf_url: publicUrl })
          .eq('id', id);

        if (updateError) {
          throw new Error(
            `Failed to update DB for ${normalizedType} ${id}: ${updateError.message}`,
          );
        }
        
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
            console.log(`Sending webhook notification for ${normalizedType} ${id}`);
            
            // Prepare notification payload with metadata
            const notificationPayload = {
              event: 'pdf_generated',
              timestamp: new Date().toISOString(),
              documentType: normalizedType,
              documentId: id,
              glideRowId: documentData.glide_row_id,
              documentUid: documentData.invoice_uid || documentData.estimate_uid || documentData.purchase_order_uid,
              pdfUrl: publicUrl,
              tableUpdated: tableName,
              storageKey: storageKey,
              fromFunction: 'batch-generate-and-store-pdfs'
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
              console.log(`Webhook notification sent successfully for ${normalizedType} ${id}`);
            }
          }
        } catch (webhookError) {
          // Log webhook error but don't fail the operation
          console.error(`Error sending webhook notification: ${webhookError.message}`);
        }

        // Record success
        itemResult = { ...itemResult, success: true, url: publicUrl };
      } catch (error) {
        console.error(
          `Error processing ${normalizedType} ${id}:`,
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
