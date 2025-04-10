import { PageSizes, PDFDocument, rgb, StandardFonts } from 'https://cdn.skypack.dev/pdf-lib@1.17.1?dts';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Batch Generate and Store PDFs function booting up');

/**
 * Supported document types for PDF generation
 */
enum DocumentType {
  INVOICE = 'invoice',
  ESTIMATE = 'estimate',
  PURCHASE_ORDER = 'purchaseorder',
}

/**
 * Document type mapping configuration
 */
interface DocumentTypeConfig {
  /** Table name for the main document */
  tableName: string;
  /** Table name for line items if any */
  linesTableName?: string;
  /** Field to use for the filename */
  uidField?: string;
  /** Field referencing the account */
  accountRefField: string;
  /** Storage folder path */
  storageFolder: string;
  /** Optional additional relations for specific document types */
  additionalRelations?: {
    /** Table name of the related entity */
    tableName: string;
    /** Field in the main document referencing the related entity */
    referenceField: string;
  }[];
}

/**
 * Configuration for each document type including table names and field mappings
 * Following the Glidebase pattern of using glide_row_id for relationships
 */
const documentTypeConfig: Record<DocumentType, DocumentTypeConfig> = {
  [DocumentType.INVOICE]: {
    tableName: 'gl_invoices',
    linesTableName: 'gl_invoice_lines',
    uidField: 'invoice_uid',
    accountRefField: 'rowid_accounts',
    storageFolder: 'invoice',
    additionalRelations: [
      {
        tableName: 'gl_shipping_records',
        referenceField: 'rowid_invoices'
      }
    ]
  },
  [DocumentType.ESTIMATE]: {
    tableName: 'gl_estimates',
    linesTableName: 'gl_estimate_lines',
    uidField: 'estimate_uid',
    accountRefField: 'rowid_accounts',
    storageFolder: 'estimate',
    additionalRelations: [
      {
        tableName: 'gl_customer_credits',
        referenceField: 'rowid_estimates'
      }
    ]
  },
  [DocumentType.PURCHASE_ORDER]: {
    tableName: 'gl_purchase_orders',
    uidField: 'purchase_order_uid',
    accountRefField: 'rowid_accounts',
    storageFolder: 'purchase-order',
    additionalRelations: [
      {
        tableName: 'gl_vendor_payments',
        referenceField: 'rowid_purchase_orders'
      }
    ]
  }
};

// Mapping for alternative document type formats to standardized enum
const documentTypeAliases: Record<string, DocumentType> = {
  'invoice': DocumentType.INVOICE,
  'invoices': DocumentType.INVOICE,
  
  'estimate': DocumentType.ESTIMATE,
  'estimates': DocumentType.ESTIMATE,
  
  'purchaseorder': DocumentType.PURCHASE_ORDER,
  'purchaseorders': DocumentType.PURCHASE_ORDER,
  'purchase-order': DocumentType.PURCHASE_ORDER,
  'purchase-orders': DocumentType.PURCHASE_ORDER,
  'purchase_order': DocumentType.PURCHASE_ORDER,
  'purchase_orders': DocumentType.PURCHASE_ORDER,
  'purchaseOrder': DocumentType.PURCHASE_ORDER,
};

/**
 * Standardizes document type format for internal processing
 * 
 * @param type - The document type string to normalize (case-insensitive)
 * @returns Normalized DocumentType enum value
 * @throws Error if type is not supported
 */
function normalizeDocumentType(type: string): DocumentType {
  if (!type) {
    throw new Error('Document type is required');
  }
  
  // Convert to lowercase and trim whitespace
  const normalized = type.toLowerCase().trim();
  
  // Look up in our aliases map
  const documentType = documentTypeAliases[normalized];
  
  if (!documentType) {
    throw new Error(`Unsupported document type: ${type}`);
  }
  
  return documentType;
}

// Generate a PDF for an invoice using pdf-lib
async function generateInvoicePDF(invoice: any): Promise<Uint8Array | null> {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    
    // Add fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Header
    page.drawText('INVOICE', {
      x: 50,
      y: height - 50,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Invoice number
    page.drawText(`Invoice #: ${invoice.invoice_uid || 'N/A'}`, {
      x: 50,
      y: height - 100,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    
    // Date
    const dateText = invoice.invoice_order_date 
      ? new Date(invoice.invoice_order_date).toLocaleDateString()
      : 'N/A';
    page.drawText(`Date: ${dateText}`, {
      x: 50,
      y: height - 120,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    
    // Render account/customer information
    if (invoice.account) {
      const account = invoice.account;
      page.drawText(`${account.name}`, {
        x: 50,
        y: height - 140,
        size: 12,
        font: regularFont,
        color: rgb(0, 0, 0),
      });
      
      // Add address if available
      if (account.street_address) {
        page.drawText(`${account.street_address}`, {
          x: 50,
          y: height - 155,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        const cityStateZip = [
          account.city,
          account.state,
          account.postal_code
        ].filter(Boolean).join(', ');
        
        if (cityStateZip) {
          page.drawText(cityStateZip, {
            x: 50,
            y: height - 170,
            size: 10,
            font: regularFont,
            color: rgb(0, 0, 0),
          });
        }
      }
    } else {
      console.warn('No account data found for invoice');
    }
    
    // Table header
    const tableY = height - 200;
    page.drawText('Product', {
      x: 50,
      y: tableY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Qty', {
      x: 300,
      y: tableY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Price', {
      x: 380,
      y: tableY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Total', {
      x: 480,
      y: tableY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw horizontal line
    page.drawLine({
      start: { x: 50, y: tableY - 10 },
      end: { x: 550, y: tableY - 10 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    
    // Line items
    let currentY = tableY - 30;
    
    // Fetch line items if needed
    let lines = invoice.lines || [];
    if (!lines.length && invoice.id) {
      // If lines aren't included in the invoice data, try to fetch them
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && serviceRoleKey) {
          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
          const { data: linesData } = await supabaseAdmin
            .from('gl_invoice_lines')
            .select('*')
            .eq('rowid_invoices', invoice.glide_row_id);
          
          if (linesData?.length) {
            lines = linesData;
          }
        }
      } catch (error) {
        console.error('Error fetching invoice lines:', error);
      }
    }
    
    if (lines.length > 0) {
      for (const line of lines) {
        const productName = line.product_name_display || line.renamed_product_name || 'Product';
        const qty = line.qty_sold || 0;
        const price = line.selling_price || 0;
        const total = line.line_total || 0;
        
        // Truncate product name if too long
        const maxChars = 30;
        const displayName = productName.length > maxChars
          ? productName.substring(0, maxChars) + '...'
          : productName;
        
        page.drawText(displayName, {
          x: 50,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        page.drawText(`${qty}`, {
          x: 300,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        page.drawText(`$${price.toFixed(2)}`, {
          x: 380,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        page.drawText(`$${total.toFixed(2)}`, {
          x: 480,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        currentY -= 20;
        
        // Add a new page if we're running out of space
        if (currentY < 100) {
          page = pdfDoc.addPage(PageSizes.A4);
          currentY = height - 50;
        }
      }
    }
    
    // Total section
    currentY -= 40;
    page.drawLine({
      start: { x: 380, y: currentY + 20 },
      end: { x: 550, y: currentY + 20 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    
    page.drawText('Total:', {
      x: 380,
      y: currentY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`$${(invoice.total_amount || 0).toFixed(2)}`, {
      x: 480,
      y: currentY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Save the PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return null;
  }
}

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
    
    // Render account/vendor information
    if (purchaseOrder.account) {
      const account = purchaseOrder.account;
      page.drawText(`Vendor: ${account.name}`, {
        x: 50,
        y: height - 140,
        size: 12,
        font: regularFont,
        color: rgb(0, 0, 0),
      });
    } else {
      console.warn('No account data found for purchase order');
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

// Generate a PDF for an estimate using pdf-lib
async function generateEstimatePDF(estimate: any): Promise<Uint8Array | null> {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    
    // Add fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Header
    page.drawText('ESTIMATE', {
      x: 50,
      y: height - 50,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Estimate number
    page.drawText(`Estimate #: ${estimate.estimate_uid || 'N/A'}`, {
      x: 50,
      y: height - 100,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    
    // Date
    const dateText = estimate.estimate_date 
      ? new Date(estimate.estimate_date).toLocaleDateString()
      : 'N/A';
    page.drawText(`Date: ${dateText}`, {
      x: 50,
      y: height - 120,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    
    // Render account/customer information
    if (estimate.account) {
      const account = estimate.account;
      page.drawText(`${account.name}`, {
        x: 50,
        y: height - 140,
        size: 12,
        font: regularFont,
        color: rgb(0, 0, 0),
      });
      
      // Add address if available
      if (account.street_address) {
        page.drawText(`${account.street_address}`, {
          x: 50,
          y: height - 155,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        const cityStateZip = [
          account.city,
          account.state,
          account.postal_code
        ].filter(Boolean).join(', ');
        
        if (cityStateZip) {
          page.drawText(cityStateZip, {
            x: 50,
            y: height - 170,
            size: 10,
            font: regularFont,
            color: rgb(0, 0, 0),
          });
        }
      }
    } else {
      console.warn('No account data found for estimate');
    }
    
    // Table header
    const tableY = height - 200;
    page.drawText('Product', {
      x: 50,
      y: tableY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Qty', {
      x: 300,
      y: tableY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Price', {
      x: 380,
      y: tableY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText('Total', {
      x: 480,
      y: tableY,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw horizontal line
    page.drawLine({
      start: { x: 50, y: tableY - 10 },
      end: { x: 550, y: tableY - 10 },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    
    // Line items
    let currentY = tableY - 30;
    
    // Fetch line items if needed
    let lines = estimate.lines || [];
    if (!lines.length && estimate.id) {
      // If lines aren't included in the estimate data, try to fetch them
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && serviceRoleKey) {
          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
          const { data: linesData } = await supabaseAdmin
            .from('gl_estimate_lines')
            .select('*')
            .eq('rowid_estimates', estimate.glide_row_id);
          
          if (linesData?.length) {
            lines = linesData;
          }
        }
      } catch (error) {
        console.error('Error fetching estimate lines:', error);
      }
    }
    
    if (lines.length > 0) {
      for (const line of lines) {
        const productName = line.product_name_display || line.renamed_product_name || line.description || line.product_name || 'Unnamed Product';
        const qty = line.quantity || 0;
        const price = line.unit_price || 0;
        const total = (qty * price) || line.total || 0;
        
        // Truncate product name if too long
        const maxChars = 30;
        const displayName = productName.length > maxChars
          ? productName.substring(0, maxChars) + '...'
          : productName;
        
        page.drawText(displayName, {
          x: 50,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        page.drawText(`${qty}`, {
          x: 300,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        page.drawText(`$${price.toFixed(2)}`, {
          x: 380,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        page.drawText(`$${total.toFixed(2)}`, {
          x: 480,
          y: currentY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        currentY -= 20;
        
        // Add a new page if we're running out of space
        if (currentY < 100) {
          page = pdfDoc.addPage(PageSizes.A4);
          currentY = height - 50;
        }
      }
    }
    
    // Status
    page.drawText(`Status: ${estimate.status || 'Draft'}`, {
      x: 50,
      y: height - 240,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    
    // Total summary
    page.drawText(`Total Amount: $${(estimate.total_amount || 0).toFixed(2)}`, {
      x: 50,
      y: height - 260,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    // If there are notes
    if (estimate.notes) {
      page.drawText('Notes:', {
        x: 50,
        y: height - 300,
        size: 12,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      
      // Split notes into lines
      const noteLines = estimate.notes.split('\n');
      let noteY = height - 320;
      
      for (const line of noteLines) {
        // Handle text wrapping
        const chunks = [];
        let currentChunk = '';
        const words = line.split(' ');
        
        for (const word of words) {
          if ((currentChunk + ' ' + word).length > 80) {
            chunks.push(currentChunk);
            currentChunk = word;
          } else {
            currentChunk = currentChunk ? `${currentChunk} ${word}` : word;
          }
        }
        
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        
        for (const chunk of chunks) {
          page.drawText(chunk, {
            x: 50,
            y: noteY,
            size: 10,
            font: regularFont,
            color: rgb(0, 0, 0),
          });
          noteY -= 15;
        }
      }
    }
    
    // Save the PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error generating estimate PDF:', error);
    return null;
  }
}

/**
 * Generates a PDF document based on document type and data
 * 
 * @param type - The document type (will be normalized)
 * @param data - The document data including related records
 * @returns PDF as Uint8Array or null if generation fails
 */
async function generatePDF(type: string, data: any): Promise<Uint8Array | null> {
  // Normalize the type to handle different input formats
  const normalizedType = normalizeDocumentType(type);
  console.log(`Generating ${normalizedType} PDF for ID: ${data.id}`);
  
  switch (normalizedType) {
    case DocumentType.INVOICE:
      return await generateInvoicePDF(data);
    case DocumentType.PURCHASE_ORDER:
      return await generatePurchaseOrderPDF(data);
    case DocumentType.ESTIMATE:
      return await generateEstimatePDF(data);
    default:
      console.error(`Unsupported document type: ${type} (normalized to ${normalizedType})`);
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
    const { items } = await req.json();
    if (!Array.isArray(items)) {
      throw new Error("Request body must contain an 'items' array.");
    }

    console.log(`Processing batch of ${items.length} items.`);
    const results = [];

    // Process items sequentially to avoid overwhelming resources
    for (const item of items) {
      const { id, type } = item;
      
      // Start with a default result
      let itemResult = { id, type, success: false, error: '', url: null };
      
      try {
        // Define these variables inside the try block as they're only used here
        // Normalize the document type
        const normalizedType = normalizeDocumentType(type);
        const config = documentTypeConfig[normalizedType];

        if (!id || !config) {
          throw new Error(`Invalid item data or unsupported document type: ${type}`);
        }
        
        // Update the result with the normalized type
        itemResult.type = normalizedType;
        
        console.log(`Processing ${normalizedType} with ID: ${id}`);

        // 1. Fetch document data - explicitly list columns to avoid relationship navigation
        const { data: documentData, error: fetchError } = await supabaseAdmin
          .from(config.tableName)
          .select(`
            id, 
            glide_row_id, 
            ${config.uidField}, 
            ${config.accountRefField}, 
            created_at, 
            updated_at, 
            *
          `)
          .eq('id', id)
          .maybeSingle();

        if (fetchError || !documentData) {
          throw new Error(
            `Failed to fetch ${normalizedType} ${id}: ${fetchError?.message || 'Not found'}`,
          );
        }
        console.log(`Fetched data for ${normalizedType} ${id}`);
        
        // Fetch the related account following Glidebase pattern
        const accountField = config.accountRefField;
        if (documentData[accountField]) {
          try {
            const { data: accountData, error: accountError } = await supabaseAdmin
              .from('gl_accounts')
              .select(`
                id,
                glide_row_id,
                name,
                email,
                phone,
                address,
                type,
                created_at,
                updated_at
              `)
              .eq('glide_row_id', documentData[accountField]);
              
            if (accountError) {
              throw accountError;
            }
            
            if (accountData && accountData.length > 0) {
              // Create a lookup map by glide_row_id
              const accountMap = new Map();
              accountData.forEach(account => {
                accountMap.set(account.glide_row_id, account);
              });
              
              // Attach the account using the lookup map pattern
              documentData.account = accountMap.get(documentData[accountField]);
              console.log(`Added account data to ${normalizedType} ${id}`);
            } else {
              console.warn(`Account not found for ${normalizedType} ${id} with rowid_accounts: ${documentData[accountField]}`);
            }
          } catch (accountError) {
            console.warn(`Failed to fetch account for ${normalizedType} ${id}:`, accountError);
            // Continue without account if fetch fails
          }
        } else {
          console.warn(`No account reference found for ${normalizedType} ${id}`);
        }

        // Conditionally fetch line items if this document type has them
        if (config.linesTableName) {
          try {
            // The line items reference field follows Glidebase pattern: rowid_[tablename]
            // For example, gl_invoice_lines uses rowid_invoices to reference gl_invoices.glide_row_id
            const refField = `rowid_${config.tableName.replace('gl_', '')}`;
            
            const { data: lines, error: linesError } = await supabaseAdmin
              .from(config.linesTableName)
              .select(`
                id,
                glide_row_id,
                ${refField},
                rowid_products,
                description,
                quantity,
                unit_price,
                created_at,
                updated_at,
                *
              `)
              .eq(refField, documentData.glide_row_id);
            
            if (linesError) {
              throw linesError;
            }
              
            if (lines?.length > 0) {
              documentData.lines = lines;
              console.log(`Added ${lines.length} line items to ${normalizedType} data`);
              
              // If we have product references in the lines, fetch those as well following Glidebase pattern
              const productReferences = lines.filter(line => line.rowid_products).map(line => line.rowid_products);
              
              if (productReferences.length > 0) {
                // Get unique product IDs
                const uniqueProductIds = [...new Set(productReferences)];
                
                const { data: products, error: productsError } = await supabaseAdmin
                  .from('gl_products')
                  .select(`
                    id,
                    glide_row_id,
                    name,
                    description,
                    sku,
                    price,
                    cost,
                    created_at,
                    updated_at
                  `)
                  .in('glide_row_id', uniqueProductIds);
                
                if (productsError) {
                  throw productsError;
                }
                    
                if (products?.length > 0) {
                  // Create a lookup map by glide_row_id following the Glidebase pattern
                  const productMap = new Map();
                  products.forEach(product => {
                    productMap.set(product.glide_row_id, product);
                  });
                  
                  // Add products to their respective line items using the lookup map
                  lines.forEach(line => {
                    if (line.rowid_products) {
                      const matchingProduct = productMap.get(line.rowid_products);
                      if (matchingProduct) {
                        line.product = matchingProduct;
                      } else {
                        console.warn(`Product with glide_row_id ${line.rowid_products} not found for line item`);
                      }
                    }
                  });
                  
                  console.log(`Added ${products.length} products to line items`);
                } else {
                  console.warn(`No products found for the referenced product IDs`);
                }
              }
            } else {
              console.log(`No line items found for ${normalizedType} ${id}`);
              documentData.lines = []; // Set empty array to avoid null/undefined issues
            }
          } catch (lineError) {
            console.warn(`Failed to fetch line items for ${normalizedType} ${id}:`, lineError);
            documentData.lines = []; // Set empty array to avoid null/undefined issues
          }
        }

        // Fetch any additional relations configured for this document type
        if (config.additionalRelations && config.additionalRelations.length > 0) {
          for (const relation of config.additionalRelations) {
            try {
              const { data: relatedData, error: relatedError } = await supabaseAdmin
                .from(relation.tableName)
                .select(`
                  id,
                  glide_row_id,
                  ${relation.referenceField},
                  created_at,
                  updated_at,
                  *
                `)
                .eq(relation.referenceField, documentData.glide_row_id);
              
              if (relatedError) {
                throw relatedError;
              }
              
              if (relatedData && relatedData.length > 0) {
                // Derive the property name from the table name
                const propertyName = relation.tableName.replace('gl_', '');
                documentData[propertyName] = relatedData;
                console.log(`Added ${relatedData.length} ${propertyName} to ${normalizedType} ${id}`);
              }
            } catch (relationError) {
              console.warn(`Failed to fetch ${relation.tableName} for ${normalizedType} ${id}:`, relationError);
              // Continue without this related data if fetch fails
            }
          }
        }
        
        // 2. Generate PDF using pdf-lib
        const pdfBytes = await generatePDF(normalizedType, documentData);
        if (!pdfBytes) {
          throw new Error(`Failed to generate PDF for ${normalizedType} ${id}`);
        }
        console.log(`Generated PDF for ${normalizedType} ${id}`);

        // Generate filename using the document UID if available
        let fileName = ''; // Default fallback
        
        // Extract UID field from configuration
        const uidField = config.uidField;
        if (uidField && documentData[uidField]) {
          fileName = `${documentData[uidField]}.pdf`;
        } else {
          // Fallback if no UID is found
          fileName = `${id}.pdf`;
        }
        
        // Store files in type-specific folders based on config
        const storageKey = `${config.storageFolder}/${fileName}`;
        
        // Check if the pdfs bucket exists
        try {
          console.log(`Checking if 'pdfs' bucket exists...`);
          const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
          
          if (bucketError) {
            console.warn(`Error listing buckets: ${bucketError.message}`);
          } else {
            console.log(`Available buckets: ${buckets.map(b => b.name).join(', ')}`);
            if (!buckets.some(b => b.name === 'pdfs')) {
              console.warn(`'pdfs' bucket not found in available buckets!`);
            }
          }
        } catch (bucketCheckError) {
          console.warn(`Error checking buckets: ${bucketCheckError.message}`);
        }
        
        console.log(`Attempting to upload PDF to 'pdfs/${storageKey}' bucket...`);
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('pdfs')
          .upload(storageKey, pdfBytes, {
            contentType: 'application/pdf',
            upsert: true,
          });
        
        if (uploadData) {
          console.log(`Upload successful, data:`, uploadData);
        }

        if (uploadError) {
          throw new Error(
            `Failed to upload PDF for ${normalizedType} ${id}: ${uploadError.message}`,
          );
        }
        console.log(`Uploaded PDF to storage for ${normalizedType} ${id} at ${storageKey}`);

        // 4. Get Public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('pdfs')
          .getPublicUrl(storageKey);

        if (!urlData?.publicUrl) {
          console.warn(`Could not get public URL for ${storageKey}. Using path.`);
        }
        const publicUrl = urlData?.publicUrl || storageKey;
        console.log(`Got public URL for ${normalizedType} ${id}: ${publicUrl}`);

        // 5. Update Database Record
        const { error: updateError } = await supabaseAdmin
          .from(config.tableName)
          .update({ supabase_pdf_url: publicUrl })
          .eq('id', id);

        if (updateError) {
          throw new Error(
            `Failed to update DB for ${normalizedType} ${id}: ${updateError.message}`,
          );
        }
        
        // 6. Send webhook notification if configured
        try {
          // Get webhook URL from vault
          const { data: webhookData, error: webhookError } = await supabaseAdmin
            .from('vault.secrets')
            .select('secret')
            .eq('name', 'n8n_pdf_webhook')
            .single();
            
          if (webhookError) {
            console.warn(`Could not retrieve webhook URL from vault: ${webhookError.message}`);
          } else if (webhookData?.secret) {
            console.log(`Sending webhook notification for ${normalizedType} ${id}`);
            
            // Prepare notification payload with metadata
            const notificationPayload = {
              event: 'pdf_generated',
              timestamp: new Date().toISOString(),
              documentType: normalizedType,
              documentId: id,
              glideRowId: documentData.glide_row_id,
              documentUid: documentData.invoice_uid || documentData.estimate_uid || documentData.purchase_order_uid,
              pdfUrl: publicUrl,
              tableUpdated: config.tableName,
              storageKey: storageKey,
              fromFunction: 'batch-generate-and-store-pdfs'
            };
            
            // Send webhook notification
            const webhookResponse = await fetch(webhookData.secret, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(notificationPayload)
            });
            
            if (!webhookResponse.ok) {
              console.warn(`Webhook notification failed: ${webhookResponse.status} ${webhookResponse.statusText}`);
            } else {
              console.log(`Webhook notification sent successfully for ${normalizedType} ${id}`);
            }
          }
        } catch (webhookError) {
          // Log webhook error but don't fail the operation
          console.error(`Error sending webhook notification: ${webhookError.message}`);
        }

        // Record success
        itemResult = { ...itemResult, success: true, url: publicUrl };
      } catch (error) {
        console.error(
          `Error processing document ${id}:`,
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
