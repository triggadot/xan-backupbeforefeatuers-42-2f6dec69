
import InvoiceCardPageComponent from "@/components/invoices/functions/InvoiceCardPage";
import React from "react";
import { PDFProvider } from "@/components/pdf/PDFContextProvider";

const InvoiceCardPage: React.FC = () => {
  return (
    <PDFProvider>
      <InvoiceCardPageComponent />
    </PDFProvider>
  );
};

export default InvoiceCardPage;
