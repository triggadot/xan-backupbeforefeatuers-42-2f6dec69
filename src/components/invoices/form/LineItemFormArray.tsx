import { useState, useEffect } from 'react';
import { useFieldArray, Control } from 'react-hook-form';
import { 
  Trash2, 
  Plus, 
  PackageSearch, 
  Loader2 
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { AmountDisplay } from '../shared/AmountDisplay';

export interface LineItemFormValues {
  lineItems: {
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

interface LineItemFormArrayProps {
  control: Control<LineItemFormValues>;
  disabled?: boolean;
}

export const LineItemFormArray = ({ control, disabled = false }: LineItemFormArrayProps) => {
  const { toast } = useToast();
  const { products, isLoading: productsLoading } = useProducts();
  const [subTotal, setSubTotal] = useState(0);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const addEmptyLineItem = () => {
    append({
      productId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
    });
  };

  useEffect(() => {
    if (fields.length === 0) {
      addEmptyLineItem();
    }
  }, [fields.length, append]);

  useEffect(() => {
    const total = control._formValues.lineItems?.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return sum + (quantity * unitPrice);
    }, 0) || 0;
    
    setSubTotal(total);
  }, [control._formValues.lineItems, control]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">Product</TableHead>
              <TableHead className="w-[30%]">Description</TableHead>
              <TableHead className="w-[15%]">Quantity</TableHead>
              <TableHead className="w-[15%]">Unit Price</TableHead>
              <TableHead className="w-[10%]">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const quantity = control._formValues.lineItems?.[index]?.quantity || 0;
              const unitPrice = control._formValues.lineItems?.[index]?.unitPrice || 0;
              const total = quantity * unitPrice;

              return (
                <TableRow key={field.id}>
                  <TableCell>
                    <FormField
                      control={control}
                      name={`lineItems.${index}.productId`}
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={(value) => {
                              const selectedProduct = products.find(p => p.id === value);
                              if (selectedProduct) {
                                const description = selectedProduct.name || '';
                                const price = 0;
                                control._formValues.lineItems[index].description = description;
                                control._formValues.lineItems[index].unitPrice = price;
                                field.onChange(value);
                              }
                            }}
                            value={field.value}
                            disabled={disabled}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {productsLoading ? (
                                <div className="flex items-center justify-center p-4">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Loading...
                                </div>
                              ) : (
                                products.map(product => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <FormField
                      control={control}
                      name={`lineItems.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Description"
                              disabled={disabled}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <FormField
                      control={control}
                      name={`lineItems.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              step="0.01"
                              onChange={(e) => {
                                const value = e.target.valueAsNumber || 0;
                                field.onChange(value);
                              }}
                              disabled={disabled}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <FormField
                      control={control}
                      name={`lineItems.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="0"
                              step="0.01"
                              onChange={(e) => {
                                const value = e.target.valueAsNumber || 0;
                                field.onChange(value);
                              }}
                              disabled={disabled}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <AmountDisplay amount={total} className="font-medium" />
                  </TableCell>
                  
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (fields.length === 1) {
                          toast({
                            title: "Cannot remove all line items",
                            description: "At least one line item is required.",
                            variant: "destructive",
                          });
                          return;
                        }
                        remove(index);
                      }}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addEmptyLineItem}
        disabled={disabled}
        className="mt-2"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Line Item
      </Button>
      
      <div className="mt-4 border-t pt-4">
        <div className="flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <AmountDisplay amount={subTotal} />
            </div>
            <Separator />
            <div className="flex justify-between font-medium text-lg">
              <span>Total:</span>
              <AmountDisplay amount={subTotal} className="font-semibold" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
