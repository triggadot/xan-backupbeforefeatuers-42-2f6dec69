
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';

import { EXPENSE_CATEGORIES, Expense } from '@/types/expenses';
import { useExpenseMutation } from '@/hooks/expenses';

// Form schema validation using Zod
const formSchema = z.object({
  notes: z.string().max(500, {
    message: "Notes must be less than 500 characters.",
  }).optional(),
  amount: z.coerce.number().min(0, {
    message: "Amount must be a positive number.",
  }),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  date: z.date({
    required_error: "Please select a date.",
  }),
  supplier_name: z.string().max(100, {
    message: "Supplier name must be less than 100 characters.",
  }).optional(),
  receipt_image: z.string().url({
    message: "Please enter a valid URL.",
  }).optional(),
});

// Type for form values based on schema
type FormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  expense?: Expense;
  isEdit?: boolean;
}

export const ExpenseForm = ({ expense, isEdit = false }: ExpenseFormProps) => {
  const navigate = useNavigate();
  const { createExpense, updateExpense } = useExpenseMutation();
  
  // Initialize form with react-hook-form and zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
      amount: 0,
      category: "",
      date: new Date(),
      supplier_name: "",
      receipt_image: "",
    },
  });
  
  // Set form values when expense data is available for editing
  useEffect(() => {
    if (expense && isEdit) {
      form.reset({
        notes: expense.notes || "",
        amount: expense.amount ? Number(expense.amount) : 0,
        category: expense.category || "",
        date: expense.date ? new Date(expense.date) : new Date(),
        supplier_name: expense.expense_supplier_name || "",
        receipt_image: expense.expense_receipt_image || "",
      });
    }
  }, [expense, isEdit, form]);
  
  const onSubmit = async (data: FormValues) => {
    try {
      if (isEdit && expense) {
        await updateExpense.mutateAsync({
          id: expense.id,
          data: {
            notes: data.notes,
            amount: data.amount,
            category: data.category,
            date: data.date.toISOString(),
            supplier_name: data.supplier_name,
            receipt_image: data.receipt_image,
          },
        });
        navigate(`/expenses/${expense.id}`);
      } else {
        const newExpense = await createExpense.mutateAsync({
          notes: data.notes || "",
          amount: data.amount,
          category: data.category,
          date: data.date.toISOString(),
          supplier_name: data.supplier_name,
          receipt_image: data.receipt_image,
        });
        navigate(`/expenses/${newExpense.id}`);
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {isEdit ? 'Edit Expense' : 'New Expense'}
          </CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount*</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-7"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {EXPENSE_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
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
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date*</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={"w-full pl-3 text-left font-normal"}
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
                    name="supplier_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier/Vendor</FormLabel>
                        <FormControl>
                          <Input placeholder="Supplier name" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>
                          Enter the name of the supplier or vendor for this expense.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter notes about this expense"
                            className="min-h-[150px]"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Add any additional details about this expense.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="receipt_image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receipt Image URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/receipt.jpg"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter a URL to the receipt image if available.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(isEdit && expense ? `/expenses/${expense.id}` : '/expenses')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createExpense.isPending || updateExpense.isPending}
              >
                {(createExpense.isPending || updateExpense.isPending) ? 'Saving...' : (isEdit ? 'Update Expense' : 'Create Expense')}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default ExpenseForm;
