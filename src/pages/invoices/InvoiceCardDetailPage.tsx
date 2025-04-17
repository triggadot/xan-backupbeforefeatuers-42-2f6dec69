import { InvoiceCardDetail } from "@/components/invoices/functions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useInvoiceDetail } from "@/hooks/invoices";
import { AlertCircle } from "lucide-react";
import React from "react";
import { useParams } from "react-router-dom";

const InvoiceCardDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { invoice, isLoading, error } = useInvoiceDetail(id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load invoice details: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!invoice) {
    return (
      <Alert variant="default" className="max-w-2xl mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>
          Invoice not found. The invoice may have been deleted or you may not
          have permission to view it.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6">
      <InvoiceCardDetail invoice={invoice} />
    </div>
  );
};

export default InvoiceCardDetailPage;
