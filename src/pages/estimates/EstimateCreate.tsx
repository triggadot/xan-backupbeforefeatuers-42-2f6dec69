import EstimateForm from "@/components/estimates/EstimateForm";
import { Button } from "@/components/ui/button";
import { createEstimate } from "@/services/estimateService";
import { Estimate } from "@/types/estimates";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const EstimateCreate = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: Partial<Estimate>) => {
    try {
      setIsSubmitting(true);
      const id = await createEstimate(values);
      navigate(`/estimates/${id}`);
    } catch (error) {
      console.error("Error creating estimate:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Estimate</h1>
        <Button variant="outline" onClick={() => navigate("/estimates")}>
          Cancel
        </Button>
      </div>

      <EstimateForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
};

export default EstimateCreate;
