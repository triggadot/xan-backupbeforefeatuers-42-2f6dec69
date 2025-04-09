
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log('PDF Storage function started');

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Parse request body
    const { documentType, documentId, pdfBase64, fileName } = await req.json();
    
    if (!documentType || !documentId || !pdfBase64) {
      throw new Error('Missing required parameters');
    }
    
    // Map document type to storage folder name
    const folderMap: Record<string, string> = {
      'invoice': 'invoices',
      'purchase-order': 'purchase-orders', 
      'estimate': 'estimates',
      'product': 'products'
    };
    
    const folder = folderMap[documentType] || 'misc';
    
    // Generate safe file name if not provided
    const safeName = fileName || 
      `${documentType}_${documentId}_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`;
    
    // Decode base64 string to Uint8Array for storage
    const pdfBinary = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
    
    // Store the PDF in the bucket
    const { data, error: uploadError } = await supabase.storage
      .from('pdfs')
      .upload(`${folder}/${safeName}`, pdfBinary, {
        contentType: 'application/pdf',
        upsert: true
      });
      
    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('pdfs')
      .getPublicUrl(`${folder}/${safeName}`);
    
    const publicUrl = publicUrlData?.publicUrl;
    
    if (!publicUrl) {
      throw new Error('Failed to get public URL for uploaded PDF');
    }
    
    // Update the database record with the PDF URL
    let tableName = '';
    
    switch (documentType) {
      case 'invoice':
        tableName = 'gl_invoices';
        break;
      case 'purchase-order':
        tableName = 'gl_purchase_orders';
        break;
      case 'estimate':
        tableName = 'gl_estimates';
        break;
      case 'product':
        tableName = 'gl_products';
        break;
      default:
        throw new Error(`Unsupported document type: ${documentType}`);
    }
    
    if (tableName) {
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ supabase_pdf_url: publicUrl })
        .eq('id', documentId);
      
      if (updateError) {
        console.error(`Error updating ${tableName}:`, updateError);
        // We'll continue even if the database update fails, as we still have the PDF
      }
    }
    
    // Return success response with URL
    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        message: `PDF successfully stored for ${documentType} ${documentId}`
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
    console.error('Error processing PDF storage request:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
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
});
