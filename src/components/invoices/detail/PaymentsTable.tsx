import { useState } from 'react';
import { CreditCard, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useInvoices } from '@/hooks/invoices/useInvoices';
import { InvoicePayment } from '@/types/invoice';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { formatDate } from '@/utils/format-utils';

interface PaymentsTableProps {
  payments: InvoicePayment[];
  invoiceId: string;
}

export const PaymentsTable = ({ payments, invoiceId }: PaymentsTableProps) => {
  const { toast } = useToast();
  const { deletePayment } = useInvoices();
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (!deletingPaymentId) return;
    
    try {
      await deletePayment.mutateAsync({
        id: deletingPaymentId,
        invoiceId: invoiceId
      });
      
      toast({
        title: 'Success',
        description: 'Payment deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete payment.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingPaymentId(null);
    }
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>No payments have been recorded for this invoice.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Payment Date</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                {formatDate(payment.paymentDate)}
              </TableCell>
              <TableCell>
                {payment.paymentMethod || '-'}
              </TableCell>
              <TableCell className="text-right font-medium">
                ${payment.amount.toFixed(2)}
              </TableCell>
              <TableCell>
                {payment.notes || '-'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => {
                        setDeletingPaymentId(payment.id);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Payment
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Payment"
        description="Are you sure you want to delete this payment record? This action cannot be undone."
      />
    </>
  );
};
