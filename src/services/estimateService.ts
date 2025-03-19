
import { supabase } from '@/integrations/supabase/client';
import { Estimate, EstimateLine, CustomerCredit } from '@/types/estimate';
import { GlAccount, ProductDetails } from '@/types';

// Fetch all estimates with basic info
export async function fetchEstimatesList() {
  const { data, error } = await supabase
    .from('gl_estimates')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Fetch account for an estimate
export async function fetchEstimateAccount(accountGlideId: string | undefined | null) {
  if (!accountGlideId) return null;
  
  const { data, error } = await supabase
    .from('gl_accounts')
    .select('*')
    .eq('glide_row_id', accountGlideId)
    .single();
    
  if (error) {
    console.error('Error fetching account:', error);
    return null;
  }
  return data;
}

// Fetch product details for a given product ID
export async function fetchProductDetails(productGlideId: string | undefined | null): Promise<ProductDetails | null> {
  if (!productGlideId) return null;
  
  const { data, error } = await supabase
    .from('gl_products')
    .select('*')
    .eq('glide_row_id', productGlideId)
    .single();
    
  if (error) {
    console.error('Error fetching product details:', error);
    return null;
  }
  
  if (!data) return null;
  
  return {
    id: data.id,
    glide_row_id: data.glide_row_id,
    name: data.display_name || data.new_product_name || data.vendor_product_name || 'Unnamed Product',
    display_name: data.display_name,
    vendor_product_name: data.vendor_product_name,
    new_product_name: data.new_product_name,
    cost: data.cost,
    total_qty_purchased: data.total_qty_purchased,
    category: data.category,
    product_image1: data.product_image1,
    purchase_notes: data.purchase_notes,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

// Fetch estimate lines with product details
export async function fetchEstimateLines(estimateGlideId: string) {
  const { data: lines, error } = await supabase
    .from('gl_estimate_lines')
    .select('*')
    .eq('rowid_estimate_lines', estimateGlideId);
  
  if (error) throw error;
  if (!lines || lines.length === 0) return [];
  
  // Fetch product details for each line that has a product reference
  const enhancedLines = await Promise.all(lines.map(async (line) => {
    if (line.rowid_products) {
      const productDetails = await fetchProductDetails(line.rowid_products);
      return {
        ...line,
        productDetails: productDetails || undefined
      };
    }
    return line;
  }));
  
  return enhancedLines;
}

// Fetch credits for an estimate
export async function fetchEstimateCredits(estimateGlideId: string) {
  const { data, error } = await supabase
    .from('gl_customer_credits')
    .select('*')
    .eq('rowid_estimates', estimateGlideId);
  
  if (error) throw error;
  return data || [];
}

// Get a single estimate with full details
export async function fetchEstimateDetails(id: string): Promise<Estimate | null> {
  try {
    // Get the main estimate data
    const { data: estimate, error: estimateError } = await supabase
      .from('gl_estimates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (estimateError) throw estimateError;
    
    // Get account data
    const account = await fetchEstimateAccount(estimate.rowid_accounts);
    
    // Get estimate lines with product details and credits
    const estimateLines = await fetchEstimateLines(estimate.glide_row_id);
    const credits = await fetchEstimateCredits(estimate.glide_row_id);
    
    // Cast status to the expected enum type
    const status = estimate.status as 'draft' | 'pending' | 'converted';
    
    return {
      ...estimate,
      accountName: account?.account_name || 'Unknown',
      account: account as GlAccount | undefined,
      estimateLines: estimateLines as EstimateLine[],
      credits: credits as CustomerCredit[],
      status: status
    };
  } catch (error) {
    console.error('Error in fetchEstimateDetails:', error);
    return null;
  }
}

// Create a new estimate
export async function createEstimateRecord(estimateData: Partial<Estimate>) {
  // Create glide_row_id for the estimate
  const glideRowId = `EST-${Date.now()}`;
  
  // Basic estimate data
  const newEstimate = {
    status: 'draft' as const,
    glide_row_id: glideRowId,
    rowid_accounts: estimateData.rowid_accounts,
    estimate_date: estimateData.estimate_date || new Date().toISOString(),
    add_note: estimateData.add_note || false,
    is_a_sample: estimateData.is_a_sample || false,
    total_amount: 0,
    total_credits: 0,
    balance: 0
  };
  
  const { data, error } = await supabase
    .from('gl_estimates')
    .insert(newEstimate)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Update an estimate
export async function updateEstimateRecord(id: string, estimateData: Partial<Estimate>) {
  // Remove nested objects before updating
  const { account, estimateLines, credits, accountName, ...updateData } = estimateData;
  
  const { data, error } = await supabase
    .from('gl_estimates')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Delete an estimate and related records
export async function deleteEstimateRecord(id: string) {
  // First, get the glide_row_id
  const { data: estimate } = await supabase
    .from('gl_estimates')
    .select('glide_row_id')
    .eq('id', id)
    .single();
  
  if (!estimate) throw new Error('Estimate not found');
  
  // Delete related records first
  await supabase
    .from('gl_estimate_lines')
    .delete()
    .eq('rowid_estimate_lines', estimate.glide_row_id);
  
  await supabase
    .from('gl_customer_credits')
    .delete()
    .eq('rowid_estimates', estimate.glide_row_id);
  
  // Finally delete the estimate
  const { error } = await supabase
    .from('gl_estimates')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// Add a new estimate line
export async function addEstimateLine(estimateGlideId: string, lineData: Partial<EstimateLine>) {
  const newLine = {
    ...lineData,
    rowid_estimate_lines: estimateGlideId,
    glide_row_id: `EL-${Date.now()}`,
    line_total: (lineData.qty_sold || 0) * (lineData.selling_price || 0)
  };
  
  const { data, error } = await supabase
    .from('gl_estimate_lines')
    .insert(newLine)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Update an estimate line
export async function updateEstimateLine(lineId: string, lineData: Partial<EstimateLine>) {
  // Calculate line total if qty or price is updated
  let updateData = { ...lineData };
  if (lineData.qty_sold !== undefined || lineData.selling_price !== undefined) {
    const { data: existingLine } = await supabase
      .from('gl_estimate_lines')
      .select('qty_sold, selling_price')
      .eq('id', lineId)
      .single();
      
    const qty = lineData.qty_sold ?? existingLine?.qty_sold ?? 0;
    const price = lineData.selling_price ?? existingLine?.selling_price ?? 0;
    updateData.line_total = qty * price;
  }
  
  const { data, error } = await supabase
    .from('gl_estimate_lines')
    .update(updateData)
    .eq('id', lineId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Delete an estimate line
export async function deleteEstimateLine(lineId: string) {
  const { error } = await supabase
    .from('gl_estimate_lines')
    .delete()
    .eq('id', lineId);
  
  if (error) throw error;
  return true;
}

// Add a customer credit
export async function addCustomerCredit(estimateGlideId: string, creditData: Partial<CustomerCredit>) {
  const newCredit = {
    ...creditData,
    rowid_estimates: estimateGlideId,
    glide_row_id: `CR-${Date.now()}`
  };
  
  const { data, error } = await supabase
    .from('gl_customer_credits')
    .insert(newCredit)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Update a customer credit
export async function updateCustomerCredit(creditId: string, creditData: Partial<CustomerCredit>) {
  const { data, error } = await supabase
    .from('gl_customer_credits')
    .update(creditData)
    .eq('id', creditId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Delete a customer credit
export async function deleteCustomerCredit(creditId: string) {
  const { error } = await supabase
    .from('gl_customer_credits')
    .delete()
    .eq('id', creditId);
  
  if (error) throw error;
  return true;
}

// Convert estimate to invoice
export async function convertEstimateToInvoice(estimateId: string) {
  // Get the estimate details first
  const estimate = await fetchEstimateDetails(estimateId);
  if (!estimate) throw new Error('Estimate not found');
  
  // Create a new invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('gl_invoices')
    .insert({
      rowid_accounts: estimate.rowid_accounts,
      glide_row_id: `INV-${Date.now()}`,
      notes: estimate.add_note ? 'Converted from estimate' : null,
      created_timestamp: new Date().toISOString(),
      payment_status: 'unpaid'
    })
    .select()
    .single();
  
  if (invoiceError) throw invoiceError;
  
  // Copy estimate lines to invoice lines
  if (estimate.estimateLines && estimate.estimateLines.length > 0) {
    const invoiceLines = estimate.estimateLines.map(line => ({
      rowid_invoices: invoice.glide_row_id,
      renamed_product_name: line.sale_product_name,
      qty_sold: line.qty_sold,
      selling_price: line.selling_price,
      line_total: line.line_total,
      product_sale_note: line.product_sale_note,
      date_of_sale: new Date().toISOString(),
      rowid_products: line.rowid_products, // Preserve the product reference
      glide_row_id: `IL-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    }));
    
    const { error: linesError } = await supabase
      .from('gl_invoice_lines')
      .insert(invoiceLines);
    
    if (linesError) throw linesError;
  }
  
  // Update the estimate as converted and link to the invoice
  const { error: updateError } = await supabase
    .from('gl_estimates')
    .update({
      status: 'converted' as const,
      valid_final_create_invoice_clicked: true,
      rowid_invoices: invoice.glide_row_id
    })
    .eq('id', estimateId);
  
  if (updateError) throw updateError;
  
  return invoice;
}
