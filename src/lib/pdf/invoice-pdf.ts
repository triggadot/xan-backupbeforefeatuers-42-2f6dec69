/**
 * @deprecated This client-side PDF generation is deprecated.
 * Please use the triggerPDFGeneration function from pdf-utils.ts instead,
 * which leverages the standardized pdf-backend edge function.
 *
 * Example:
 * ```typescript
 * import { triggerPDFGeneration } from '@/lib/pdf-utils';
 * const pdfUrl = await triggerPDFGeneration('invoice', invoiceData);
 * ```
 *
 * See /supabase/functions/pdf-backend/README.md for complete documentation.
 */

import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  createPDFFailure,
  createPDFSuccess,
  formatCurrency,
  formatShortDate,
  generateFilename,
  PDFErrorType,
  PDFOperationResult,
} from "./common";

export type Invoice = Database["public"]["Tables"]["gl_invoices"]["Row"];
export type InvoiceLine =
  Database["public"]["Tables"]["gl_invoice_lines"]["Row"] & {
    product?: {
      display_name: string;
      id: string;
      glide_row_id: string;
    };
  };

export interface InvoiceWithDetails extends Invoice {
  lines: InvoiceLine[];
  account?: Database["public"]["Tables"]["gl_accounts"]["Row"];
}

export async function fetchInvoiceForPDF(
  invoiceId: string
): Promise<InvoiceWithDetails | null> {
  try {
    let { data: invoiceData, error: invoiceError } = await supabase
      .from("gl_invoices")
      .select("*")
      .eq("id", invoiceId)
      .maybeSingle();

    if (!invoiceData) {
      const { data, error } = await supabase
        .from("gl_invoices")
        .select("*")
        .eq("glide_row_id", invoiceId)
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
      lines: [],
    };

    const productsMap = new Map();
    const { data: productsData } = await supabase
      .from("gl_products")
      .select("*");

    if (productsData) {
      productsData.forEach(
        (product: Database["public"]["Tables"]["gl_products"]["Row"]) => {
          productsMap.set(product.glide_row_id, {
            display_name:
              product.vendor_product_name ||
              product.main_new_product_name ||
              "Unknown Product",
            id: product.id,
            glide_row_id: product.glide_row_id,
          });
        }
      );
    }

    const { data: linesData } = await supabase
      .from("gl_invoice_lines")
      .select("*, product_name_display")
      .eq("rowid_invoices", invoiceData.glide_row_id);

    if (linesData?.length) {
      invoiceWithDetails.lines = linesData.map(
        (line: Database["public"]["Tables"]["gl_invoice_lines"]["Row"]) => ({
          ...line,
          qty_sold: Number(line.qty_sold) || 0,
          selling_price: Number(line.selling_price) || 0,
          line_total: Number(line.line_total) || 0,
          product: line.rowid_products
            ? productsMap.get(line.rowid_products)
            : null,
        })
      );
    }

    if (invoiceData.rowid_accounts) {
      const { data: accountData } = await supabase
        .from("gl_accounts")
        .select("*")
        .eq("glide_row_id", invoiceData.rowid_accounts)
        .single();

      if (accountData) invoiceWithDetails.account = accountData;
    }

    return invoiceWithDetails;
  } catch (error) {
    console.error("Exception fetching invoice data:", error);
    return null;
  }
}

export function generateInvoicePDF(invoice: InvoiceWithDetails): jsPDF {
  const doc = new jsPDF({
    compress: true,
    putOnlyUsedFonts: true,
  });
  const themeColor = [0, 51, 102];

  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 15, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${invoice.invoice_uid || ""}`, 15, 28);
  doc.text(
    `Date: ${formatShortDate(invoice.date_of_invoice || new Date())}`,
    195,
    28,
    { align: "right" }
  );

  doc.setDrawColor(...themeColor);
  doc.setLineWidth(1.5);
  doc.line(15, 32, 195, 32);

  const tableStartY = 45;

  const tableStyles = {
    theme: "striped",
    headStyles: {
      fillColor: themeColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
      cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
      halign: "left",
    },
    bodyStyles: {
      textColor: [50, 50, 50],
      fontSize: 9,
      fontStyle: "normal",
      cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
    head: [
      [
        { content: "Product", styles: { halign: "left" } },
        { content: "Qty", styles: { halign: "center" } },
        { content: "Price", styles: { halign: "right" } },
        { content: "Total", styles: { halign: "right" } },
      ],
    ],
    margin: { top: 5, right: 10, bottom: 5, left: 15 },
    tableWidth: 180,
  };

  const rows =
    invoice.lines?.map((line) => [
      line.product_name_display ||
        line.renamed_product_name ||
        line.product?.display_name ||
        "",
      line.qty_sold || 0,
      formatCurrency(line.selling_price || 0),
      formatCurrency(line.line_total || 0),
    ]) || [];

  autoTable(doc, {
    ...tableStyles,
    body: rows,
    startY: tableStartY,
  });

  const totalQuantity =
    invoice.lines?.reduce(
      (total, line) => total + Math.round(Number(line.qty_sold) || 0),
      0
    ) || 0;

  const finalY =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 10;
  let currentY = finalY;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const addTotalLine = (label: string, amount: number, isBold = false) => {
    if (isBold) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
    }

    doc.text(`${label}:`, 150, currentY, { align: "right" });
    doc.text(formatCurrency(amount), 195, currentY, { align: "right" });

    doc.setFont("helvetica", "normal");
    currentY += 8;
  };

  addTotalLine(
    `Subtotal (${totalQuantity} item${totalQuantity === 1 ? "" : "s"})`,
    invoice.total_amount || 0
  );
  addTotalLine("Payments", invoice.total_paid || 0);

  const balance = invoice.balance || 0;
  if (balance < 0) {
    doc.setTextColor(0, 100, 0);
  } else if (balance > 0) {
    doc.setTextColor(150, 0, 0);
  }

  addTotalLine("Balance Due", balance, true);
  doc.setTextColor(0, 0, 0);

  if (invoice.invoice_notes) {
    currentY += 5;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 15, currentY);
    doc.setFont("helvetica", "normal");
    currentY += 6;
    doc.setFontSize(9);

    const splitNotes = doc.splitTextToSize(invoice.invoice_notes, 175);
    doc.text(splitNotes, 15, currentY);
  }

  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  for (let i = 1; i <= doc.getNumberOfPages(); i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${doc.getNumberOfPages()}`, 195, 287, {
      align: "right",
    });
  }

  return doc;
}

type InvoiceIdInput = string | { id?: string; glide_row_id?: string };

export async function generateAndStoreInvoicePDF(
  invoiceId: InvoiceIdInput,
  download = false
): Promise<PDFOperationResult> {
  try {
    const id =
      typeof invoiceId === "object"
        ? invoiceId.id || invoiceId.glide_row_id || ""
        : String(invoiceId);

    const invoice = await fetchInvoiceForPDF(id);
    if (!invoice) {
      return createPDFFailure({
        type: PDFErrorType.FETCH_ERROR,
        message: `Failed to fetch invoice with ID: ${id}`,
      });
    }

    const pdfDoc = generateInvoicePDF(invoice);
    const pdfBlob = pdfDoc.output("blob");

    // Use the Supabase-generated invoice_uid directly for the filename
    const filename = invoice.invoice_uid
      ? `${invoice.invoice_uid}.pdf`
      : generateFilename("INV", invoice.id || id);

    // First store the PDF in Supabase regardless of download option
    try {
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string)?.split(",")[1];
          if (base64String) {
            resolve(base64String);
          } else {
            reject(new Error("Failed to read blob as base64"));
          }
        };
        reader.onerror = (error) => reject(error);
      });

      console.log(`Invoking store-pdf for invoice ID: ${invoice.id}`);
      const { data: storageData, error: functionError } =
        await supabase.functions.invoke("store-pdf", {
          body: JSON.stringify({
            documentType: "invoice",
            documentId: invoice.id,
            pdfBase64: base64Data,
            fileName: filename,
          }),
        });

      if (functionError) {
        console.error(
          `Error calling store-pdf function for invoice ${invoice.id}:`,
          functionError
        );
      } else {
        console.log(
          `Successfully stored PDF for invoice ${invoice.id}`,
          storageData
        );

        // Update database with PDF URL if available from storage function
        if (storageData?.url) {
          const { error: updateError } = await supabase
            .from("gl_invoices")
            .update({ supabase_pdf_url: storageData.url })
            .eq("id", invoice.id);

          if (updateError) {
            console.error(
              `Error updating invoice with PDF URL: ${updateError.message}`
            );
          }
        }
      }

      // Handle download separately after attempting storage
      if (download) {
        try {
          saveAs(pdfBlob, filename);
          console.log(`PDF downloaded successfully: ${filename}`);
        } catch (dlError) {
          console.error("Download error:", dlError);
        }
      }
    } catch (storageError) {
      console.error(
        `Error during PDF storage for invoice ${invoice.id}:`,
        storageError
      );

      // If storage fails but download was requested, still try to download
      if (download) {
        try {
          saveAs(pdfBlob, filename);
          console.log(
            `PDF downloaded successfully despite storage error: ${filename}`
          );
        } catch (dlError) {
          console.error("Download error after storage failure:", dlError);
        }
      }
    }

    return createPDFSuccess(URL.createObjectURL(pdfBlob));
  } catch (error) {
    return createPDFFailure({
      type: PDFErrorType.GENERATION_ERROR,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
