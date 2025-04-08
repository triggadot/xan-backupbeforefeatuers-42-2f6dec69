import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { 
 formatCurrency, 
 formatShortDate, 
 generateFilename,
 PDFErrorType,
 PDFOperationResult,
 createPDFError,
 createPDFSuccess
} from './common';
import { saveAs } from 'file-saver';

export type Invoice = Database['public']['Tables']['gl_invoices']['Row'];
export type InvoiceLine = Database['public']['Tables']['gl_invoice_lines']['Row'] & {
 product?: {
   display_name: string;
   id: string;
   glide_row_id: string;
 };
};

export interface InvoiceWithDetails extends Invoice {
 lines: InvoiceLine[];
 account?: Database['public']['Tables']['gl_accounts']['Row'];
}

export async function fetchInvoiceForPDF(invoiceId: string): Promise<InvoiceWithDetails | null> {
 try {
   let { data: invoiceData, error: invoiceError } = await supabase
     .from('gl_invoices')
     .select('*')
     .eq('id', invoiceId)
     .maybeSingle();

   if (!invoiceData) {
     const { data, error } = await supabase
       .from('gl_invoices')
       .select('*')
       .eq('glide_row_id', invoiceId)
       .maybeSingle();
     
     invoiceData = data;
     invoiceError = error;
   }

   if (invoiceError || !invoiceData) return null;

   const invoiceWithDetails: InvoiceWithDetails = {
     ...invoiceData,
     total_amount: Number(invoiceData.total_amount) || 0,
     total_paid: Number(invoiceData.total_paid) || 0,
     balance: Number(invoiceData.balance) || 0,
     tax_rate: Number(invoiceData.tax_rate) || 0,
     tax_amount: Number(invoiceData.tax_amount) || 0,
     lines: []
   };

   const productsMap = new Map();
   const { data: productsData } = await supabase.from('gl_products').select('*');
   
   if (productsData) {
     productsData.forEach((product: any) => {
       productsMap.set(product.glide_row_id, {
         display_name: product.vendor_product_name || product.main_new_product_name || 'Unknown Product',
         id: product.id,
         glide_row_id: product.glide_row_id
       });
     });
   }

   const { data: linesData } = await supabase
     .from('gl_invoice_lines')
     .select('*')
     .eq('rowid_invoices', invoiceData.glide_row_id);

   if (linesData?.length) {
     invoiceWithDetails.lines = linesData.map((line: any) => ({
       ...line,
       qty_sold: Number(line.qty_sold) || 0,
       selling_price: Number(line.selling_price) || 0,
       line_total: Number(line.line_total) || 0,
       product: line.rowid_products ? productsMap.get(line.rowid_products) : null
     }));
   }

   if (invoiceData.rowid_accounts) {
     const { data: accountData } = await supabase
       .from('gl_accounts')
       .select('*')
       .eq('glide_row_id', invoiceData.rowid_accounts)
       .single();
     
     if (accountData) invoiceWithDetails.account = accountData;
   }

   return invoiceWithDetails;
 } catch (error) {
   console.error('Exception fetching invoice data:', error);
   return null;
 }
}

export function generateInvoicePDF(invoice: InvoiceWithDetails): jsPDF {
 const doc = new jsPDF({
   compress: true, 
   putOnlyUsedFonts: true
 });
 const themeColor = [0, 51, 102];
 
 // Header
 doc.setFontSize(26);
 doc.setFont('helvetica', 'bold');
 doc.text('INVOICE', 15, 20);
 
 // Invoice meta
 doc.setFontSize(10);
 doc.setFont('helvetica', 'normal');
 doc.text(`ID: ${invoice.invoice_uid || ''}`, 15, 28);
 doc.text(`Date: ${formatShortDate(invoice.invoice_date || new Date())}`, 195, 28, { align: 'right' });
 
 // Divider
 doc.setDrawColor(...themeColor);
 doc.setLineWidth(1.5);
 doc.line(15, 32, 195, 32);
 
 // Account details
 let yPos = 40;
 if (invoice.account) {
   doc.setFontSize(11);
   doc.setFont('helvetica', 'bold');
   doc.text(invoice.account.name || '', 15, yPos);
   doc.setFont('helvetica', 'normal');
   
   const addressLines = [
     invoice.account.address_line_1,
     invoice.account.address_line_2,
     [invoice.account.city, invoice.account.state, invoice.account.postal_code].filter(Boolean).join(', '),
     invoice.account.country
   ].filter(Boolean);
   
   doc.setFontSize(9);
   addressLines.forEach(line => {
     yPos += 4.5;
     doc.text(line as string, 15, yPos);
   });
 }
 
 // Table styles with condensed padding and visible alternating rows
 const tableStyles = {
   headStyles: {
     fillColor: themeColor,
     textColor: [255, 255, 255],
     fontStyle: 'bold',
     fontSize: 11,
     cellPadding: 4,
     halign: 'left'
   },
   bodyStyles: {
     textColor: [20, 20, 20],
     fontSize: 10,
     cellPadding: 4
   },
   columnStyles: {
     0: { halign: 'left' },
     1: { halign: 'left' },
     2: { halign: 'left' },
     3: { halign: 'left' }
   },
   alternateRowStyles: {
     fillColor: [240, 240, 245]  // Make alternating colors more distinct
   },
   margin: { top: 5, right: 15, bottom: 5, left: 15 }
 };
 
 // Table data
 const rows = invoice.lines?.map(line => [
   line.renamed_product_name || (line.product?.display_name || ''),
   line.qty_sold || 0,
   formatCurrency(line.selling_price || 0),
   formatCurrency(line.line_total || 0)
 ]) || [];
 
 // Add table
 autoTable(doc, {
   head: [['Product', 'Qty', 'Price', 'Total']],
   body: rows,
   startY: invoice.account ? yPos + 5 : 40,
   tableWidth: 180,
   ...tableStyles,
   didDrawPage: (data) => {
     // Ensure table borders are visible
     doc.setDrawColor(200, 200, 200);
     doc.setLineWidth(0.1);
   }
 });
 
 // Totals section
 const finalY = (doc as any).lastAutoTable.finalY + 8;
 let currentY = finalY;
 
 // Helper function for adding total lines
 const addTotalLine = (label: string, amount: number, bold = false, fontSize = 10) => {
   doc.setFontSize(fontSize);
   if (bold) doc.setFont('helvetica', 'bold');
   else doc.setFont('helvetica', 'normal');
   
   doc.text(`${label}:`, 155, currentY, { align: 'right' });
   doc.text(formatCurrency(amount), 195, currentY, { align: 'right' });
   currentY += 7;
 };
 
 addTotalLine('Subtotal', invoice.total_amount || 0, false, 11);
 addTotalLine('Payments', invoice.total_paid || 0, false, 11);
 
 // Balance due
 const balance = invoice.balance || 0;
 if (balance < 0) {
   doc.setTextColor(0, 150, 0);
 } else if (balance > 0) {
   doc.setTextColor(200, 0, 0);
 }
 addTotalLine('Balance Due', balance, true, 12);
 doc.setTextColor(0, 0, 0);
 
 // Notes section
 if (invoice.invoice_notes) {
   currentY += 5;
   doc.setFontSize(11);
   doc.setFont('helvetica', 'bold');
   doc.text('Notes:', 15, currentY);
   doc.setFont('helvetica', 'normal');
   currentY += 6;
   doc.setFontSize(9);
   
   const splitNotes = doc.splitTextToSize(invoice.invoice_notes, 175);
   doc.text(splitNotes, 15, currentY);
 }
 
 // Footer
 doc.setFontSize(8);
 doc.setTextColor(100, 100, 100);
 for (let i = 1; i <= doc.getNumberOfPages(); i++) {
   doc.setPage(i);
   doc.text(`Page ${i} of ${doc.getNumberOfPages()}`, 195, 287, { align: 'right' });
 }
 
 return doc;
}

export async function generateAndStoreInvoicePDF(
 invoiceId: string | any,
 download = false
): Promise<PDFOperationResult> {
 try {
   const id = typeof invoiceId === 'object' 
     ? (invoiceId.id || invoiceId.glide_row_id || '') 
     : String(invoiceId);
   
   const invoice = await fetchInvoiceForPDF(id);
   if (!invoice) {
     return createPDFError(PDFErrorType.FETCH_ERROR, `Failed to fetch invoice: ${id}`);
   }
   
   const pdfDoc = generateInvoicePDF(invoice);
   const pdfBlob = pdfDoc.output('blob');
   
   // Generate filename using invoice_uid and date
   const filename = invoice.invoice_uid 
     ? `${invoice.invoice_uid}-${formatShortDate(invoice.invoice_date || new Date(), 'YYYYMMDD')}.pdf`
     : generateFilename('INV', invoice.id || id, invoice.invoice_date || new Date());
   
   if (download) {
     try {
       saveAs(pdfBlob, filename);
     } catch (error) {
       console.error('Download error:', error);
     }
   }
   
   return createPDFSuccess(URL.createObjectURL(pdfBlob));
 } catch (error) {
   return createPDFError(
     PDFErrorType.GENERATION_ERROR, 
     error instanceof Error ? error.message : 'Unknown error'
   );
 }
}