
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
      ]
    }
  ],
};
