import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts'; // Assuming shared CORS setup

console.log('Batch Generate and Store PDFs function booting up');

// Placeholder for the actual PDF generation logic
// This needs to be implemented based on how jsPDF logic can be run server-side
// or by replicating the drawing commands.
async function generatePdfBlob(
  documentType: string,
  documentData: Record<string, unknown> | null, // Use Record<string, unknown> instead of any
): Promise<Blob | null> {
  console.log(
    `Placeholder: Generating PDF for type ${documentType} with data:`,
    documentData,
  );
  // In a real implementation, this would use jsPDF or similar library
  // adapted for Deno environment to create the PDF blob.
  // For now, returning a dummy blob.
  try {
    const textEncoder = new TextEncoder();
    const pdfContent = textEncoder.encode(
      `Dummy PDF for ${documentType} ID: ${documentData?.id || 'N/A'}`,
    );
    return new Blob([pdfContent], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error creating dummy PDF blob:', error);
    return null;
  }
}

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
    const { items } = await req.json();
    if (!Array.isArray(items)) {
      throw new Error("Request body must contain an 'items' array.");
    }

    console.log(`Processing batch of ${items.length} items.`);
    const results = [];

    // Process items sequentially to avoid overwhelming resources
    // Note: This can still hit execution time limits for large batches
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
          .select('*') // Select specific columns needed for PDF later
          .eq('id', id)
          .maybeSingle();

        if (fetchError || !documentData) {
          throw new Error(
            `Failed to fetch ${type} ${id}: ${fetchError?.message || 'Not found'}`,
          );
        }
        console.log(`Fetched data for ${type} ${id}`);

        // 2. Generate PDF Blob
        const pdfBlob = await generatePdfBlob(type, documentData);
        if (!pdfBlob) {
          throw new Error(`Failed to generate PDF blob for ${type} ${id}`);
        }
        console.log(`Generated PDF blob for ${type} ${id}`);

        // 3. Upload PDF to Supabase Storage
        const filePath = `${type}/${id}.pdf`;
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

        // 4. Get Public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('pdfs')
          .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          // Handle case where public URL might not be immediately available or bucket isn't public
          console.warn(`Could not get public URL for ${filePath}. Using path.`);
          // Fallback or decide how to handle non-public URLs if necessary
        }
        const publicUrl = urlData?.publicUrl || filePath; // Use path as fallback if needed
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
