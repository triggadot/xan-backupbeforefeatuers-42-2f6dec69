import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NewTransactionDialog from "./NewTransactionDialog";
import { useNavigate } from 'react-router-dom';
import { 
  FilePlus, 
  FileText, 
  ShoppingBag, 
  Package, 
  CreditCard,
  Plus,
  Circle 
} from 'lucide-react';

interface FinancialAction {
  icon: React.ReactNode;
  label: string;
  description: string;
  route: string;
  color: string;
}

interface FinancialActionsProps {
  className?: string;
}

export default function FinancialActions({ className }: FinancialActionsProps) {
  const navigate = useNavigate();

  const financialActions: FinancialAction[] = [
    {
      icon: <FileText className="h-5 w-5" />,
      label: "New Invoice",
      description: "Create a new customer invoice",
      route: "/invoices/new",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: <FilePlus className="h-5 w-5" />,
      label: "New Estimate",
      description: "Create a new customer estimate",
      route: "/estimates/new",
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      icon: <ShoppingBag className="h-5 w-5" />,
      label: "New Purchase Order",
      description: "Create a new vendor purchase order",
      route: "/purchase-orders/new",
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      icon: <Package className="h-5 w-5" />,
      label: "New Product",
      description: "Add a new product to inventory",
      route: "/products/new",
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: "New Transaction",
      description: "Record a new payment transaction",
      route: "/transactions/new",
      color: "text-rose-600 dark:text-rose-400",
    }
  ];

  return (
    <Card className={className}>
      <CardHeader className="p-4">
        <CardTitle className="text-base font-medium">Financial Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {financialActions.map((action, index) => (
            {action.label === "New Transaction" ? (
              <NewTransactionDialog 
                key={index}
                buttonVariant="ghost" 
                fullWidth 
                onTransactionAdded={() => {}} 
              />
            ) : (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start h-auto py-3 px-4 hover:bg-muted group"
                onClick={() => navigate(action.route)}
              >
            
              <div className="flex items-center gap-3">
                <div className={`${action.color} p-2 rounded-full bg-background border`}>
                  {action.icon}
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{action.label}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="h-4 w-4" />
                </div>
              </div>
            </Button>
            )}
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
