
// Follow this setup guide to integrate the Deno runtime and utilize Edge Functions:
// https://docs.supabase.com/docs/guides/functions/deno-runtime

import { serve } from "std/http/server.ts";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS if needed
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Add a page
    const page = pdfDoc.addPage();
    
    // Get the font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Draw some text
    page.drawText('Hello from pdf-lib in Supabase Edge Functions!', {
      x: 50,
      y: 700,
      size: 18,
      font,
      color: rgb(0, 0.53, 0.71),
    });
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Convert to Base64 for easy transport
    const pdfBase64 = btoa(
      new Uint8Array(pdfBytes).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );
    
    // Return the PDF
    return new Response(
      JSON.stringify({
        success: true,
        pdf: pdfBase64
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
