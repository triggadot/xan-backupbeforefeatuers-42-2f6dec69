
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Store PDF function booting up');

// Mapping document types to table names
const tableMap: { [key: string]: string } = {
  invoice: 'gl_invoices',
  estimate: 'gl_estimates',
  purchaseOrder: 'gl_purchase_orders',
  // Add other types if needed
};

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
    const { id, type, pdfData, fileName } = await req.json(); // Expecting base64 pdfData
    const tableName = tableMap[type];

    if (!id || !type || !tableName || !pdfData || !fileName) {
      throw new Error(
        'Request body must contain id, type, pdfData (base64 string), and fileName.',
      );
    }

    console.log(`Storing PDF for ${type} with ID: ${id}`);

    // 1. Decode Base64 PDF Data to Blob
    let pdfBlob: Blob;
    try {
      // Deno's atob is suitable for base64 decoding
      const binaryString = atob(pdfData);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      pdfBlob = new Blob([bytes], { type: 'application/pdf' });
      console.log(`Decoded base64 PDF data for ${type} ${id}`);
    } catch (error) {
      throw new Error(`Failed to decode base64 PDF data: ${error.message}`);
    }

    // 2. Upload PDF to Supabase Storage
    const filePath = `${type}/${id}.pdf`; // Consistent path structure
    const { error: uploadError } = await supabaseAdmin.storage
      .from('pdfs') // Use the 'pdfs' bucket
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      throw new Error(
        `Failed to upload PDF for ${type} ${id}: ${uploadError.message}`,
      );
    }
    console.log(`Uploaded PDF to storage for ${type} ${id} at ${filePath}`);

    // 3. Get Public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('pdfs')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      console.warn(`Could not get public URL for ${filePath}. Using path.`);
    }
    const publicUrl = urlData?.publicUrl || filePath;
    console.log(`Got public URL for ${type} ${id}: ${publicUrl}`);

    // 4. Update Database Record
    const { error: updateError } = await supabaseAdmin
      .from(tableName)
      .update({ supabase_pdf_url: publicUrl })
      .eq('id', id);

    if (updateError) {
      // Log the error but don't necessarily throw, the PDF is stored.
      // Frontend might retry DB update later or handle inconsistency.
      console.error(
        `Failed to update DB for ${type} ${id}: ${updateError.message}`,
      );
      // Depending on requirements, you might still return success if upload worked
      // Or return a specific status indicating partial success.
      // For now, return success but log the DB error.
    } else {
      console.log(`Updated database for ${type} ${id}`);
    }

    // Return success
    return new Response(JSON.stringify({ success: true, url: publicUrl }), {
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
