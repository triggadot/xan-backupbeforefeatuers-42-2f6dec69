import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductDetail } from '@/types/products';
import { Account } from '@/types/accounts';
import { PurchaseOrder } from '@/types/purchase-orders';
import { Invoice } from '@/types/invoices';
import { Estimate } from '@/types/estimates';

/**
 * Hook for fetching detailed information about a specific product
 * @param productId - The glide_row_id of the product to fetch
 * @returns Query result containing detailed product data including relationships
 */
export const useProductDetail = (productId: string | undefined) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) {
        throw new Error('Product ID is required');
      }

      // Fetch the product
      const { data: product, error: productError } = await supabase
        .from('gl_products')
        .select('*')
        .eq('glide_row_id', productId)
        .single();

      if (productError) {
        throw new Error(`Error fetching product: ${productError.message}`);
      }

      if (!product) {
        throw new Error('Product not found');
      }

      // Fetch vendor account if available
      let vendor = null;
      if (product.rowid_accounts) {
        const { data: vendorData, error: vendorError } = await supabase
          .from('gl_accounts')
          .select('*')
          .eq('glide_row_id', product.rowid_accounts)
          .single();
          
        if (vendorError) {
          console.error(`Error fetching vendor: ${vendorError.message}`);
        } else if (vendorData) {
          vendor = vendorData;
        }
      }

      // Fetch related invoice lines
      const { data: invoiceLines, error: invoiceLinesError } = await supabase
        .from('gl_invoice_lines')
        .select('*')
        .eq('rowid_products', productId);

      if (invoiceLinesError) {
        console.error(`Error fetching invoice lines: ${invoiceLinesError.message}`);
      }
      
      const processedInvoiceLines = invoiceLines || [];

      // Fetch related invoices if we have invoice lines
      if (processedInvoiceLines.length > 0) {
        // Get all unique invoice IDs
        const invoiceIds = processedInvoiceLines
          .map(line => line.rowid_invoices)
          .filter((id): id is string => id !== null && id !== undefined);
        
        if (invoiceIds.length > 0) {
          // Fetch all invoices in one request
          const { data: invoicesData, error: invoicesError } = await supabase
            .from('gl_invoices')
            .select('*')
            .in('glide_row_id', invoiceIds);
          
          if (invoicesError) {
            console.error(`Error fetching invoices: ${invoicesError.message}`);
          } else if (invoicesData) {
            // Create a lookup map for invoices
            const invoiceMap = new Map<string, Invoice>();
            invoicesData.forEach(invoice => {
              invoiceMap.set(invoice.glide_row_id, invoice);
            });
            
            // Join invoice lines with invoices
            processedInvoiceLines.forEach(line => {
              if (line.rowid_invoices) {
                line.invoice = invoiceMap.get(line.rowid_invoices);
              }
            });

            // Fetch accounts for invoices
            const accountIds = invoicesData
              .map(invoice => invoice.rowid_accounts)
              .filter((id): id is string => id !== null && id !== undefined);

            if (accountIds.length > 0) {
              const { data: accountsData, error: accountsError } = await supabase
                .from('gl_accounts')
                .select('*')
                .in('glide_row_id', accountIds);

              if (accountsError) {
                console.error(`Error fetching invoice accounts: ${accountsError.message}`);
              } else if (accountsData) {
                // Create a lookup map for accounts
                const accountMap = new Map<string, Account>();
                accountsData.forEach(account => {
                  accountMap.set(account.glide_row_id, account);
                });

                // Join invoices with accounts
                for (const line of processedInvoiceLines) {
                  if (line.invoice && line.invoice.rowid_accounts) {
                    line.invoice.account = accountMap.get(line.invoice.rowid_accounts);
                  }
                }
              }
            }
          }
        }
      }

      // Fetch purchase order if available
      let purchaseOrder = null;
      if (product.rowid_purchase_orders) {
        const { data: po, error: poError } = await supabase
          .from('gl_purchase_orders')
          .select('*')
          .eq('glide_row_id', product.rowid_purchase_orders)
          .single();

        if (poError) {
          console.error(`Error fetching purchase order: ${poError.message}`);
        } else if (po) {
          purchaseOrder = po;
          
          // Fetch account for purchase order
          if (po.rowid_accounts) {
            const { data: poAccount, error: poAccountError } = await supabase
              .from('gl_accounts')
              .select('*')
              .eq('glide_row_id', po.rowid_accounts)
              .single();
              
            if (poAccountError) {
              console.error(`Error fetching purchase order account: ${poAccountError.message}`);
            } else if (poAccount) {
              purchaseOrder.account = poAccount;
            }
          }
        }
      }

      // Fetch estimate lines related to this product
      const { data: estimateLines, error: estimateLinesError } = await supabase
        .from('gl_estimate_lines')
        .select('*')
        .eq('rowid_products', productId);

      if (estimateLinesError) {
        console.error(`Error fetching estimate lines: ${estimateLinesError.message}`);
      }
      
      const processedEstimateLines = estimateLines || [];

      // Fetch related estimates if we have estimate lines
      if (processedEstimateLines.length > 0) {
        // Get all unique estimate IDs
        const estimateIds = processedEstimateLines
          .map(line => line.rowid_estimates)
          .filter((id): id is string => id !== null && id !== undefined);
        
        if (estimateIds.length > 0) {
          // Fetch all estimates in one request
          const { data: estimatesData, error: estimatesError } = await supabase
            .from('gl_estimates')
            .select('*')
            .in('glide_row_id', estimateIds);
          
          if (estimatesError) {
            console.error(`Error fetching estimates: ${estimatesError.message}`);
          } else if (estimatesData) {
            // Create a lookup map for estimates
            const estimateMap = new Map<string, Estimate>();
            estimatesData.forEach(estimate => {
              estimateMap.set(estimate.glide_row_id, estimate);
            });
            
            // Join estimate lines with estimates
            processedEstimateLines.forEach(line => {
              if (line.rowid_estimates) {
                line.estimate = estimateMap.get(line.rowid_estimates);
              }
            });

            // Fetch accounts for estimates
            const accountIds = estimatesData
              .map(estimate => estimate.rowid_accounts)
              .filter((id): id is string => id !== null && id !== undefined);

            if (accountIds.length > 0) {
              const { data: accountsData, error: accountsError } = await supabase
                .from('gl_accounts')
                .select('*')
                .in('glide_row_id', accountIds);

              if (accountsError) {
                console.error(`Error fetching estimate accounts: ${accountsError.message}`);
              } else if (accountsData) {
                // Create a lookup map for accounts
                const accountMap = new Map<string, Account>();
                accountsData.forEach(account => {
                  accountMap.set(account.glide_row_id, account);
                });

                // Join estimates with accounts
                for (const line of processedEstimateLines) {
                  if (line.estimate && line.estimate.rowid_accounts) {
                    line.estimate.account = accountMap.get(line.estimate.rowid_accounts);
                  }
                }
              }
            }
          }
        }
      }
      
      // Fetch vendor payments related to this product
      const { data: vendorPayments, error: vendorPaymentsError } = await supabase
        .from('gl_vendor_payments')
        .select('*')
        .eq('rowid_products', productId);
        
      if (vendorPaymentsError) {
        console.error(`Error fetching vendor payments: ${vendorPaymentsError.message}`);
      }
      
      const processedVendorPayments = vendorPayments || [];
      
      // Process vendor payments
      if (processedVendorPayments.length > 0) {
        // Fetch accounts for vendor payments
        const accountIds = processedVendorPayments
          .map(payment => payment.rowid_accounts)
          .filter((id): id is string => id !== null && id !== undefined);
          
        if (accountIds.length > 0) {
          const { data: accountsData, error: accountsError } = await supabase
            .from('gl_accounts')
            .select('*')
            .in('glide_row_id', accountIds);
            
          if (accountsError) {
            console.error(`Error fetching vendor payment accounts: ${accountsError.message}`);
          } else if (accountsData) {
            // Create a lookup map for accounts
            const accountMap = new Map<string, Account>();
            accountsData.forEach(account => {
              accountMap.set(account.glide_row_id, account);
            });
            
            // Join vendor payments with accounts
            processedVendorPayments.forEach(payment => {
              if (payment.rowid_accounts) {
                payment.account = accountMap.get(payment.rowid_accounts);
              }
            });
          }
        }
        
        // Fetch purchase orders for vendor payments
        const poIds = processedVendorPayments
          .map(payment => payment.rowid_purchase_orders)
          .filter((id): id is string => id !== null && id !== undefined);
          
        if (poIds.length > 0) {
          const { data: poData, error: poError } = await supabase
            .from('gl_purchase_orders')
            .select('*')
            .in('glide_row_id', poIds);
            
          if (poError) {
            console.error(`Error fetching vendor payment POs: ${poError.message}`);
          } else if (poData) {
            // Create a lookup map for purchase orders
            const poMap = new Map<string, PurchaseOrder>();
            poData.forEach(po => {
              poMap.set(po.glide_row_id, po);
            });
            
            // Join vendor payments with purchase orders
            processedVendorPayments.forEach(payment => {
              if (payment.rowid_purchase_orders) {
                payment.purchaseOrder = poMap.get(payment.rowid_purchase_orders);
              }
            });
          }
        }
      }

      return {
        ...product,
        vendor,
        purchaseOrder,
        invoiceLines: processedInvoiceLines,
        estimateLines: processedEstimateLines,
        vendorPayments: processedVendorPayments,
      } as ProductDetail;
    },
    enabled: !!productId,
  });
};

export default useProductDetail;
