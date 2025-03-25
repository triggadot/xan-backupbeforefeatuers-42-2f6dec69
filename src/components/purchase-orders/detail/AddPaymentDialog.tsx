
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { usePurchaseOrdersView } from '@/hooks/purchase-orders/usePurchaseOrdersView';
import { PaymentForm } from './PaymentForm';
import { VendorPayment } from '@/types/purchaseOrder';

interface AddPaymentDialogProps {
  purchaseOrderId: string;
  purchaseOrderGlideRowId: string;
  vendorId: string;
  purchaseOrderTotal: number;
  purchaseOrderBalance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddPaymentDialog({
  purchaseOrderId,
  purchaseOrderGlideRowId,
  vendorId,
  purchaseOrderTotal,
  purchaseOrderBalance,
  open,
  onOpenChange,
  onSuccess
}: AddPaymentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { addPayment } = usePurchaseOrdersView();
  const { toast } = useToast();

  const handleSubmit = async (data: Partial<VendorPayment>) => {
    setIsLoading(true);
    try {
      await addPayment.mutateAsync({
        purchaseOrderGlideId: purchaseOrderGlideRowId,
        data: {
          ...data,
          // Pass vendorId separately since it's not part of the form data
          // but used in the backend
        },
        vendorId // Pass vendorId separately
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
          vendorId={vendorId}
          purchaseOrderTotal={purchaseOrderTotal}
          purchaseOrderBalance={purchaseOrderBalance}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
