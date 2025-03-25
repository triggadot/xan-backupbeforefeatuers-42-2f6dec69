
import React, { useEffect } from 'react';
import { useBusinessOperations } from '@/hooks/useBusinessOperations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AmountDisplay } from '@/components/common/AmountDisplay';
import { UserCheck, Users, ClipboardList, FileText, Package, ShoppingBag, DollarSign, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { metrics, statusMetrics, isLoading, refreshMetrics } = useBusinessOperations();
  const navigate = useNavigate();

  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  return (
    <div className="container py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshMetrics}>
            Refresh Metrics
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Customers & Vendors Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Customers & Vendors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : (metrics?.total_customers || 0) + (metrics?.total_vendors || 0)}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                <span>Customers: {metrics?.total_customers || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>Vendors: {metrics?.total_vendors || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : (metrics?.total_invoices || 0) + (metrics?.total_estimates || 0) + (metrics?.total_purchase_orders || 0)}
            </div>
            <div className="grid grid-cols-3 text-xs text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>Invoices: {metrics?.total_invoices || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <ClipboardList className="h-3 w-3" />
                <span>Estimates: {metrics?.total_estimates || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>POs: {metrics?.total_purchase_orders || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Products
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : metrics?.total_products || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total inventory items
            </p>
          </CardContent>
        </Card>

        {/* Financial Overview Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Financial Overview
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AmountDisplay 
                amount={!isLoading ? (metrics?.total_outstanding_balance || 0) - (metrics?.total_purchase_balance || 0) : null} 
                variant={(metrics?.total_outstanding_balance || 0) - (metrics?.total_purchase_balance || 0) > 0 ? 'success' : 'destructive'}
              />
            </div>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-1">
              <div className="flex justify-between">
                <span>Outstanding:</span>
                <AmountDisplay amount={metrics?.total_outstanding_balance || 0} variant="success" className="font-medium" />
              </div>
              <div className="flex justify-between">
                <span>Owed to vendors:</span>
                <AmountDisplay amount={metrics?.total_purchase_balance || 0} variant="destructive" className="font-medium" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="estimates">Estimates</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="unpaid-inventory">Unpaid Inventory</TabsTrigger>
        </TabsList>
        
        <TabsContent value="invoices" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.total_invoices || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
              </CardHeader>
              <CardContent>
                <AmountDisplay 
                  amount={metrics?.total_invoice_amount || 0} 
                  className="text-2xl font-bold"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Received</CardTitle>
              </CardHeader>
              <CardContent>
                <AmountDisplay 
                  amount={metrics?.total_payments_received || 0} 
                  variant="success"
                  className="text-2xl font-bold"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <AmountDisplay 
                  amount={metrics?.total_outstanding_balance || 0} 
                  variant={metrics?.total_outstanding_balance ? "warning" : "success"}
                  className="text-2xl font-bold"
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => navigate('/invoices')}>
              View All Invoices
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="estimates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Estimates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.total_estimates || 0}</div>
              </CardContent>
            </Card>
            {/* Add more estimate metrics when available */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => navigate('/estimates')}>
              View All Estimates
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="purchase-orders" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total POs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.total_purchase_orders || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <AmountDisplay 
                  amount={metrics?.total_purchase_amount || 0} 
                  className="text-2xl font-bold"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <AmountDisplay 
                  amount={metrics?.total_payments_made || 0} 
                  variant="success"
                  className="text-2xl font-bold"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <AmountDisplay 
                  amount={metrics?.total_purchase_balance || 0} 
                  variant={metrics?.total_purchase_balance ? "warning" : "success"}
                  className="text-2xl font-bold"
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => navigate('/purchase-orders')}>
              View All Purchase Orders
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="unpaid-inventory" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Unpaid Inventory</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Sample and fronted products that have not been paid for
                </p>
              </div>
              <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Requires Attention</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                View unpaid inventory to see samples and fronted products that need to be paid for or returned
              </p>
              <div className="flex justify-center">
                <Button onClick={() => navigate('/unpaid-inventory')}>
                  View Unpaid Inventory
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
