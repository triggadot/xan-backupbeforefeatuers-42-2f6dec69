
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { EntityStatus } from '@/types/common/common';

interface StatusBadgeProps {
  status: EntityStatus;
  size?: "default" | "sm";
}

/**
 * A standardized badge component for displaying entity statuses
 */
export function StatusBadge({ status, size = "default" }: StatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      // Invoice statuses
      case "draft":
        return "outline";
      case "unpaid":
        return "secondary";
      case "paid":
        return "success";
      case "partial":
        return "warning";
      case "credit":
        return "default"; // Changed to default since primary is not available
      // Purchase order statuses
      case "pending":
        return "secondary";
      case "complete":
        return "success";
      // Estimate statuses
      case "converted":
        return "success";
      // Generic statuses
      case "active":
        return "success";
      case "inactive":
        return "secondary";
      case "archived":
        return "outline";
      default:
        return "outline";
    }
  };

  const getLabel = () => {
    switch (status) {
      case "draft":
        return "Draft";
      case "unpaid":
        return "Unpaid";
      case "paid":
        return "Paid";
      case "partial":
        return "Partially Paid";
      case "credit":
        return "Credit";
      case "pending":
        return "Pending";
      case "complete":
        return "Complete";
      case "converted":
        return "Converted";
      case "active":
        return "Active";
      case "inactive":
        return "Inactive";
      case "archived":
        return "Archived";
      default:
        return status;
    }
  };

  return (
    <Badge 
      variant={getVariant() as "default" | "destructive" | "outline" | "secondary" | "success" | "warning"} 
      className={size === "sm" ? "text-xs py-0 px-2" : ""}
    >
      {getLabel()}
    </Badge>
  );
}
