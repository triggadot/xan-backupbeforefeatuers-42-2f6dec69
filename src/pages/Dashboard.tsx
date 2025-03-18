
import React from 'react';
import { 
  BarChart, 
  DollarSign, 
  LineChart, 
  Package, 
  ShoppingBag, 
  ShoppingCart, 
  Users 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import MetricCard from '@/components/common/MetricCard';
import { useStore, useDashboardMetrics } from '@/store';
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// Format currency
const formatCurrency = (value: number | string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const Dashboard: React.FC = () => {
  const {
    totalReceivable,
    totalPayable,
    inventoryValue,
    totalSales,
    pendingEstimatesValue,
    activeCustomers,
    activeVendors,
    lowStockProducts,
  } = useDashboardMetrics();
  
  const invoices = useStore((state) => state.invoices);
  const estimates = useStore((state) => state.estimates);
  
  // Prepare data for charts
  const recentInvoicesData = invoices
    .slice(0, 10)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((invoice) => ({
      name: invoice.number,
      value: invoice.total,
      status: invoice.status,
    }));
  
  const salesData = [
    { name: 'Jan', sales: 4000 },
    { name: 'Feb', sales: 3000 },
    { name: 'Mar', sales: 5000 },
    { name: 'Apr', sales: 4500 },
    { name: 'May', sales: 6000 },
    { name: 'Jun', sales: 5500 },
    { name: 'Jul', sales: 7000 },
  ];

  return (
    <div className="animate-enter-bottom">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-2 md:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Receivable"
          value={totalReceivable}
          icon={<DollarSign className="h-4 w-4" />}
          formatValue={formatCurrency}
          change={12}
          changeType="increase"
        />
        
        <MetricCard
          title="Total Payable"
          value={totalPayable}
          icon={<ShoppingCart className="h-4 w-4" />}
          formatValue={formatCurrency}
          change={5}
          changeType="decrease"
        />
        
        <MetricCard
          title="Inventory Value"
          value={inventoryValue}
          icon={<Package className="h-4 w-4" />}
          formatValue={formatCurrency}
          change={3}
          changeType="increase"
        />
        
        <MetricCard
          title="Total Sales"
          value={totalSales}
          icon={<ShoppingBag className="h-4 w-4" />}
          formatValue={formatCurrency}
          change={18}
          changeType="increase"
        />
      </div>
      
      <div className="grid gap-6 mt-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-4 lg:col-span-5 hover-lift">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>Monthly revenue breakdown</CardDescription>
            </div>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={salesData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip 
                    formatter={(value) => [`$${value}`, 'Sales']}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                      borderRadius: '6px',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2 hover-lift">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key business metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Active Customers</p>
                  <p className="text-xl font-bold">{activeCustomers}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center">
                <ShoppingCart className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Active Vendors</p>
                  <p className="text-xl font-bold">{activeVendors}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center">
                <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Low Stock Items</p>
                  <p className="text-xl font-bold">{lowStockProducts}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center">
                <BarChart className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="ml-2">
                  <p className="text-sm font-medium">Pending Estimates</p>
                  <p className="text-xl font-bold">{formatCurrency(pendingEstimatesValue)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 mt-6 md:grid-cols-2">
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Latest customer invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices
                .slice(0, 5)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{invoice.number}</span>
                      <span className="text-xs text-muted-foreground">{invoice.accountName}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 text-sm font-medium">
                        {formatCurrency(invoice.total)}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Open Estimates</CardTitle>
            <CardDescription>Pending customer estimates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {estimates
                .filter((estimate) => estimate.status === 'sent')
                .slice(0, 5)
                .map((estimate) => (
                  <div key={estimate.id} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{estimate.number}</span>
                      <span className="text-xs text-muted-foreground">{estimate.accountName}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2 text-sm font-medium">
                        {formatCurrency(estimate.total)}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
