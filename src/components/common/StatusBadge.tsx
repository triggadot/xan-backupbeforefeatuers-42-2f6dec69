import React from 'react';
import { Badge } from "@/components/ui/badge";
import { EntityStatus } from '@/types/common';

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
        return "primary"; // Added case for credit
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
        return "Credit"; // Added case for credit
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
      variant={getVariant()} 
      className={size === "sm" ? "text-xs py-0 px-2" : ""}
    >
      {getLabel()}
    </Badge>
  );
}
