import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceLine, InvoiceWithAccount } from '@/types/new/invoice';

interface UseInvoiceDetailReturn {
  invoice: InvoiceWithAccount | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches details for a single invoice, including its line items and account information.
 * @param invoiceId - The ID (UUID) or glide_row_id of the invoice to fetch.
 */
export function useInvoiceDetail(invoiceId: string | undefined): UseInvoiceDetailReturn {
  const [invoice, setInvoice] = useState<InvoiceWithAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) {
      setIsLoading(false);
      setError("Invoice ID is required.");
      setInvoice(null);
      return;
    }

    const fetchInvoiceDetail = async () => {
      setIsLoading(true);
      setError(null);
      setInvoice(null);

      try {
        // Try to fetch invoice by id first
        let { data: invoiceData, error: invoiceError } = await supabase
          .from('gl_invoices')
          .select('*')
          .eq('id', invoiceId)
          .single();

        // If not found by id, try by glide_row_id
        if (!invoiceData && invoiceError) {
          const { data, error } = await supabase
            .from('gl_invoices')
            .select('*')
            .eq('glide_row_id', invoiceId)
            .single();
          
          invoiceData = data;
          invoiceError = error;
        }

        if (invoiceError || !invoiceData) {
          throw new Error(invoiceError?.message || 'Invoice not found.');
        }

        // Log the invoice for debugging
        console.log("Found invoice:", invoiceData);

        // Initialize invoice with empty lines array
        const invoiceWithDetails: InvoiceWithAccount = {
          ...invoiceData,
          total_amount: Number(invoiceData.total_amount) || 0,
          total_paid: Number(invoiceData.total_paid) || 0,
          balance: Number(invoiceData.balance) || 0,
          tax_rate: Number(invoiceData.tax_rate) || 0,
          tax_amount: Number(invoiceData.tax_amount) || 0,
          lines: [],
          account: undefined
        };

        // Fetch all products to get their display_name
        const { data: productsData, error: productsError } = await supabase
          .from('gl_products')
          .select('*');

        if (productsError) {
          console.error('Error fetching products:', productsError);
          // Continue without product data
        }

        // Create lookup map for products by glide_row_id
        const productsMap = new Map();
        if (productsData) {
          productsData.forEach((product: any) => {
            productsMap.set(product.glide_row_id, {
              display_name: product.vendor_product_name || product.main_new_product_name || product.main_vendor_product_name || 'Unknown Product',
              id: product.id,
              glide_row_id: product.glide_row_id
            });
          });
        }

        // Fetch invoice line items using glide_row_id relationship
        const { data: linesData, error: linesError } = await supabase
          .from('gl_invoice_lines')
          .select('*')
          .eq('rowid_invoices', invoiceData.glide_row_id);

        if (linesError) {
          console.error('Error fetching invoice lines:', linesError);
          // We'll still proceed with the invoice, just without line items
        } else if (linesData && linesData.length > 0) {
          console.log("Found invoice lines:", linesData);
          // Transform and add line items to the invoice
          invoiceWithDetails.lines = linesData.map((line: any) => {
            // Get product data if available
            const product = line.rowid_products ? productsMap.get(line.rowid_products) : null;
            
            // Use renamed_product_name if available, otherwise fall back to product display_name
            const productName = line.renamed_product_name || (product ? product.display_name : 'Unknown Product');
            
            return {
              id: line.id,
              glide_row_id: line.glide_row_id,
              renamed_product_name: line.renamed_product_name,
              display_name: productName, // Add a display_name field with the appropriate product name
              date_of_sale: line.date_of_sale,
              rowid_invoices: line.rowid_invoices,
              rowid_products: line.rowid_products,
              qty_sold: Number(line.qty_sold) || 0,
              selling_price: Number(line.selling_price) || 0,
              product_sale_note: line.product_sale_note,
              user_email_of_added: line.user_email_of_added,
              created_at: line.created_at,
              updated_at: line.updated_at,
              line_total: Number(line.line_total) || 0,
              // Store the associated product if available
              product: product || undefined
            };
          });
        }

        // Fetch account information if rowid_accounts is available
        if (invoiceData.rowid_accounts) {
          const { data: accountData, error: accountError } = await supabase
            .from('gl_accounts')
            .select('*')
            .eq('glide_row_id', invoiceData.rowid_accounts)
            .single();

          if (accountError) {
            console.error('Error fetching account:', accountError);
            // We'll still proceed with the invoice, just without account info
          } else if (accountData) {
            console.log("Found account:", accountData);
            // Add account info to the invoice
            invoiceWithDetails.account = {
              id: accountData.id,
              glide_row_id: accountData.glide_row_id,
              account_name: accountData.account_name,
              email_of_who_added: accountData.email_of_who_added,
              client_type: accountData.client_type,
              accounts_uid: accountData.accounts_uid,
              balance: Number(accountData.balance) || 0,
              created_at: accountData.created_at,
              updated_at: accountData.updated_at
            };
          }
        }

        // Set the complete invoice with all details
        setInvoice(invoiceWithDetails);
      } catch (err: any) {
        console.error('Error fetching invoice details:', err);
        setError(err.message || 'Failed to fetch invoice details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceDetail();
  }, [invoiceId]);

  return { invoice, isLoading, error };
}
