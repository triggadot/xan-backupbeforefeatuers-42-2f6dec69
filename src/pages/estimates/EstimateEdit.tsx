import EstimateForm from "@/components/estimates/EstimateForm";
import { Button } from "@/components/ui/button";
import { fetchEstimateById, updateEstimate } from "@/services/estimateService";
import { Estimate } from "@/types/estimates";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EstimateEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEstimate = async () => {
      try {
        if (!id) return;
        const data = await fetchEstimateById(id);
        if (data) {
          setEstimate(data);
        } else {
          navigate("/estimates", { replace: true });
        }
      } catch (error) {
        console.error("Error loading estimate:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEstimate();
  }, [id, navigate]);

  const handleSubmit = async (values: Partial<Estimate>) => {
    try {
      if (!id) return;
      setIsSubmitting(true);
      await updateEstimate(id, values);
      navigate(`/estimates/${id}`);
    } catch (error) {
      console.error("Error updating estimate:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!estimate) return <div>Estimate not found</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Edit Estimate #{estimate.estimate_uid}
        </h1>
        <Button variant="outline" onClick={() => navigate(`/estimates/${id}`)}>
          Cancel
        </Button>
      </div>

      <EstimateForm
        defaultValues={estimate}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default EstimateEdit;
