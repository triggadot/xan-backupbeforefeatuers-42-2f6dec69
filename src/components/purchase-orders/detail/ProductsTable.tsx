
import { useState } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { PurchaseOrderLineItem } from '@/types/purchaseOrder';
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
import { ProductForm } from './ProductForm';
import { usePurchaseOrdersView } from '@/hooks/purchase-orders/usePurchaseOrdersView';

export interface ProductsTableProps {
  products: PurchaseOrderLineItem[];
  purchaseOrderId: string;
  purchaseOrderGlideRowId: string;
  status: string;
  onDeleteProduct: (productId: string) => void;
}

export function ProductsTable({ 
  products, 
  purchaseOrderId, 
  purchaseOrderGlideRowId,
  status,
  onDeleteProduct 
}: ProductsTableProps) {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<PurchaseOrderLineItem | null>(null);
  const { addProduct, updateProduct } = usePurchaseOrdersView();
  
  const handleAddEditProduct = async (data: Partial<PurchaseOrderLineItem>) => {
    if (currentProduct) {
      await updateProduct.mutateAsync({ 
        id: currentProduct.id, 
        data 
      });
    } else {
      await addProduct.mutateAsync({ 
        purchaseOrderGlideId: purchaseOrderGlideRowId, 
        data 
      });
    }
    setCurrentProduct(null);
    setIsAddProductOpen(false);
  };

  const subtotal = products.reduce((sum, item) => sum + item.total, 0);
  const isEditable = status !== 'complete' && status !== 'paid';

  return (
    <>
      <div className="px-4 py-3 bg-white border-b flex justify-between items-center">
        <h3 className="font-semibold">Products</h3>
        {isEditable && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCurrentProduct(null);
              setIsAddProductOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        )}
      </div>
      
      {products.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">
          No products added to this purchase order yet.
          {isEditable && (
            <div className="mt-2">
              <Button
                variant="link"
                onClick={() => {
                  setCurrentProduct(null);
                  setIsAddProductOpen(true);
                }}
              >
                Add your first product
              </Button>
            </div>
          )}
        </div>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                {isEditable && <TableHead className="w-[100px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.description}</div>
                      {item.productDetails?.purchase_notes && (
                        <div className="text-sm text-muted-foreground">{item.productDetails.purchase_notes}</div>
                      )}
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
                            setCurrentProduct(item);
                            setIsAddProductOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => onDeleteProduct(item.id)}
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
      
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{currentProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <ProductForm
            product={currentProduct || undefined}
            onSubmit={handleAddEditProduct}
            onCancel={() => {
              setCurrentProduct(null);
              setIsAddProductOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
