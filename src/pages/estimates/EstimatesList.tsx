import { DataTable } from "@/components/ui/DataTable";
import { fetchEstimates } from "@/services/estimateService";
import { ColumnDef } from "@/types/base";
import { Estimate } from "@/types/estimates";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const EstimatesList = () => {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadEstimates = async () => {
      try {
        const data = await fetchEstimates();
        setEstimates(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load estimates"
        );
      } finally {
        setLoading(false);
      }
    };

    loadEstimates();
  }, []);

  const columns: ColumnDef<Estimate>[] = [
    {
      id: "estimate_uid",
      accessorKey: "estimate_uid",
      header: "Estimate #",
    },
    {
      id: "account_name",
      accessorKey: "account_name",
      header: "Customer",
      cell: (item) => <span>{item?.account_name || "Unknown"}</span>,
    },
    {
      id: "estimate_date",
      accessorKey: "estimate_date",
      header: "Date",
      cell: (item) => (
        <span>
          {item?.estimate_date
            ? new Date(item.estimate_date).toLocaleDateString()
            : "N/A"}
        </span>
      ),
    },
    {
      id: "total_amount",
      accessorKey: "total_amount",
      header: "Amount",
      cell: (item) => <span>${item?.total_amount?.toFixed(2) || "0.00"}</span>,
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: (item) => (
        <span className={`capitalize ${getStatusColor(item?.status || "")}`}>
          {item?.status || "unknown"}
        </span>
      ),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "text-gray-500";
      case "sent":
        return "text-blue-500";
      case "accepted":
        return "text-green-500";
      case "rejected":
        return "text-red-500";
      case "converted":
        return "text-purple-500";
      default:
        return "";
    }
  };

  const handleRowClick = (estimate: Estimate) => {
    navigate(`/estimates/${estimate.id}`);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Estimates</h1>
      <DataTable
        data={estimates}
        columns={columns}
        onRowClick={handleRowClick}
        isLoading={loading}
        error={error}
      />
    </div>
  );
};

export default EstimatesList;
