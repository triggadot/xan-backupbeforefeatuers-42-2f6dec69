
/**
 * @deprecated This function is deprecated. Please use the pdf-backend function instead.
 * See /supabase/functions/pdf-backend/README.md for complete documentation.
 * 
 * This is now a forwarding wrapper that calls the pdf-backend function with the 
 * appropriate parameters.
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log('DEPRECATED: PDF Storage function started - Forwarding to pdf-backend');

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
    const requestData = await req.json();
    const { documentType, documentId, pdfBase64, fileName } = requestData;
    
    if (!documentType || !documentId || !pdfBase64) {
      throw new Error('Missing required parameters: documentType, documentId, and pdfBase64 are required');
    }
    
    console.log(`[DEPRECATED] Forwarding PDF storage request to pdf-backend: type=${documentType}, id=${documentId}`);
    
    // Convert documentType format to match pdf-backend expectations if needed
    // pdf-backend uses 'purchaseOrder' format while this function uses 'purchase-order'
    let normalizedDocType = documentType;
    if (documentType === 'purchase-order') {
      normalizedDocType = 'purchaseOrder';
    }
    
    // Forward the request to the pdf-backend function
    const pdfBackendResponse = await supabase.functions.invoke('pdf-backend', {
      body: JSON.stringify({
        action: 'generateAndStore',
        documentType: normalizedDocType,
        documentId,
        pdfBase64,
        fileName,
        forceRegenerate: true,
        // Include other necessary fields from the original request
        ...requestData
      })
    });
    
    // If the pdf-backend function call failed, return an appropriate error
    if (pdfBackendResponse.error) {
      console.error('Error forwarding to pdf-backend:', pdfBackendResponse.error);
      throw new Error(`PDF backend function error: ${pdfBackendResponse.error.message || 'Unknown error'}`);
    }
    
    // Log the successful forwarding and response
    console.log(`Successfully forwarded to pdf-backend, response:`, pdfBackendResponse.data);
    
    // Return the response from pdf-backend, maintaining the original API contract
    // Map the response fields to match what clients expect from store-pdf
    const responseData = pdfBackendResponse.data;
    const publicUrl = responseData.url || responseData.pdfUrl;
    const storageFolder = responseData.documentType === 'purchaseOrder' ? 'purchase-orders' : 
                        `${responseData.documentType}s`;
    
    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        documentType,
        documentId,
        fileName: responseData.fileName || fileName,
        storagePath: responseData.storagePath || `${storageFolder}/${fileName || documentId}.pdf`,
        message: `PDF successfully stored for ${documentType} ${documentId} (via pdf-backend)`
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
