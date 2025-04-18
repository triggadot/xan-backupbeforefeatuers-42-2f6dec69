import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowDownIcon, ShoppingBag, Home, Car, Coffee, Utensils } from "lucide-react"

const transactions = [
  {
    id: "1",
    description: "Grocery Shopping",
    amount: -120.5,
    date: "Today",
    category: "Food",
    icon: ShoppingBag,
  },
  {
    id: "2",
    description: "Salary Deposit",
    amount: 2400.0,
    date: "Yesterday",
    category: "Income",
    icon: ArrowDownIcon,
  },
  {
    id: "3",
    description: "Rent Payment",
    amount: -1200.0,
    date: "Mar 1",
    category: "Housing",
    icon: Home,
  },
  {
    id: "4",
    description: "Car Insurance",
    amount: -89.99,
    date: "Feb 28",
    category: "Insurance",
    icon: Car,
  },
  {
    id: "5",
    description: "Coffee Shop",
    amount: -4.5,
    date: "Feb 27",
    category: "Food",
    icon: Coffee,
  },
  {
    id: "6",
    description: "Restaurant Dinner",
    amount: -65.3,
    date: "Feb 26",
    category: "Food",
    icon: Utensils,
  },
]

export function RecentTransactions() {
  return (
    <div className="space-y-8">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center">
          <Avatar className="h-9 w-9 border">
            <transaction.icon className="h-4 w-4" />
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{transaction.description}</p>
            <p className="text-sm text-muted-foreground">{transaction.date}</p>
          </div>
          <div className="ml-auto font-medium">
            <span className={transaction.amount > 0 ? "text-green-500" : "text-red-500"}>
              {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
            </span>
          </div>
          <Badge variant="outline" className="ml-2">
            {transaction.category}
          </Badge>
        </div>
      ))}
    </div>
  )
}
