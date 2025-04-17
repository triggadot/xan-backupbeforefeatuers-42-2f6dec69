import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useEstimateCredits } from '@/hooks/estimates/useEstimateCredits';
import { cn } from '@/lib/utils';
import { Account } from '@/types/accounts/index';
import { CustomerCredit } from '@/types/estimate';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Pencil, Plus, TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Credit form schema
const creditFormSchema = z.object({
  payment_amount: z.coerce.number().positive('Amount must be positive'),
  payment_type: z.string().optional(),
  payment_note: z.string().optional(),
  date_of_payment: z.date().optional(),
  rowid_accounts: z.string().optional()
});

type CreditFormValues = z.infer<typeof creditFormSchema>;

interface EstimateCreditsProps {
  estimateId: string;
  credits: CustomerCredit[];
  customers?: Account[];
  onCreditsChanged?: () => void;
}

export function EstimateCredits({ estimateId, credits, customers = [], onCreditsChanged }: EstimateCreditsProps) {
  const { addCustomerCredit, updateCustomerCredit, deleteCustomerCredit } = useEstimateCredits();
  const [editingCredit, setEditingCredit] = useState<CustomerCredit | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form for adding/editing credits
  const form = useForm<CreditFormValues>({
    resolver: zodResolver(creditFormSchema),
    defaultValues: {
      payment_amount: 0,
      payment_type: '',
      payment_note: '',
      date_of_payment: new Date(),
      rowid_accounts: ''
    }
  });

  // Reset form and set default values for a new credit
  const resetForm = () => {
    form.reset({
      payment_amount: 0,
      payment_type: '',
      payment_note: '',
      date_of_payment: new Date(),
      rowid_accounts: ''
    });
  };

  // Open the edit dialog and populate form with credit data
  const handleEditCredit = (credit: CustomerCredit) => {
    setEditingCredit(credit);
    form.reset({
      payment_amount: credit.payment_amount,
      payment_type: credit.payment_type || '',
      payment_note: credit.payment_note || '',
      date_of_payment: credit.date_of_payment ? new Date(credit.date_of_payment) : new Date(),
      rowid_accounts: credit.rowid_accounts || ''
    });
    setIsEditDialogOpen(true);
  };

  // Handle adding a new credit
  const handleAddCredit = async (values: CreditFormValues) => {
    await addCustomerCredit.mutateAsync({
      estimateGlideId: estimateId,
      data: {
        rowid_accounts: values.rowid_accounts,
        date_of_payment: values.date_of_payment ? format(values.date_of_payment, 'yyyy-MM-dd') : undefined,
        payment_amount: values.payment_amount,
        payment_note: values.payment_note,
        payment_type: values.payment_type
      }
    });
    setIsAddDialogOpen(false);
    resetForm();
    if (onCreditsChanged) onCreditsChanged();
  };

  // Handle updating an existing credit
  const handleUpdateCredit = async (values: CreditFormValues) => {
    if (!editingCredit) return;
    
    await updateCustomerCredit.mutateAsync({
      creditId: editingCredit.id,
      data: {
        rowid_accounts: values.rowid_accounts,
        date_of_payment: values.date_of_payment ? format(values.date_of_payment, 'yyyy-MM-dd') : undefined,
        payment_amount: values.payment_amount,
        payment_note: values.payment_note,
        payment_type: values.payment_type
      }
    });
    setIsEditDialogOpen(false);
    resetForm();
    setEditingCredit(null);
    if (onCreditsChanged) onCreditsChanged();
  };

  // Handle deleting a credit
  const handleDeleteCredit = async (creditId: string) => {
    if (confirm('Are you sure you want to delete this credit?')) {
      await deleteCustomerCredit.mutateAsync(creditId);
      if (onCreditsChanged) onCreditsChanged();
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get customer name from id
  const getCustomerName = (customerId?: string) => {
    if (!customerId) return 'N/A';
    const customer = customers.find(c => c.glide_row_id === customerId);
    return customer ? customer.account_name || 'Unnamed Customer' : 'Unknown Customer';
  };

  // Calculate total credits
  const totalCredits = credits.reduce((sum, credit) => sum + credit.payment_amount, 0);

  return (
    <Card className="w-full">
      <CardHeader className="bg-muted/50">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Customer Credits</CardTitle>
            <CardDescription>Credits applied to this estimate</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(true);
                }}
                size="sm"
                className="ml-auto"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Credit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Credit</DialogTitle>
                <DialogDescription>Add a new credit for this estimate.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddCredit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="payment_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rowid_accounts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.glide_row_id} value={customer.glide_row_id}>
                                {customer.account_name || 'Unnamed Customer'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="payment_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Credit Card">Credit Card</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Check">Check</SelectItem>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Store Credit">Store Credit</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date_of_payment"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Payment Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="payment_note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Credit</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {credits.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.map((credit) => (
                <TableRow key={credit.id}>
                  <TableCell className="font-medium">
                    {formatCurrency(credit.payment_amount)}
                  </TableCell>
                  <TableCell>
                    {credit.date_of_payment
                      ? format(new Date(credit.date_of_payment), 'MMM d, yyyy')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{credit.payment_type || 'N/A'}</TableCell>
                  <TableCell>{getCustomerName(credit.rowid_accounts)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {credit.payment_note || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditCredit(credit)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteCredit(credit.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No credits have been added to this estimate.
          </div>
        )}
      </CardContent>
      {credits.length > 0 && (
        <CardFooter className="bg-muted/30 flex justify-end">
          <div className="text-right font-semibold">
            Total Credits: {formatCurrency(totalCredits)}
          </div>
        </CardFooter>
      )}

      {/* Edit Credit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Credit</DialogTitle>
            <DialogDescription>Update credit information.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateCredit)} className="space-y-4">
              <FormField
                control={form.control}
                name="payment_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rowid_accounts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.glide_row_id} value={customer.glide_row_id}>
                            {customer.account_name || 'Unnamed Customer'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Check">Check</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Store Credit">Store Credit</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date_of_payment"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Payment Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payment_note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingCredit(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Credit</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 