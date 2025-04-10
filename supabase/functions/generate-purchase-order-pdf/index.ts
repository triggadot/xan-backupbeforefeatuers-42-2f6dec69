
import { serve } from 'std/server';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'supabase';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Create a Supabase client with the service role key
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface PurchaseOrderData {
  id: string;
  purchase_order_uid: string;
  po_date: string;
  rowid_accounts: string;
  payment_status: string;
  total_amount: number;
  total_paid: number;
  balance: number;
}

interface VendorData {
  account_name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface ProductData {
  vendor_product_name: string;
  new_product_name?: string;
  cost: number;
  total_qty_purchased: number;
  display_name: string;
  category?: string;
}

interface POPaymentData {
  payment_amount: number;
  date_of_payment: string;
  vendor_purchase_note?: string;
}

async function fetchPurchaseOrderDetails(poId: string) {
  // Fetch purchase order
  const { data: po, error: poError } = await supabase
    .from('gl_purchase_orders')
    .select('*')
    .eq('glide_row_id', poId)
    .single();

  if (poError) {
    throw new Error(`Failed to fetch purchase order: ${poError.message}`);
  }

  // Fetch vendor information
  const { data: vendor, error: vendorError } = await supabase
    .from('gl_accounts')
    .select('account_name, email, account_email, phone, account_phone, address, account_address')
    .eq('glide_row_id', po.rowid_accounts)
    .single();

  if (vendorError) {
    throw new Error(`Failed to fetch vendor information: ${vendorError.message}`);
  }

  // Fetch products
  const { data: products, error: productsError } = await supabase
    .from('gl_products')
    .select('*')
    .eq('rowid_purchase_orders', poId);

  if (productsError) {
    throw new Error(`Failed to fetch products: ${productsError.message}`);
  }

  // Fetch payments
  const { data: payments, error: paymentsError } = await supabase
    .from('gl_vendor_payments')
    .select('*')
    .eq('rowid_purchase_orders', poId);

  if (paymentsError) {
    throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
  }

  return {
    purchaseOrder: po as PurchaseOrderData,
    vendor: {
      account_name: vendor.account_name,
      email: vendor.email || vendor.account_email,
      phone: vendor.phone || vendor.account_phone,
      address: vendor.address || vendor.account_address,
    } as VendorData,
    products: products as ProductData[],
    payments: payments as POPaymentData[]
  };
}

async function generatePurchaseOrderPDF(poId: string) {
  // Fetch all necessary data
  const { purchaseOrder, vendor, products, payments } = await fetchPurchaseOrderDetails(poId);
  
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  // Get fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Define colors and sizes
  const textColor = rgb(0.1, 0.1, 0.1);
  const headerColor = rgb(0.2, 0.2, 0.5);
  const fontSize = 12;
  const headerFontSize = 24;
  const subHeaderFontSize = 16;
  
  const margin = 50;
  let y = height - margin;
  const lineHeight = 20;

  // Company header
  page.drawText('COMPANY NAME', {
    x: margin,
    y,
    size: headerFontSize,
    font: helveticaBold,
    color: headerColor
  });
  
  y -= lineHeight * 2;
  
  // Purchase order details
  page.drawText(`PURCHASE ORDER #${purchaseOrder.purchase_order_uid}`, {
    x: margin,
    y,
    size: subHeaderFontSize,
    font: helveticaBold,
    color: headerColor
  });
  
  y -= lineHeight * 1.5;
  
  // Date and Status
  const formattedDate = new Date(purchaseOrder.po_date).toLocaleDateString();
  page.drawText(`Date: ${formattedDate}`, {
    x: margin,
    y,
    size: fontSize,
    font: helveticaFont,
    color: textColor
  });
  
  y -= lineHeight;
  
  page.drawText(`Status: ${purchaseOrder.payment_status.toUpperCase()}`, {
    x: margin,
    y,
    size: fontSize,
    font: helveticaFont,
    color: textColor
  });
  
  y -= lineHeight * 2;
  
  // Vendor Information
  page.drawText('VENDOR', {
    x: margin,
    y,
    size: subHeaderFontSize,
    font: helveticaBold,
    color: headerColor
  });
  
  y -= lineHeight * 1.2;
  
  page.drawText(`${vendor.account_name}`, {
    x: margin,
    y,
    size: fontSize,
    font: helveticaBold,
    color: textColor
  });
  
  y -= lineHeight;
  
  if (vendor.email) {
    page.drawText(`Email: ${vendor.email}`, {
      x: margin,
      y,
      size: fontSize,
      font: helveticaFont,
      color: textColor
    });
    
    y -= lineHeight;
  }
  
  if (vendor.phone) {
    page.drawText(`Phone: ${vendor.phone}`, {
      x: margin,
      y,
      size: fontSize,
      font: helveticaFont,
      color: textColor
    });
    
    y -= lineHeight;
  }
  
  if (vendor.address) {
    page.drawText(`Address: ${vendor.address}`, {
      x: margin,
      y,
      size: fontSize,
      font: helveticaFont,
      color: textColor
    });
    
    y -= lineHeight;
  }
  
  y -= lineHeight * 1.5;
  
  // Products/Items Table
  page.drawText('ITEMS', {
    x: margin,
    y,
    size: subHeaderFontSize,
    font: helveticaBold,
    color: headerColor
  });
  
  y -= lineHeight * 1.5;
  
  // Table header
  const col1 = margin;
  const col2 = margin + 230;
  const col3 = margin + 330;
  const col4 = margin + 400;
  const col5 = margin + 470;
  
  page.drawText('Product', {
    x: col1,
    y,
    size: fontSize,
    font: helveticaBold,
    color: textColor
  });
  
  page.drawText('Category', {
    x: col2,
    y,
    size: fontSize,
    font: helveticaBold,
    color: textColor
  });
  
  page.drawText('Qty', {
    x: col3,
    y,
    size: fontSize,
    font: helveticaBold,
    color: textColor
  });
  
  page.drawText('Cost', {
    x: col4,
    y,
    size: fontSize,
    font: helveticaBold,
    color: textColor
  });
  
  page.drawText('Total', {
    x: col5,
    y,
    size: fontSize,
    font: helveticaBold,
    color: textColor
  });
  
  y -= lineHeight;
  
  // Draw horizontal line
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8)
  });
  
  y -= lineHeight;
  
  // Products rows
  for (const product of products) {
    // If we're running out of space, add a new page
    if (y < margin + 100) {
      page = pdfDoc.addPage();
      y = height - margin;
    }
    
    const displayName = product.display_name || product.new_product_name || product.vendor_product_name;
    const lineTotal = (product.cost || 0) * (product.total_qty_purchased || 0);
    
    page.drawText(displayName, {
      x: col1,
      y,
      size: fontSize,
      font: helveticaFont,
      color: textColor
    });
    
    page.drawText(product.category || '', {
      x: col2,
      y,
      size: fontSize,
      font: helveticaFont,
      color: textColor
    });
    
    page.drawText(`${product.total_qty_purchased}`, {
      x: col3,
      y,
      size: fontSize,
      font: helveticaFont,
      color: textColor
    });
    
    page.drawText(`$${product.cost.toFixed(2)}`, {
      x: col4,
      y,
      size: fontSize,
      font: helveticaFont,
      color: textColor
    });
    
    page.drawText(`$${lineTotal.toFixed(2)}`, {
      x: col5,
      y,
      size: fontSize,
      font: helveticaFont,
      color: textColor
    });
    
    y -= lineHeight * 1.2;
  }
  
  // Draw horizontal line
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8)
  });
  
  y -= lineHeight;
  
  // Totals
  page.drawText('Total:', {
    x: col4 - 50,
    y,
    size: fontSize,
    font: helveticaBold,
    color: textColor
  });
  
  page.drawText(`$${purchaseOrder.total_amount.toFixed(2)}`, {
    x: col5,
    y,
    size: fontSize,
    font: helveticaBold,
    color: textColor
  });
  
  y -= lineHeight;
  
  page.drawText('Paid:', {
    x: col4 - 50,
    y,
    size: fontSize,
    font: helveticaBold,
    color: textColor
  });
  
  page.drawText(`$${purchaseOrder.total_paid.toFixed(2)}`, {
    x: col5,
    y,
    size: fontSize,
    font: helveticaBold,
    color: textColor
  });
  
  y -= lineHeight;
  
  page.drawText('Balance:', {
    x: col4 - 50,
    y,
    size: fontSize,
    font: helveticaBold,
    color: textColor
  });
  
  page.drawText(`$${purchaseOrder.balance.toFixed(2)}`, {
    x: col5,
    y,
    size: fontSize,
    font: helveticaBold,
    color: textColor
  });
  
  y -= lineHeight * 2;
  
  // Payment Information
  if (payments && payments.length > 0) {
    page.drawText('PAYMENT HISTORY', {
      x: margin,
      y,
      size: subHeaderFontSize,
      font: helveticaBold,
      color: headerColor
    });
    
    y -= lineHeight * 1.5;
    
    // Payment table header
    page.drawText('Date', {
      x: col1,
      y,
      size: fontSize,
      font: helveticaBold,
      color: textColor
    });
    
    page.drawText('Amount', {
      x: col2,
      y,
      size: fontSize,
      font: helveticaBold,
      color: textColor
    });
    
    page.drawText('Notes', {
      x: col3,
      y,
      size: fontSize,
      font: helveticaBold,
      color: textColor
    });
    
    y -= lineHeight;
    
    // Draw horizontal line
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    });
    
    y -= lineHeight;
    
    // Payment rows
    for (const payment of payments) {
      // If we're running out of space, add a new page
      if (y < margin + 100) {
        page = pdfDoc.addPage();
        y = height - margin;
      }
      
      const paymentDate = new Date(payment.date_of_payment).toLocaleDateString();
      
      page.drawText(paymentDate, {
        x: col1,
        y,
        size: fontSize,
        font: helveticaFont,
        color: textColor
      });
      
      page.drawText(`$${payment.payment_amount.toFixed(2)}`, {
        x: col2,
        y,
        size: fontSize,
        font: helveticaFont,
        color: textColor
      });
      
      if (payment.vendor_purchase_note) {
        page.drawText(payment.vendor_purchase_note.substring(0, 50), {
          x: col3,
          y,
          size: fontSize,
          font: helveticaFont,
          color: textColor
        });
      }
      
      y -= lineHeight * 1.2;
    }
  }
  
  // Add footer with page numbers
  const pageCount = pdfDoc.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();
    page.drawText(`Page ${i + 1} of ${pageCount}`, {
      x: width - margin - 100,
      y: margin / 2,
      size: 10,
      font: helveticaFont,
      color: textColor
    });
  }
  
  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

async function savePurchaseOrderPDF(poId: string, pdfBytes: Uint8Array) {
  // Get purchase order info for naming
  const { data: po, error: poError } = await supabase
    .from('gl_purchase_orders')
    .select('purchase_order_uid, glide_row_id')
    .eq('glide_row_id', poId)
    .single();

  if (poError) {
    throw new Error(`Failed to fetch purchase order for PDF storage: ${poError.message}`);
  }

  const poNum = po.purchase_order_uid || po.glide_row_id;
  const fileName = `purchase-order-${poNum}.pdf`;
  const filePath = `purchase-orders/${fileName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('pdfs')
    .upload(filePath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Failed to upload PDF: ${uploadError.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = await supabase.storage
    .from('pdfs')
    .getPublicUrl(filePath);

  // Update purchase order with PDF URL
  const { error: updateError } = await supabase
    .from('gl_purchase_orders')
    .update({
      supabase_pdf_url: publicUrlData.publicUrl,
      updated_at: new Date().toISOString()
    })
    .eq('glide_row_id', poId);

  if (updateError) {
    throw new Error(`Failed to update purchase order with PDF URL: ${updateError.message}`);
  }

  return publicUrlData.publicUrl;
}

serve(async (req) => {
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Parse request body
    const { poId } = await req.json();
    
    if (!poId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Purchase Order ID is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // Generate PDF
    const pdfBytes = await generatePurchaseOrderPDF(poId);
    
    // Save PDF and get URL
    const pdfUrl = await savePurchaseOrderPDF(poId, pdfBytes);
    
    return new Response(
      JSON.stringify({ success: true, url: pdfUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error generating purchase order PDF:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
