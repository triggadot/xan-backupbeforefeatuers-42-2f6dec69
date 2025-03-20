import { useState, useEffect } from 'react';
import { useSupabaseTables } from '@/hooks/useSupabaseTables';
import SupabaseTableView from '@/components/data-management/SupabaseTableView';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

// This is needed to type the table_name property
interface SupabaseTable {
  table_name: string;
}

// Define table display names and descriptions
const TABLE_INFO: Record<string, { displayName: string; description: string }> = {
  gl_accounts: {
    displayName: 'Accounts',
    description: 'Customer and vendor accounts information'
  },
  gl_invoices: {
    displayName: 'Invoices',
    description: 'Customer invoices and orders'
  },
  gl_invoice_lines: {
    displayName: 'Invoice Line Items',
    description: 'Individual line items on invoices'
  },
  gl_products: {
    displayName: 'Products',
    description: 'Product catalog and inventory'
  },
  gl_purchase_orders: {
    displayName: 'Purchase Orders',
    description: 'Orders made to vendors'
  },
  gl_estimates: {
    displayName: 'Estimates',
    description: 'Customer estimates and quotes'
  },
  gl_estimate_lines: {
    displayName: 'Estimate Line Items',
    description: 'Individual line items on estimates'
  },
  gl_customer_payments: {
    displayName: 'Customer Payments',
    description: 'Payments received from customers'
  },
  gl_vendor_payments: {
    displayName: 'Vendor Payments',
    description: 'Payments made to vendors'
  },
  gl_expenses: {
    displayName: 'Expenses',
    description: 'Business expenses and transactions'
  },
  gl_shipping_records: {
    displayName: 'Shipping Records',
    description: 'Shipping and delivery information'
  },
  gl_mappings: {
    displayName: 'Glide Mappings',
    description: 'Table mapping configurations for Glide sync'
  }
};

export default function DataManagement() {
  const { tables, isLoading, fetchTables } = useSupabaseTables();
  const [activeTable, setActiveTable] = useState<string | null>(null);

  // Set the first table as active when tables are loaded
  useEffect(() => {
    if (tables.length > 0 && !activeTable) {
      // Try to set a gl_ table as default first
      const glTable = tables.find(t => t.table_name.startsWith('gl_'));
      setActiveTable(glTable?.table_name || tables[0].table_name);
    }
  }, [tables, activeTable]);

  // Filter tables to only show gl_ tables and a few other important ones
  const filteredTables = tables.filter(table => {
    // Include all gl_ tables
    if (table.table_name.startsWith('gl_')) return true;
    
    // Include a few other important tables
    const otherImportantTables = ['profiles', 'settings'];
    return otherImportantTables.includes(table.table_name);
  });

  const getTableInfo = (tableName: string) => {
    return TABLE_INFO[tableName] || {
      displayName: tableName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      description: 'No description available'
    };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Database Management</CardTitle>
            <CardDescription>Loading available tables...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Database Management</h1>
        <p className="text-muted-foreground mt-2">
          View and manage data in your Supabase database tables with full CRUD operations.
        </p>
      </div>

      <Alert className="mb-8">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Glide Data Sync</AlertTitle>
        <AlertDescription>
          These tables contain data synchronized from your Glide app. Changes made here will be reflected in your 
          application after the next sync cycle.
        </AlertDescription>
      </Alert>

      {filteredTables.length > 0 ? (
        <Tabs 
          value={activeTable || undefined} 
          onValueChange={setActiveTable}
          className="space-y-4"
        >
          <div className="border-b">
            <TabsList className="w-full h-auto flex flex-wrap">
              {filteredTables.map(table => (
                <TabsTrigger 
                  key={table.table_name} 
                  value={table.table_name}
                  className="py-2"
                >
                  {getTableInfo(table.table_name).displayName}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {filteredTables.map(table => (
            <TabsContent key={table.table_name} value={table.table_name} className="space-y-4">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-2xl">{getTableInfo(table.table_name).displayName}</CardTitle>
                  <CardDescription>{getTableInfo(table.table_name).description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <SupabaseTableView 
                    tableName={table.table_name}
                    displayName={getTableInfo(table.table_name).displayName}
                    description={getTableInfo(table.table_name).description}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Tables Found</CardTitle>
            <CardDescription>
              No database tables were found in your Supabase project.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
