
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { InvoiceCardGrid } from './InvoiceCardGrid';
import { InvoiceWithAccount, normalizeInvoiceFields } from '@/types/invoices/invoice';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvoiceCardPage() {
  const [invoices, setInvoices] = useState<InvoiceWithAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        // Fetch invoices
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('gl_invoices')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (invoiceError) throw invoiceError;
        
        // Fetch accounts for each invoice
        const accountsPromises = invoiceData.map(async (invoice) => {
          if (!invoice.rowid_accounts) return null;
          
          const { data: accountData, error: accountError } = await supabase
            .from('gl_accounts')
            .select('*')
            .eq('glide_row_id', invoice.rowid_accounts)
            .single();
          
          if (accountError) return null;
          return accountData;
        });
        
        const accounts = await Promise.all(accountsPromises);
        
        // Fetch invoice lines
        const linesPromises = invoiceData.map(async (invoice) => {
          const { data: lines, error: linesError } = await supabase
            .from('gl_invoice_lines')
            .select('*')
            .eq('rowid_invoices', invoice.glide_row_id);
          
          if (linesError) return [];
          return lines || [];
        });
        
        const allLines = await Promise.all(linesPromises);
        
        // Build normalized invoices with accounts and lines
        const normalizedInvoices = invoiceData.map((invoice, index) => {
          const normalized = normalizeInvoiceFields(invoice);
          normalized.account = accounts[index] || undefined;
          normalized.lines = allLines[index] || [];
          return normalized;
        });
        
        setInvoices(normalizedInvoices);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <h3 className="font-bold">Error loading invoices</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return <InvoiceCardGrid invoices={invoices} isLoading={isLoading} />;
}
