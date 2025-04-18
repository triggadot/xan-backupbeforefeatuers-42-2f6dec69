
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EXPENSE_CATEGORIES, ExpenseForm as ExpenseFormType } from "@/types/expenses";
import { useQuery } from "@tanstack/react-query";
import { expensesService } from "@/services/expenses-service";

const formSchema = z.object({
  notes: z.string().optional(),
  amount: z.number().min(0, "Amount must be positive"),
  category: z.string().min(1, "Please select a category"),
  date: z.date(),
  supplierName: z.string().optional(),
  receiptImage: z.string().url().optional().or(z.literal("")),
  type: z.string().optional()
});

interface ExpenseFormProps {
  expenseId?: string | null;
  onSubmit: (data: ExpenseFormType) => Promise<void>;
  onCancel: () => void;
}

export function ExpenseForm({ expenseId, onSubmit, onCancel }: ExpenseFormProps) {
  const form = useForm<ExpenseFormType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
      amount: 0,
      category: "",
      date: new Date(),
      supplierName: "",
      receiptImage: "",
      type: ""
    }
  });

  const { data: expense } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => expenseId ? expensesService.getExpense(expenseId) : null,
    enabled: !!expenseId
  });

  React.useEffect(() => {
    if (expense) {
      form.reset({
        notes: expense.notes,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        supplierName: expense.supplierName,
        receiptImage: expense.receiptImage,
        type: expense.type
      });
    }
  }, [expense, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount*</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={e => field.onChange(parseFloat(e.target.value))}
                />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(category => (
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter notes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {expenseId ? 'Update' : 'Create'} Expense
          </Button>
        </div>
      </form>
    </Form>
  );
}
