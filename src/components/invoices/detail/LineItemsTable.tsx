
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
import { InvoiceLineItem } from '@/types/invoiceView';
import { formatCurrency } from '@/utils/format-utils';

interface LineItemsTableProps {
  lineItems: InvoiceLineItem[];
  invoiceId: string;
  onDeleteItem: (itemId: string) => void;
}

export const LineItemsTable = ({ lineItems, invoiceId, onDeleteItem }: LineItemsTableProps) => {
  const navigate = useNavigate();

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
                    {item.productName}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              ) : (
                <span className="text-muted-foreground">{item.productName || "Unknown Product"}</span>
              )}
            </TableCell>
            <TableCell>
              {item.description}
            </TableCell>
            <TableCell className="text-right">
              {item.quantity}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(item.unitPrice)}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(item.total)}
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
                    onClick={() => onDeleteItem(item.id)}
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
  );
};
