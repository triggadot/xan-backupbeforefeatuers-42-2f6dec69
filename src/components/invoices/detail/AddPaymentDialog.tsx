
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { useInvoicesView } from '@/hooks/invoices/useInvoicesView';
import { PaymentForm } from './PaymentForm';
import { InvoicePayment } from '@/types/invoice';

interface AddPaymentDialogProps {
  invoiceId: string;
  invoiceGlideRowId: string;
  customerId: string;
  invoiceTotal: number;
  invoiceBalance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddPaymentDialog({
  invoiceId,
  invoiceGlideRowId,
  customerId,
  invoiceTotal,
  invoiceBalance,
  open,
  onOpenChange,
  onSuccess
}: AddPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { addPayment } = useInvoicesView();
  const { toast } = useToast();

  const handleSubmit = async (data: Partial<InvoicePayment>) => {
    setIsLoading(true);
    try {
      await addPayment.mutateAsync({
        invoiceGlideId: invoiceGlideRowId,
        data
      });
      
      onOpenChange(false);
      
      toast({
        title: "Success",
        description: "Payment recorded successfully.",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>
        <PaymentForm 
          customerId={customerId}
          invoiceTotal={invoiceTotal}
          invoiceBalance={invoiceBalance}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
