
import { useState } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { InvoiceLineItem } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/format-utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LineItemForm } from './LineItemForm';
import { useInvoicesView } from '@/hooks/invoices/useInvoicesView';

interface LineItemsTableProps {
  lineItems: InvoiceLineItem[];
  invoiceId: string;
  invoiceGlideRowId: string;
  status: string;
  onDeleteItem: (itemId: string) => void;
}

export function LineItemsTable({ 
  lineItems, 
  invoiceId, 
  invoiceGlideRowId,
  status,
  onDeleteItem 
}: LineItemsTableProps) {
  const [isAddLineOpen, setIsAddLineOpen] = useState(false);
  const [currentLine, setCurrentLine] = useState<InvoiceLineItem | null>(null);
  const { addLineItem, updateLineItem } = useInvoicesView();
  
  const handleAddEditLine = async (data: Partial<InvoiceLineItem>) => {
    if (currentLine) {
      await updateLineItem.mutateAsync({ 
        id: currentLine.id, 
        data 
      });
    } else {
      await addLineItem.mutateAsync({ 
        invoiceGlideId: invoiceGlideRowId, 
        data 
      });
    }
    setCurrentLine(null);
    setIsAddLineOpen(false);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const isEditable = status !== 'paid';

  return (
    <>
      <div className="px-4 py-3 bg-white border-b flex justify-between items-center">
        <h3 className="font-semibold">Line Items</h3>
        {isEditable && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCurrentLine(null);
              setIsAddLineOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        )}
      </div>
      
      {lineItems.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">
          No items added to this invoice yet.
          {isEditable && (
            <div className="mt-2">
              <Button
                variant="link"
                onClick={() => {
                  setCurrentLine(null);
                  setIsAddLineOpen(true);
                }}
              >
                Add your first item
              </Button>
            </div>
          )}
        </div>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                {isEditable && <TableHead className="w-[100px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.description}</div>
                      {item.notes && <div className="text-sm text-muted-foreground">{item.notes}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                  {isEditable && (
                    <TableCell>
                      <div className="flex justify-end space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setCurrentLine(item);
                            setIsAddLineOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => onDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
      
      <div className="px-4 py-3 border-t bg-white/50">
        <div className="flex justify-end">
          <div className="w-1/3 space-y-1">
            <div className="flex justify-between font-medium">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <Dialog open={isAddLineOpen} onOpenChange={setIsAddLineOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{currentLine ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>
          <LineItemForm
            lineItem={currentLine || undefined}
            onSubmit={handleAddEditLine}
            onCancel={() => {
              setCurrentLine(null);
              setIsAddLineOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
