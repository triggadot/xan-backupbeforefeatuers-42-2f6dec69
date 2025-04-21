import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DataTable";
import {
  fetchEstimateById,
  fetchEstimateLines,
} from "@/services/estimateService";
import { Estimate, EstimateLine } from "@/types/estimates";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EstimateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [lines, setLines] = useState<EstimateLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!id) return;

        const [estimateData, linesData] = await Promise.all([
          fetchEstimateById(id),
          fetchEstimateLines(id),
        ]);

        if (estimateData) {
          setEstimate(estimateData);
          setLines(linesData);
        } else {
          navigate("/estimates", { replace: true });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load estimate"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const lineColumns = [
    {
      id: "product_name",
      header: "Product",
      accessorKey: "product_name",
    },
    {
      id: "quantity",
      header: "Qty",
      accessorKey: "quantity",
    },
    {
      id: "unit_price",
      header: "Unit Price",
      cell: (line: EstimateLine) => <span>${line.unit_price.toFixed(2)}</span>,
    },
    {
      id: "total_price",
      header: "Total",
      cell: (line: EstimateLine) => <span>${line.total_price.toFixed(2)}</span>,
    },
  ];

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!estimate) return null;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Estimate #{estimate.estimate_uid}
        </h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => navigate("/estimates")}>
            Back to List
          </Button>
          <Button onClick={() => navigate(`/estimates/${id}/edit`)}>
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Estimate Details</h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Status:</span> {estimate.status}
            </p>
            <p>
              <span className="font-medium">Date:</span>{" "}
              {new Date(estimate.estimate_date || "").toLocaleDateString()}
            </p>
            <p>
              <span className="font-medium">Customer:</span>{" "}
              {estimate.account_name || "Unknown"}
            </p>
            <p>
              <span className="font-medium">Total Amount:</span> $
              {estimate.total_amount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          <p>{estimate.notes || "No notes available"}</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Line Items</h2>
      <DataTable data={lines} columns={lineColumns} />
    </div>
  );
};

export default EstimateDetail;
