
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
    case 'purchaseorder':
      return await generatePurchaseOrderPDF(data);
    // Add other document types if needed
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
      
      // 2. Generate PDF using pdf-lib
      const pdfBytes = await generatePDF(type, documentData);
      if (!pdfBytes) {
        throw new Error(`Failed to generate PDF for ${type} ${id}`);
      }
      console.log(`Generated PDF for ${type} ${id}`);

      // 3. Upload PDF to Supabase Storage
      const fileName = `${type}/${id}.pdf`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('pdfs')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true,
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
