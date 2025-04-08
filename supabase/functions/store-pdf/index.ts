import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StorePDFRequest {
  documentType: 'invoice' | 'purchase-order' | 'estimate';
  documentId: string;
  fileName?: string;
  pdfBase64: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request
    const { documentType, documentId, fileName, pdfBase64 } = await req.json() as StorePDFRequest
    
    if (!documentType || !documentId || !pdfBase64) {
      throw new Error('Missing required parameters: documentType, documentId, and pdfBase64 are required')
    }
    
    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Decode base64 PDF data
    const pdfData = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0))
    
    // Determine folder path and table name based on document type
    let folderPath: string
    let tableName: string
    
    switch (documentType) {
      case 'invoice':
        folderPath = 'Invoices'
        tableName = 'gl_invoices'
        break
      case 'purchase-order':
        folderPath = 'PurchaseOrders'
        tableName = 'gl_purchase_orders'
        break
      case 'estimate':
        folderPath = 'Estimates'
        tableName = 'gl_estimates'
        break
      default:
        throw new Error(`Invalid document type: ${documentType}`)
    }
    
    // Generate filename if not provided
    const finalFileName = fileName || `${documentType}_${documentId}_${new Date().toISOString()}.pdf`
    
    // Upload to media-bucket storage
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('media-bucket')
      .upload(`${folderPath}/${finalFileName}`, pdfData, {
        contentType: 'application/pdf',
        upsert: true
      })
    
    if (uploadError) {
      throw new Error(`Error uploading PDF: ${uploadError.message}`)
    }
    
    // Get the public URL
    const { data: urlData } = supabaseClient
      .storage
      .from('media-bucket')
      .getPublicUrl(`${folderPath}/${finalFileName}`)
    
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL for PDF')
    }
    
    // Update the database with the PDF URL
    const { error: updateError } = await supabaseClient
      .from(tableName)
      .update({ supabase_pdf_url: urlData.publicUrl })
      .eq('id', documentId)
    
    if (updateError) {
      throw new Error(`Error updating database: ${updateError.message}`)
    }
    
    // Return success response with URL
    return new Response(
      JSON.stringify({ 
        success: true, 
        url: urlData.publicUrl,
        message: `PDF for ${documentType} ${documentId} successfully stored and database updated`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in store-pdf function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
