
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "draft" | "sent" | "paid" | "partial" | "overdue";
  size?: "default" | "sm";
}

export function StatusBadge({ status, size = "default" }: StatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case "draft":
        return "outline";
      case "sent":
        return "secondary";
      case "paid":
        return "success";
      case "partial":
        return "warning";
      case "overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getLabel = () => {
    switch (status) {
      case "draft":
        return "Draft";
      case "sent":
        return "Sent";
      case "paid":
        return "Paid";
      case "partial":
        return "Partially Paid";
      case "overdue":
        return "Overdue";
      default:
        return status;
    }
  };

  return (
    <Badge 
      variant={getVariant() as any} 
      className={size === "sm" ? "text-xs px-2 py-0" : ""}
    >
      {getLabel()}
    </Badge>
  );
}
