import { EstimateDetailView } from "@/components/estimates";
import { useEstimateDetail } from "@/hooks/estimates";
import { useToast } from "@/hooks/utils/use-toast";
import { useParams } from "react-router-dom";
import React from "react";

const EstimateDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { estimate, isLoading, error, refreshEstimate, convertToInvoice } =
    useEstimateDetail(id);

  const handleRefresh = () => {
    refreshEstimate();
    toast({
      title: "Refreshed",
      description: "Estimate data has been refreshed.",
    });
  };

  const handleConvertToInvoice = async () => {
    try {
      const result = await convertToInvoice();
      if (result.success) {
        toast({
          title: "Success",
          description: "Estimate has been converted to an invoice.",
        });
      } else {
        throw new Error("Failed to convert estimate to invoice");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to convert estimate to invoice.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          <p>Error loading estimate: {error}</p>
        </div>
      </div>
    );
  }

  if (!estimate && !isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-muted p-4 rounded-md text-muted-foreground">
          <p>Estimate not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {estimate && (
        <EstimateDetailView
          estimate={estimate}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          onConvertToInvoice={handleConvertToInvoice}
        />
      )}
    </div>
  );
};

export default EstimateDetail;
