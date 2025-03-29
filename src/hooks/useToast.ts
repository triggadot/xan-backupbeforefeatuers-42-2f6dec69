import { toast } from "@/components/ui/use-toast";
import { useCallback } from "react";

type ToastVariant = "default" | "destructive";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export function useToast() {
  const showToast = useCallback(
    ({ title, description, variant = "default", duration = 5000 }: ToastOptions) => {
      toast({
        title,
        description,
        variant,
        duration,
      });
    },
    []
  );

  return { toast: showToast };
}
