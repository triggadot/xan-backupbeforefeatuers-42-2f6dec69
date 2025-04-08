import { useState } from 'react';
import { 
  generateAndStorePDF, 
  PDFErrorType, 
  PDFOperationResult 
} from '@/lib/pdf-utils';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for generating PDFs using the same data fetching logic as detail views
 * 
 * @returns Functions for generating PDFs for different document types
 * 
 * @example
 * // In a component:
 * const { generateInvoicePDF, isGenerating } = usePDFGeneration();
 * 
 * const handleGeneratePDF = async () => {
 *   const result = await generateInvoicePDF('invoice-123', true);
 *   if (result.success) {
 *     console.log('PDF generated and available at:', result.url);
 *   } else {
 *     console.error('PDF generation failed:', result.error?.message);
 *   }
 * };
 */
export function usePDFGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<PDFOperationResult | null>(null);

  /**
   * Fetch invoice data from the database
   * 
   * @param invoiceId - ID of the invoice
   * @returns Promise resolving to the invoice data or null if not found
   */
  const fetchInvoiceData = async (invoiceId: string) => {
    try {
      // Fetch the invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('gl_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;
      if (!invoice) throw new Error('Invoice not found');

      // Fetch account information
      let account = null;
      if (invoice.rowid_accounts) {
        const { data: accountData, error: accountError } = await supabase
          .from('gl_accounts')
          .select('*')
          .eq('glide_row_id', invoice.rowid_accounts)
          .single();

        if (!accountError && accountData) {
          account = accountData;
        }
      }

      // Fetch invoice lines
      const { data: lineData, error: lineError } = await supabase
        .from('gl_invoice_lines')
        .select('*')
        .eq('rowid_invoices', invoice.glide_row_id);

      if (lineError) throw lineError;

      // Combine all data
      return {
        ...invoice,
        lines: lineData || [],
        account
      };
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      throw error;
    }
  };

  /**
   * Fetch purchase order data from the database
   * 
   * @param purchaseOrderId - ID of the purchase order
   * @returns Promise resolving to the purchase order data or null if not found
   */
  const fetchPurchaseOrderData = async (purchaseOrderId: string) => {
    try {
      // Fetch purchase order
      const { data: purchaseOrder, error: purchaseOrderError } = await supabase
        .from('gl_purchase_orders')
        .select('*')
        .eq('id', purchaseOrderId)
        .single();

      if (purchaseOrderError) throw purchaseOrderError;
      if (!purchaseOrder) throw new Error('Purchase order not found');

      // Fetch vendor information
      let vendor = null;
      if (purchaseOrder.rowid_accounts) {
        const { data: accountData, error: accountError } = await supabase
          .from('gl_accounts')
          .select('*')
          .eq('glide_row_id', purchaseOrder.rowid_accounts)
          .single();

        if (!accountError && accountData) {
          vendor = accountData;
        }
      }

      // Fetch purchase order lines
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('gl_purchase_order_lines')
        .select('*')
        .eq('rowid_purchase_order', purchaseOrder.glide_row_id);

      if (lineItemsError) throw lineItemsError;

      // Combine all data
      return {
        ...purchaseOrder,
        lineItems: lineItems || [],
        vendor
      };
    } catch (error) {
      console.error('Error fetching purchase order data:', error);
      throw error;
    }
  };

  /**
   * Fetch estimate data from the database
   * 
   * @param estimateId - ID of the estimate
   * @returns Promise resolving to the estimate data or null if not found
   */
  const fetchEstimateData = async (estimateId: string) => {
    try {
      // Fetch the estimate
      const { data: estimate, error: estimateError } = await supabase
        .from('gl_estimates')
        .select('*')
        .eq('id', estimateId)
        .single();

      if (estimateError) throw estimateError;
      if (!estimate) throw new Error('Estimate not found');

      // Fetch account information
      let account = null;
      if (estimate.rowid_accounts) {
        const { data: accountData, error: accountError } = await supabase
          .from('gl_accounts')
          .select('*')
          .eq('glide_row_id', estimate.rowid_accounts)
          .single();

        if (!accountError && accountData) {
          account = accountData;
        }
      }

      // Fetch estimate lines
      const { data: lineData, error: lineError } = await supabase
        .from('gl_estimate_lines')
        .select('*')
        .eq('rowid_estimates', estimate.glide_row_id);

      if (lineError) throw lineError;

      // Combine all data
      return {
        ...estimate,
        estimateLines: lineData || [],
        account
      };
    } catch (error) {
      console.error('Error fetching estimate data:', error);
      throw error;
    }
  };

  /**
   * Generate a PDF for an invoice
   * 
   * @param invoiceId - ID of the invoice
   * @param download - Whether to download the PDF after generation
   * @returns Promise resolving to the PDF operation result
   * 
   * @example
   * const result = await generateInvoicePDF('invoice-123');
   * if (result.success) {
   *   console.log('PDF URL:', result.url);
   * }
   */
  const generateInvoicePDF = async (invoiceId: string, download: boolean = false): Promise<PDFOperationResult> => {
    setIsGenerating(true);
    const result: PDFOperationResult = {
      success: false
    };

    try {
      // Fetch invoice data
      const invoiceData = await fetchInvoiceData(invoiceId);
      
      // Generate and store the PDF
      const pdfUrl = await generateAndStorePDF('invoice', invoiceData, false, download);
      
      if (pdfUrl) {
        result.success = true;
        result.url = pdfUrl;
      } else {
        result.error = {
          type: PDFErrorType.GENERATION_ERROR,
          message: 'Failed to generate or store invoice PDF'
        };
      }
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      result.error = {
        type: PDFErrorType.FETCH_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error fetching invoice data',
        details: error
      };
    } finally {
      setIsGenerating(false);
      setLastResult(result);
    }

    return result;
  };

  /**
   * Generate a PDF for a purchase order
   * 
   * @param purchaseOrderId - ID of the purchase order
   * @param download - Whether to download the PDF after generation
   * @returns Promise resolving to the PDF operation result
   * 
   * @example
   * const result = await generatePurchaseOrderPDF('po-123');
   * if (result.success) {
   *   console.log('PDF URL:', result.url);
   * }
   */
  const generatePurchaseOrderPDF = async (purchaseOrderId: string, download: boolean = false): Promise<PDFOperationResult> => {
    setIsGenerating(true);
    const result: PDFOperationResult = {
      success: false
    };

    try {
      // Fetch purchase order data
      const purchaseOrderData = await fetchPurchaseOrderData(purchaseOrderId);
      
      // Generate and store the PDF
      const pdfUrl = await generateAndStorePDF('purchaseOrder', purchaseOrderData, false, download);
      
      if (pdfUrl) {
        result.success = true;
        result.url = pdfUrl;
      } else {
        result.error = {
          type: PDFErrorType.GENERATION_ERROR,
          message: 'Failed to generate or store purchase order PDF'
        };
      }
    } catch (error) {
      console.error('Error generating purchase order PDF:', error);
      result.error = {
        type: PDFErrorType.FETCH_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error fetching purchase order data',
        details: error
      };
    } finally {
      setIsGenerating(false);
      setLastResult(result);
    }

    return result;
  };

  /**
   * Generate a PDF for an estimate
   * 
   * @param estimateId - ID of the estimate
   * @param download - Whether to download the PDF after generation
   * @returns Promise resolving to the PDF operation result
   * 
   * @example
   * const result = await generateEstimatePDF('est-123');
   * if (result.success) {
   *   console.log('PDF URL:', result.url);
   * }
   */
  const generateEstimatePDF = async (estimateId: string, download: boolean = false): Promise<PDFOperationResult> => {
    setIsGenerating(true);
    const result: PDFOperationResult = {
      success: false
    };

    try {
      // Fetch estimate data
      const estimateData = await fetchEstimateData(estimateId);
      
      // Generate and store the PDF
      const pdfUrl = await generateAndStorePDF('estimate', estimateData, false, download);
      
      if (pdfUrl) {
        result.success = true;
        result.url = pdfUrl;
      } else {
        result.error = {
          type: PDFErrorType.GENERATION_ERROR,
          message: 'Failed to generate or store estimate PDF'
        };
      }
    } catch (error) {
      console.error('Error generating estimate PDF:', error);
      result.error = {
        type: PDFErrorType.FETCH_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error fetching estimate data',
        details: error
      };
    } finally {
      setIsGenerating(false);
      setLastResult(result);
    }

    return result;
  };

  return {
    isGenerating,
    lastResult,
    generateInvoicePDF,
    generatePurchaseOrderPDF,
    generateEstimatePDF
  };
}
