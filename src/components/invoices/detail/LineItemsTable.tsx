import { useState } from 'react';
import { Package2, MoreHorizontal, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useInvoicesNew } from '@/hooks/invoices/useInvoicesNew';
import { InvoiceLineItem } from '@/types/invoice';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface LineItemsTableProps {
  lineItems: InvoiceLineItem[];
  invoiceId: string;
}

export const LineItemsTable = ({ lineItems, invoiceId }: LineItemsTableProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { deleteLineItem } = useInvoicesNew();
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    if (!deletingItemId) return;
    
    try {
      await deleteLineItem.mutateAsync({
        id: deletingItemId,
        invoiceId: invoiceId
      });
      
      setIsDeleteDialogOpen(false);
      setDeletingItemId(null);
      
      toast({
        title: 'Success',
        description: 'Line item deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting line item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete line item.',
        variant: 'destructive',
      });
    }
  };

  if (lineItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>No line items found for this invoice.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate(`/invoices/${invoiceId}/add-item`)}
        >
          Add Item
        </Button>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {item.productDetails ? (
                  <div className="flex items-center gap-2">
                    {item.productDetails.product_image1 && (
                      <div className="h-10 w-10 rounded-md border overflow-hidden flex-shrink-0">
                        <img 
                          src={item.productDetails.product_image1} 
                          alt={item.description}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <Button
                      variant="link"
                      className="h-auto p-0 text-blue-600"
                      onClick={() => navigate(`/products/${item.productId}`)}
                    >
                      {item.productDetails.name}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Unknown Product</span>
                )}
              </TableCell>
              <TableCell>
                {item.description}
              </TableCell>
              <TableCell className="text-right">
                {item.quantity}
              </TableCell>
              <TableCell className="text-right">
                ${item.unitPrice.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-medium">
                ${item.total.toFixed(2)}
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
                      onClick={() => navigate(`/invoices/${invoiceId}/edit-item/${item.id}`)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Item
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => {
                        setDeletingItemId(item.id);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Item
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
        title="Delete Line Item"
        description="Are you sure you want to delete this line item? This action cannot be undone."
      />
    </>
  );
};
