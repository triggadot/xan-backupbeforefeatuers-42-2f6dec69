
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { TransactionDialog } from "@/components/transactions/TransactionDialog";

export function FinancialActions() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTransactionSubmit = async (data: any) => {
    // Implementation of transaction creation
    console.log('New transaction:', data);
    // Here you would call your service to create the transaction
  };

  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-semibold">Financial Overview</h2>
      <div className="space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setDialogOpen(true)}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          New Transaction
        </Button>
      </div>

      <TransactionDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onTransactionSubmit={handleTransactionSubmit}
      />
    </div>
  );
}
