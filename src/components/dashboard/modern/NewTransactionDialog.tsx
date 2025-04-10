import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAccounts } from "@/hooks/accounts";
import { useQueryClient } from "@tanstack/react-query";

// Define form schema with Zod
const transactionSchema = z.object({
  account_id: z.string({
    required_error: "Please select an account",
  }),
  amount: z.coerce
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .positive({ message: "Amount must be greater than 0" }),
  type: z.enum(["Received", "Paid"], {
    required_error: "Please select a transaction type",
  }),
  date: z.string().min(1, { message: "Date is required" }),
  note: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface NewTransactionDialogProps {
  onTransactionAdded?: () => void;
  buttonVariant?: "default" | "outline" | "ghost" | "link";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  fullWidth?: boolean;
}

export default function NewTransactionDialog({
  onTransactionAdded,
  buttonVariant = "default",
  buttonSize = "default",
  fullWidth = false,
}: NewTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch accounts for dropdown selection
  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();

  // Default values for the form
  const defaultValues: Partial<TransactionFormValues> = {
    date: new Date().toISOString().slice(0, 10),
    type: "Received",
    note: "",
  };

  // Initialize form with react-hook-form
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues,
  });

  // Form submission handler
  const onSubmit = async (values: TransactionFormValues) => {
    setIsSubmitting(true);
    try {
      // Determine which table to insert into based on transaction type
      if (values.type === "Received") {
        // Insert into customer payments table
        const { error } = await supabase.from("gl_customer_payments").insert({
          rowid_accounts: values.account_id,
          payment_amount: values.amount,
          type_of_payment: values.type,
          date_of_payment: values.date,
          payment_note: values.note,
        });

        if (error) throw error;
      } else {
        // Insert into vendor payments table
        const { error } = await supabase.from("gl_vendor_payments").insert({
          rowid_accounts: values.account_id,
          payment_amount: values.amount,
          date_of_payment: values.date,
          vendor_purchase_note: values.note,
        });

        if (error) throw error;
      }

      // Show success message
      toast({
        title: "Transaction added",
        description: `${values.type} payment of $${values.amount.toFixed(2)} was successfully recorded.`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["recentTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["financialMetrics"] });
      queryClient.invalidateQueries({ queryKey: ["businessMetrics"] });
      
      // Reset form and close dialog
      form.reset(defaultValues);
      setOpen(false);
      
      // Notify parent component if callback provided
      if (onTransactionAdded) {
        onTransactionAdded();
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={buttonVariant} 
          size={buttonSize}
          className={fullWidth ? "w-full" : ""}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Record a payment received from a customer or a payment made to a vendor.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Received">Payment Received</SelectItem>
                      <SelectItem value="Paid">Payment Made</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value === "Received"
                      ? "Money coming into your business"
                      : "Money going out of your business"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {form.watch("type") === "Received" ? "Customer" : "Vendor"}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting || isLoadingAccounts}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingAccounts ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading...
                        </div>
                      ) : (
                        accounts
                          ?.filter((account) =>
                            form.watch("type") === "Received"
                              ? account.is_customer
                              : account.is_vendor
                          )
                          .map((account) => (
                            <SelectItem
                              key={account.glide_row_id}
                              value={account.glide_row_id}
                            >
                              {account.account_name}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="pl-7"
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add details about this transaction"
                      className="resize-none"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Transaction"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
