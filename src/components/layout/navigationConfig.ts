export interface NavigationItem {
  title: string;
  href: string;
  icon: string;
}

export interface NavigationSection {
  title?: string;
  items: NavigationItem[];
}

export interface NavigationConfig {
  mainNav: NavigationItem[];
  sidebarNav: NavigationSection[];
}

export const navigationConfig: NavigationConfig = {
  mainNav: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "dashboard",
    },
    {
      title: "Accounts",
      href: "/accounts",
      icon: "users",
    },
    {
      title: "Estimates",
      href: "/estimates",
      icon: "clipboardList",
    },
    {
      title: "Invoices",
      href: "/invoices",
      icon: "fileText",
    },
    {
      title: "Purchase Orders",
      href: "/purchase-orders",
      icon: "package",
    },
    {
      title: "Products",
      href: "/products",
      icon: "shoppingBag",
    },
    {
      title: "Unpaid Inventory",
      href: "/unpaid-inventory",
      icon: "alertCircle",
    },
    {
      title: "Reports",
      href: "/reports",
      icon: "barChart",
    },
    {
      title: "Settings",
      href: "/settings",
      icon: "settings",
    },
  ],
  sidebarNav: [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: "dashboard",
        },
        {
          title: "Accounts",
          href: "/accounts",
          icon: "users",
        },
        {
          title: "Estimates",
          href: "/estimates",
          icon: "clipboardList",
        },
        {
          title: "Invoices",
          href: "/invoices",
          icon: "fileText",
        },
        {
          title: "Purchase Orders",
          href: "/purchase-orders",
          icon: "package",
        },
        {
          title: "Products",
          href: "/products",
          icon: "shoppingBag",
        },
        {
          title: "Unpaid Inventory",
          href: "/unpaid-inventory",
          icon: "alertCircle", 
        }
      ]
    },
    {
      title: "Management",
      items: [
        {
          title: "Reports",
          href: "/reports",
          icon: "barChart",
        },
        {
          title: "Data Management",
          href: "/data-management",
          icon: "database",
        },
        {
          title: "PDF Management",
          href: "/admin/pdf-management",
          icon: "fileText",
        },
        {
          title: "Settings",
          href: "/settings",
          icon: "settings",
        }
      ]
    },
    {
      title: "Glide Sync",
      items: [
        {
          title: "Sync Dashboard",
          href: "/sync/dashboard",
          icon: "refreshCw",
        },
        {
          title: "Connections",
          href: "/sync/connections",
          icon: "link",
        },
        {
          title: "Mappings",
          href: "/sync/mappings",
          icon: "table",
        },
        {
          title: "Sync Logs",
          href: "/sync/logs",
          icon: "history",
        }
      ]
    }
  ],
};
