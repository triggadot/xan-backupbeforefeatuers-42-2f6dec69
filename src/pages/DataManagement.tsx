import { useState, useEffect } from 'react';
import { useSupabaseTables } from '@/hooks/useSupabaseTables';
import SupabaseTableView from '@/components/data-management/SupabaseTableView';
import { 
  RefreshCw, 
  Database, 
  AlertCircle, 
  Info 
} from 'lucide-react';

// This is needed to type the table_name property
interface SupabaseTable {
  table_name: string;
}

// Define table display names and descriptions
const TABLE_INFO: Record<string, { displayName: string; description: string; icon?: string }> = {
  gl_accounts: {
    displayName: 'Accounts',
    description: 'Customer and vendor accounts information',
    icon: 'users'
  },
  gl_invoices: {
    displayName: 'Invoices',
    description: 'Customer invoices and orders',
    icon: 'file-text'
  },
  gl_invoice_lines: {
    displayName: 'Invoice Line Items',
    description: 'Individual line items on invoices',
    icon: 'list'
  },
  gl_products: {
    displayName: 'Products',
    description: 'Product catalog and inventory',
    icon: 'package'
  },
  gl_purchase_orders: {
    displayName: 'Purchase Orders',
    description: 'Orders made to vendors',
    icon: 'shopping-cart'
  },
  gl_estimates: {
    displayName: 'Estimates',
    description: 'Customer estimates and quotes',
    icon: 'clipboard'
  },
  gl_estimate_lines: {
    displayName: 'Estimate Line Items',
    description: 'Individual line items on estimates',
    icon: 'list-check'
  },
  gl_customer_payments: {
    displayName: 'Customer Payments',
    description: 'Payments received from customers',
    icon: 'credit-card'
  },
  gl_vendor_payments: {
    displayName: 'Vendor Payments',
    description: 'Payments made to vendors',
    icon: 'credit-card'
  },
  gl_expenses: {
    displayName: 'Expenses',
    description: 'Business expenses and transactions',
    icon: 'receipt'
  },
  gl_shipping_records: {
    displayName: 'Shipping Records',
    description: 'Shipping and delivery information',
    icon: 'truck'
  },
  gl_mappings: {
    displayName: 'Glide Mappings',
    description: 'Table mapping configurations for Glide sync',
    icon: 'git-merge'
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

  // Handle refresh of tables
  const handleRefresh = () => {
    fetchTables(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-[85rem] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-slate-900 dark:border-gray-700">
          <div className="p-4 md:p-5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                Database Management
              </h2>
              <span className="text-sm text-gray-500">Loading available tables...</span>
            </div>
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-b-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[85rem] w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Database Management</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              View and manage data in your Supabase database tables with full CRUD operations.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              type="button"
              onClick={handleRefresh}
              className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Tables
            </button>
          </div>
        </div>
      </div>

      {/* Alert Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-8 dark:bg-slate-800 dark:border-blue-800">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400">
              Glide Data Sync
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              <p>
                These tables contain data synchronized from your Glide app. Changes made here will be reflected in your 
                application after the next sync cycle.
              </p>
            </div>
          </div>
        </div>
      </div>

      {filteredTables.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-slate-900 dark:border-gray-700">
          {/* Table Selection */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-4 overflow-x-auto">
            <div className="flex flex-wrap gap-2">
              {filteredTables.map((table) => (
                <button
                  key={table.table_name}
                  onClick={() => setActiveTable(table.table_name)}
                  className={`py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg ${
                    activeTable === table.table_name
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400'
                      : 'border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:bg-slate-900 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800'
                  }`}
                >
                  <Database className="h-4 w-4" />
                  {getTableInfo(table.table_name).displayName}
                </button>
              ))}
            </div>
          </div>

          {/* Active Table View */}
          <div className="p-4 md:p-5">
            {activeTable && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    {getTableInfo(activeTable).displayName}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getTableInfo(activeTable).description}
                  </p>
                </div>
                <SupabaseTableView 
                  tableName={activeTable}
                  displayName={getTableInfo(activeTable).displayName}
                  description={getTableInfo(activeTable).description}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 dark:bg-slate-900 dark:border-gray-700">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800 dark:text-white">
                No Tables Found
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                No database tables were found in your Supabase project.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
