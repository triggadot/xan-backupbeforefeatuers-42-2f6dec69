"use client";

import { useState, useEffect } from "react";
import { PurchaseOrderTable } from "@/components/ui/purchase-order-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";

// Sample data for demonstration purposes
const samplePurchaseOrders = [
  {
    id: "1",
    glide_row_id: "po1",
    po_date: "2025-03-15T00:00:00.000Z",
    rowid_accounts: "acc1",
    purchase_order_uid: "PO#ACC123M031525",
    pdf_link: "https://example.com/po1.pdf",
    total_amount: 1250.75,
    total_paid: 750.25,
    balance: 500.50,
    payment_status: "partial",
    product_count: 3,
    account: {
      id: "101",
      glide_row_id: "acc1",
      account_name: "Acme Supply Co.",
      client_type: "Vendor",
      accounts_uid: "ACC123",
      photo: "https://ui-avatars.com/api/?name=Acme+Supply&background=0D8ABC&color=fff"
    },
    products: [
      {
        id: "p1",
        glide_row_id: "prod1",
        vendor_product_name: "Industrial Widget A-100",
        new_product_name: "Premium Widget",
        total_qty_purchased: 5,
        cost: 150.00,
        display_name: "Premium Widget"
      },
      {
        id: "p2",
        glide_row_id: "prod2",
        vendor_product_name: "Connector B-200",
        new_product_name: "Standard Connector",
        total_qty_purchased: 10,
        cost: 45.00,
        display_name: "Standard Connector"
      },
      {
        id: "p3",
        glide_row_id: "prod3",
        vendor_product_name: "Miscellaneous Supplies",
        new_product_name: "Office Supplies Bundle",
        total_qty_purchased: 1,
        cost: 75.75,
        display_name: "Office Supplies Bundle"
      }
    ]
  },
  {
    id: "2",
    glide_row_id: "po2",
    po_date: "2025-03-20T00:00:00.000Z",
    rowid_accounts: "acc2",
    purchase_order_uid: "PO#ACC456M032025",
    pdf_link: "https://example.com/po2.pdf",
    total_amount: 2300.00,
    total_paid: 2300.00,
    balance: 0,
    payment_status: "paid",
    product_count: 2,
    account: {
      id: "102",
      glide_row_id: "acc2",
      account_name: "TechParts Inc.",
      client_type: "Vendor",
      accounts_uid: "ACC456",
      photo: "https://ui-avatars.com/api/?name=TechParts&background=2A9D8F&color=fff"
    },
    products: [
      {
        id: "p4",
        glide_row_id: "prod4",
        vendor_product_name: "Server Component X-500",
        new_product_name: "Enterprise Server Module",
        total_qty_purchased: 2,
        cost: 950.00,
        display_name: "Enterprise Server Module"
      },
      {
        id: "p5",
        glide_row_id: "prod5",
        vendor_product_name: "Networking Cable Bundle",
        new_product_name: "Premium Network Kit",
        total_qty_purchased: 4,
        cost: 100.00,
        display_name: "Premium Network Kit"
      }
    ]
  },
  {
    id: "3",
    glide_row_id: "po3",
    po_date: "2025-03-25T00:00:00.000Z",
    rowid_accounts: "acc3",
    purchase_order_uid: "PO#ACC789M032525",
    pdf_link: null,
    total_amount: 750.50,
    total_paid: 0,
    balance: 750.50,
    payment_status: "unpaid",
    product_count: 1,
    account: {
      id: "103",
      glide_row_id: "acc3",
      account_name: "Global Materials Ltd.",
      client_type: "Vendor",
      accounts_uid: "ACC789",
      photo: "https://ui-avatars.com/api/?name=Global+Materials&background=E9C46A&color=000"
    },
    products: [
      {
        id: "p6",
        glide_row_id: "prod6",
        vendor_product_name: "Raw Materials Batch #45678",
        new_product_name: "Premium Raw Materials",
        total_qty_purchased: 15,
        cost: 50.03,
        display_name: "Premium Raw Materials"
      }
    ]
  }
];

export function PurchaseOrderDemo() {
  const [activeTab, setActiveTab] = useState("purchase-orders");

  const handleViewPdf = (purchaseOrder: any) => {
    if (purchaseOrder.pdf_link) {
      window.open(purchaseOrder.pdf_link, '_blank');
    } else {
      alert('PDF is not available for this purchase order.');
    }
  };

  const handleDownloadPdf = (purchaseOrder: any) => {
    if (purchaseOrder.pdf_link) {
      // In a real app, this would trigger a download
      alert(`Downloading PDF for ${purchaseOrder.purchase_order_uid}`);
    } else {
      alert('PDF is not available for this purchase order.');
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold">Data Table Components</h1>
        <p className="text-muted-foreground">
          Demonstration of different table components for your application.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="generic-table">Generic Data Table</TabsTrigger>
        </TabsList>
        
        <TabsContent value="purchase-orders" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Purchase Order Table</h2>
            <Button>Create New Purchase Order</Button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <PurchaseOrderTable 
              purchaseOrders={samplePurchaseOrders}
              onViewPdf={handleViewPdf}
              onDownloadPdf={handleDownloadPdf}
            />
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Component Details</h3>
            <p>This purchase order table is specifically designed for your application's data structure. It:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Displays purchase orders with their vendor information</li>
              <li>Shows payment status with appropriate color-coding</li>
              <li>Allows expanding each row to view product line items</li>
              <li>Provides PDF viewing and downloading capabilities</li>
              <li>Includes search functionality for filtering purchase orders</li>
            </ul>
          </div>
        </TabsContent>
        
        <TabsContent value="generic-table" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Generic Data Table</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <DataTable />
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Component Details</h3>
            <p>This is a generic data table component with advanced features:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Multi-column sorting and filtering</li>
              <li>Column visibility toggle</li>
              <li>Row selection with batch actions</li>
              <li>Pagination with customizable page size</li>
              <li>Responsive design that works on various screen sizes</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
