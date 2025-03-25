
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
      case "sent":
        return "secondary";
      case "paid":
        return "success";
      case "partial":
        return "warning";
      case "overdue":
        return "destructive";
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
      case "sent":
        return "Sent";
      case "paid":
        return "Paid";
      case "partial":
        return "Partially Paid";
      case "overdue":
        return "Overdue";
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
      variant={getVariant() as any} 
      className={size === "sm" ? "text-xs px-2 py-0" : ""}
    >
      {getLabel()}
    </Badge>
  );
}
