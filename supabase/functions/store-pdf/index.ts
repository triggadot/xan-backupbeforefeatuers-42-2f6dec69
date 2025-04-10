
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
      throw new Error('Missing required parameters: documentType, documentId, and pdfBase64 are required');
    }
    
    console.log(`Processing PDF storage: type=${documentType}, id=${documentId}, filename=${fileName || 'not provided'}`);
    
    
    // Map document type to storage folder name
    const folderMap: Record<string, string> = {
      'invoice': 'invoices',
      'purchase-order': 'purchase-orders', 
      'estimate': 'estimates',
      'product': 'products'
    };
    
    const folder = folderMap[documentType] || 'misc';
    
    // Use the provided fileName or fetch the document UID and use that as the filename
    let safeName = fileName;
    
    if (!safeName) {
      // If no fileName provided, we need to fetch the document to get its UID
      console.log(`No filename provided, will try to get document UID for ${documentType} ID ${documentId}`);
      
      try {
        const tableName = folderMap[documentType] ? 
          `gl_${folderMap[documentType].replace(/-/g, '_')}` : '';
        
        if (tableName) {
          // First try by UUID
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', documentId)
            .maybeSingle();
          
          if (data) {
            // Get the appropriate UID field based on document type
            const uidField = documentType === 'invoice' ? 'invoice_uid' : 
                            documentType === 'purchase-order' ? 'purchase_order_uid' : 
                            documentType === 'estimate' ? 'estimate_uid' : 
                            '';
            
            if (uidField && data[uidField]) {
              safeName = `${data[uidField]}.pdf`;
              console.log(`Using document UID as filename: ${safeName}`);
            }
          } else {
            // Try by glide_row_id
            const { data: glideData, error: glideError } = await supabase
              .from(tableName)
              .select('*')
              .eq('glide_row_id', documentId)
              .maybeSingle();
              
            if (glideData) {
              // Get the appropriate UID field
              const uidField = documentType === 'invoice' ? 'invoice_uid' : 
                              documentType === 'purchase-order' ? 'purchase_order_uid' : 
                              documentType === 'estimate' ? 'estimate_uid' : 
                              '';
              
              if (uidField && glideData[uidField]) {
                safeName = `${glideData[uidField]}.pdf`;
                console.log(`Using document UID as filename: ${safeName}`);
              }
            }
          }
        }
      } catch (lookupError) {
        console.warn(`Error looking up document UID: ${lookupError.message}`);
      }
      
      // If we still don't have a safeName, fall back to a simple format
      if (!safeName) {
        const prefix = documentType === 'invoice' ? 'INV#' :
                      documentType === 'purchase-order' ? 'PO#' :
                      documentType === 'estimate' ? 'EST#' :
                      documentType === 'product' ? 'PROD#' :
                      'DOC#';
                      
        safeName = `${prefix}${documentId}.pdf`;
        console.log(`Using fallback filename: ${safeName}`);
      }
    }
    
    // Decode base64 string to Uint8Array for storage
    const pdfBinary = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
    
    console.log(`Decoded PDF binary data, size: ${pdfBinary.length} bytes`);
    
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
      // First try to update by UUID id
      const { data: updateData, error: updateError } = await supabase
        .from(tableName)
        .update({ supabase_pdf_url: publicUrl })
        .eq('id', documentId)
        .select('id');
      
      // If no rows were updated by id, try updating by glide_row_id
      if (updateError || !updateData || updateData.length === 0) {
        console.log(`No records updated using id=${documentId}, trying glide_row_id lookup`);
        
        const { data: glideData, error: glideError } = await supabase
          .from(tableName)
          .update({ supabase_pdf_url: publicUrl })
          .eq('glide_row_id', documentId)
          .select('id, glide_row_id');
        
        if (glideError || !glideData || glideData.length === 0) {
          console.error(`Error updating ${tableName} by glide_row_id:`, glideError || 'No records found');
          // Continue execution even if both update attempts fail
        } else {
          console.log(`Successfully updated ${tableName} using glide_row_id match:`, glideData);
        }
      } else {
        console.log(`Successfully updated ${tableName} using id match:`, updateData);
      }
    }
    
    // Return success response with URL and additional metadata
    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        documentType,
        documentId,
        fileName: safeName,
        storagePath: `${folder}/${safeName}`,
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
