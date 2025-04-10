import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Auto-Generate PDF Edge Function
 * 
 * This function automatically generates PDFs when new documents are created.
 * It is triggered by database webhooks when records are inserted or updated.
 * 
 * Can handle both single documents and batches:
 * 
 * Single document payload:
 * {
 *   "type": "INSERT" | "UPDATE",
 *   "table": "gl_invoices" | "gl_estimates" | "gl_purchase_orders",
 *   "record": { ...document data },
 *   "schema": "public",
 *   "old_record": { ...previous data } // only for UPDATE events
 * }
 * 
 * Batch processing payload:
 * {
 *   "batch": true,
 *   "documentType": "invoice" | "estimate" | "purchaseorder",
 *   "ids": ["id1", "id2", "id3", ...]
 * }
 */
serve(async (req) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing environment variables for Supabase');
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Parse the webhook payload
    const payload = await req.json();
    
    // Check if this is a batch request
    if (payload.batch === true) {
      return await handleBatchRequest(supabaseAdmin, payload);
    } else {
      return await handleSingleDocument(supabaseAdmin, payload);
    }
  } catch (error) {
    // Log and return error
    console.error('Error in auto-generate-pdf:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Handle batch PDF generation request
async function handleBatchRequest(supabaseAdmin, payload) {
  // Validate batch request
  if (!payload.documentType || !payload.ids || !Array.isArray(payload.ids) || payload.ids.length === 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid batch request. Must include documentType and non-empty ids array'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
  
  const { documentType, ids } = payload;
  
  // Call the batch-generate-and-store-pdfs edge function
  try {
    // Convert the format to what batch-generate-and-store-pdfs expects
    const items = ids.map(id => ({
      id,
      type: documentType
    }));
    
    const { data, error } = await supabaseAdmin.functions.invoke('batch-generate-and-store-pdfs', {
      body: { 
        items: items
      }
    });
    
    if (error) {
      throw new Error(`Error calling batch-generate-and-store-pdfs: ${error.message}`);
    }
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Batch PDF generation started for ${ids.length} ${documentType} documents`,
        results: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in batch PDF generation:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Batch processing error: ${error.message}`
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle single document PDF generation
async function handleSingleDocument(supabaseAdmin, payload) {
  // Skip if not an INSERT/UPDATE or if it's not a relevant table
  if (!['INSERT', 'UPDATE'].includes(payload.type) || 
      !['gl_invoices', 'gl_estimates', 'gl_purchase_orders'].includes(payload.table)) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Event or table not supported' 
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
  
  // For UPDATE events, only process when certain conditions are met
  if (payload.type === 'UPDATE') {
    // For example, if status changed to "approved" or similar
    const statusChanged = payload.record.status !== payload.old_record.status;
    const isRelevantStatus = ['approved', 'sent', 'active'].includes(payload.record.status);
    
    // Skip if the update doesn't meet our criteria
    if (!statusChanged || !isRelevantStatus) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Update does not meet criteria for PDF generation' 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
  }
  
  // Map table to document type for the generate-pdf function
  // Using 'purchase-order' with hyphen for consistency across the application
  const tableToTypeMap = {
    'gl_invoices': 'invoice',
    'gl_estimates': 'estimate',
    'gl_purchase_orders': 'purchase-order'
  };
  
  const documentType = tableToTypeMap[payload.table];
  const documentId = payload.record.id;
  
  // Call the generate-pdf edge function
  try {
    const { data, error } = await supabaseAdmin.functions.invoke('generate-pdf', {
      body: { 
        type: documentType, 
        id: documentId 
      },
    });
    
    if (error) {
      throw new Error(`Error calling generate-pdf: ${error.message}`);
    }
    
    // Log success message
    console.log(`Auto-generated PDF for ${documentType} ${documentId}. URL: ${data?.url}`);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `PDF generated for ${documentType} ${documentId}`,
        url: data?.url
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`Error generating PDF for ${documentType} ${documentId}:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Single document processing error: ${error.message}`
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
