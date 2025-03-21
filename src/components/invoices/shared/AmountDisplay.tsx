
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format-utils";

interface AmountDisplayProps {
  amount: number;
  variant?: "default" | "success" | "warning" | "destructive";
  className?: string;
}

export function AmountDisplay({ 
  amount, 
  variant = "default",
  className 
}: AmountDisplayProps) {
  const variantClasses = {
    default: "",
    success: "text-green-600",
    warning: "text-amber-600",
    destructive: "text-red-600"
  };

  return (
    <span className={cn(variantClasses[variant], className)}>
      {formatCurrency(amount)}
    </span>
  );
}
