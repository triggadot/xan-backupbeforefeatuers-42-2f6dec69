import { useState, useEffect } from 'react';
import { Invoice, InvoiceStatus, InvoiceWithAccount, Account } from '@/types/new/invoice';
import { supabase } from '@/integrations/supabase/client';

interface UseInvoicesReturn {
  invoices: InvoiceWithAccount[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  createInvoice: (invoice: Partial<Invoice>) => Promise<Invoice | null>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<Invoice | null>;
  deleteInvoice: (id: string) => Promise<boolean>;
  getInvoiceById: (id: string) => Promise<Invoice | null>;
}

export function useInvoices(): UseInvoicesReturn {
  const [invoices, setInvoices] = useState<InvoiceWithAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First, get the invoices
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('gl_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invoiceError) {
        console.error('Error fetching invoices:', invoiceError);
        throw new Error(`Error fetching invoices: ${invoiceError.message}`);
      }

      console.log("Raw invoice data:", invoiceData);

      // Initialize transformed invoices with empty lines array
      const transformedInvoices = invoiceData.map((invoice: any) => ({
        id: invoice.id,
        glide_row_id: invoice.glide_row_id,
        rowid_accounts: invoice.rowid_accounts,
        invoice_order_date: invoice.invoice_order_date,
        created_timestamp: invoice.created_timestamp,
        submitted_timestamp: invoice.submitted_timestamp,
        processed: invoice.processed,
        user_email: invoice.user_email,
        notes: invoice.notes,
        doc_glideforeverlink: invoice.doc_glideforeverlink,
        created_at: invoice.created_at,
        updated_at: invoice.updated_at,
        total_amount: Number(invoice.total_amount) || 0,
        total_paid: Number(invoice.total_paid) || 0,
        balance: Number(invoice.balance) || 0,
        payment_status: invoice.payment_status || InvoiceStatus.DRAFT,
        tax_rate: Number(invoice.tax_rate) || 0,
        tax_amount: Number(invoice.tax_amount) || 0,
        due_date: invoice.due_date,
        lines: [], // Initialize with empty lines array
        account: undefined // We'll add account data next
      }));

      // Now, let's get all the accounts
      const { data: accountData, error: accountError } = await supabase
        .from('gl_accounts')
        .select('*');

      if (accountError) {
        console.error('Error fetching accounts:', accountError);
        // Don't throw here, we can still return invoices without account data
      } else if (accountData) {
        console.log("Account data:", accountData);
        
        // Create a lookup map for accounts by glide_row_id
        const accountMap = new Map();
        accountData.forEach((account: any) => {
          accountMap.set(account.glide_row_id, {
            id: account.id,
            glide_row_id: account.glide_row_id,
            account_name: account.account_name,
            email_of_who_added: account.email_of_who_added,
            client_type: account.client_type,
            accounts_uid: account.accounts_uid,
            balance: Number(account.balance) || 0,
            created_at: account.created_at,
            updated_at: account.updated_at
          });
        });

        // Match invoices with their accounts
        for (const invoice of transformedInvoices) {
          if (invoice.rowid_accounts) {
            const account = accountMap.get(invoice.rowid_accounts);
            if (account) {
              invoice.account = account;
            }
          }
        }
      }

      // Now let's get invoice lines for each invoice
      const { data: lineData, error: lineError } = await supabase
        .from('gl_invoice_lines')
        .select('*');

      if (lineError) {
        console.error('Error fetching invoice lines:', lineError);
        // Don't throw here, we can still return invoices without lines
      } else if (lineData) {
        console.log("Invoice line data:", lineData);
        
        // Create a lookup map for lines by rowid_invoices (glide_row_id of invoice)
        const linesByInvoice = new Map();
        lineData.forEach((line: any) => {
          const invoiceId = line.rowid_invoices;
          if (!linesByInvoice.has(invoiceId)) {
            linesByInvoice.set(invoiceId, []);
          }
          linesByInvoice.get(invoiceId).push({
            id: line.id,
            glide_row_id: line.glide_row_id,
            renamed_product_name: line.renamed_product_name,
            date_of_sale: line.date_of_sale,
            rowid_invoices: line.rowid_invoices,
            rowid_products: line.rowid_products,
            qty_sold: Number(line.qty_sold) || 0,
            selling_price: Number(line.selling_price) || 0,
            product_sale_note: line.product_sale_note,
            user_email_of_added: line.user_email_of_added,
            created_at: line.created_at,
            updated_at: line.updated_at,
            line_total: Number(line.line_total) || 0
          });
        });

        // Match invoices with their lines
        for (const invoice of transformedInvoices) {
          if (invoice.glide_row_id) {
            const lines = linesByInvoice.get(invoice.glide_row_id) || [];
            invoice.lines = lines;
          }
        }
      }

      setInvoices(transformedInvoices);
    } catch (err: any) {
      console.error('Error in fetchInvoices:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const createInvoice = async (invoice: Partial<Invoice>): Promise<Invoice | null> => {
    try {
      // Make sure we have a glide_row_id which is required
      const invoiceWithRequiredFields = {
        ...invoice,
        glide_row_id: invoice.glide_row_id || `inv-${Date.now()}`, // Generate a temporary ID if not provided
      };

      const { data, error } = await supabase
        .from('gl_invoices')
        .insert(invoiceWithRequiredFields)
        .select()
        .single();

      if (error) {
        console.error('Error creating invoice:', error);
        throw new Error(`Error creating invoice: ${error.message}`);
      }

      // Refresh the invoice list
      fetchInvoices();
      
      return data as Invoice;
    } catch (err: any) {
      console.error('Error in createInvoice:', err);
      throw err instanceof Error ? err : new Error(String(err));
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<Invoice | null> => {
    try {
      const { data, error } = await supabase
        .from('gl_invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating invoice:', error);
        throw new Error(`Error updating invoice: ${error.message}`);
      }

      // Refresh the invoice list
      fetchInvoices();
      
      return data as Invoice;
    } catch (err: any) {
      console.error('Error in updateInvoice:', err);
      throw err instanceof Error ? err : new Error(String(err));
    }
  };

  const deleteInvoice = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('gl_invoices')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting invoice:', error);
        throw new Error(`Error deleting invoice: ${error.message}`);
      }

      // Refresh the invoice list
      fetchInvoices();
      
      return true;
    } catch (err: any) {
      console.error('Error in deleteInvoice:', err);
      throw err instanceof Error ? err : new Error(String(err));
    }
  };

  const getInvoiceById = async (id: string): Promise<Invoice | null> => {
    try {
      const { data, error } = await supabase
        .from('gl_invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching invoice by ID:', error);
        throw new Error(`Error fetching invoice by ID: ${error.message}`);
      }
      
      return data as Invoice;
    } catch (err: any) {
      console.error('Error in getInvoiceById:', err);
      throw err instanceof Error ? err : new Error(String(err));
    }
  };

  return {
    invoices,
    isLoading,
    error,
    refetch: fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoiceById
  };
}
