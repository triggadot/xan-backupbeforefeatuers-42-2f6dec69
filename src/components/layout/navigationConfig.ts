import { 
  BarChart3, 
  ClipboardList, 
  Database, 
  FileSpreadsheet,
  FileText, 
  Home,
  LayoutDashboard, 
  Package2, 
  Receipt, 
  ShoppingCart, 
  Table, 
  User,
  Users,
} from "lucide-react"

export interface NavigationItem {
  title: string
  url: string
  icon: React.ElementType
  badge?: string
}

export const mainItems: NavigationItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Accounts",
    url: "/accounts",
    icon: Users,
    badge: "New"
  },
  {
    title: "Products",
    url: "/products",
    icon: Package2,
  },
]

export const documentItems: NavigationItem[] = [
  {
    title: "Purchase Orders",
    url: "/purchase-orders",
    icon: ShoppingCart,
  },
  {
    title: "Estimates",
    url: "/estimates",
    icon: FileSpreadsheet,
  },
  {
    title: "Invoices",
    url: "/invoices",
    icon: Receipt,
    badge: "3"
  },
]

export const reportItems: NavigationItem[] = [
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Activity",
    url: "/activity",
    icon: ClipboardList,
  },
]

export const adminItems: NavigationItem[] = [
  {
    title: "Glide Sync",
    url: "/sync",
    icon: FileText,
  },
  {
    title: "Database Management",
    url: "/data-management",
    icon: Database,
  },
  {
    title: "Table Demo",
    url: "/table-demo",
    icon: Table,
  },
] 