import React, { useEffect } from 'react';
import { useBusinessDashboard } from '@/hooks/useBusinessDashboard';
import { Button } from '@/components/ui/button';
import { 
  Grid, 
  Col, 
  Card, 
  Title, 
  Text, 
  Tab, 
  TabGroup, 
  TabList, 
  TabPanel, 
  TabPanels,
  Flex,
  Metric,
  ProgressBar
} from '@tremor/react';
import { 
  RefreshCw, 
  BarChart2, 
  FileText, 
  ShoppingBag, 
  Users, 
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Import our modern dashboard components
import BusinessMetricsCard from '@/components/dashboard/modern/BusinessMetricsCard';
import StatusMetricsCard from '@/components/dashboard/modern/StatusMetricsCard';
import UnpaidInventoryCard from '@/components/dashboard/modern/UnpaidInventoryCard';

export default function ModernDashboard() {
  const { 
    metrics, 
    statusMetrics, 
    unpaidInventory,
    isLoading, 
    error, 
    refreshDashboard 
  } = useBusinessDashboard();

  // Fetch dashboard data on component mount
  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  return (
    <div className="container py-8 space-y-8">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your business operations and financial metrics
          </p>
        </div>
        <Button 
          onClick={refreshDashboard} 
          variant="outline" 
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Error message if data fetch failed */}
      {error && (
        <Card className="bg-destructive/10 border-destructive">
          <Flex>
            <div>
              <Title className="text-destructive">Error Loading Dashboard</Title>
              <Text>{error}</Text>
            </div>
            <Button 
              onClick={refreshDashboard} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              Try Again
            </Button>
          </Flex>
        </Card>
      )}

      {/* Loading indicator */}
      {isLoading && !metrics && (
        <Card>
          <Text>Loading dashboard data...</Text>
          <ProgressBar value={100} color="indigo" className="mt-3" />
        </Card>
      )}

      {/* Main dashboard content */}
      <TabGroup>
        <TabList>
          <Tab icon={BarChart2}>Overview</Tab>
          <Tab icon={FileText}>Documents</Tab>
          <Tab icon={ShoppingBag}>Inventory</Tab>
          <Tab icon={Users}>Accounts</Tab>
        </TabList>
        
        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <div className="mt-6 space-y-6">
              {/* Business Metrics Card */}
              <BusinessMetricsCard 
                metrics={metrics} 
                isLoading={isLoading} 
              />
              
              {/* Status Metrics Card */}
              <StatusMetricsCard 
                statusMetrics={statusMetrics} 
                isLoading={isLoading} 
              />
              
              {/* Unpaid Inventory Card */}
              <UnpaidInventoryCard 
                samples={unpaidInventory.samples} 
                fronted={unpaidInventory.fronted}
                totalValue={unpaidInventory.totalValue}
                isLoading={isLoading} 
              />
            </div>
          </TabPanel>
          
          {/* Documents Tab */}
          <TabPanel>
            <Grid numItemsLg={3} className="mt-6 gap-6">
              {/* Invoices Section */}
              <Card decoration="top" decorationColor="blue">
                <Flex justifyContent="between" alignItems="center">
                  <Title>Invoices</Title>
                  <FileText className="h-5 w-5 text-blue-500" />
                </Flex>
                <div className="mt-4">
                  <Text>Total Invoices</Text>
                  <Metric>{metrics?.total_invoices || 0}</Metric>
                </div>
                <div className="mt-4">
                  <Text>Total Revenue</Text>
                  <Metric>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(metrics?.total_invoice_amount || 0)}
                  </Metric>
                </div>
                <div className="mt-4">
                  <Text>Outstanding Balance</Text>
                  <Metric>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(metrics?.total_outstanding_balance || 0)}
                  </Metric>
                </div>
                <div className="mt-6">
                  <Link 
                    to="/invoices" 
                    className="inline-flex items-center text-blue-500 hover:underline"
                  >
                    View All Invoices
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </Card>
              
              {/* Estimates Section */}
              <Card decoration="top" decorationColor="amber">
                <Flex justifyContent="between" alignItems="center">
                  <Title>Estimates</Title>
                  <FileText className="h-5 w-5 text-amber-500" />
                </Flex>
                <div className="mt-4">
                  <Text>Total Estimates</Text>
                  <Metric>{metrics?.total_estimates || 0}</Metric>
                </div>
                <div className="mt-4">
                  <Text>Conversion Rate</Text>
                  <Metric>
                    {statusMetrics.find(m => m.category === 'estimates')?.paid_count || 0} converted
                  </Metric>
                </div>
                <div className="mt-6">
                  <Link 
                    to="/estimates" 
                    className="inline-flex items-center text-amber-500 hover:underline"
                  >
                    View All Estimates
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </Card>
              
              {/* Purchase Orders Section */}
              <Card decoration="top" decorationColor="indigo">
                <Flex justifyContent="between" alignItems="center">
                  <Title>Purchase Orders</Title>
                  <FileText className="h-5 w-5 text-indigo-500" />
                </Flex>
                <div className="mt-4">
                  <Text>Total Purchase Orders</Text>
                  <Metric>{metrics?.total_purchase_orders || 0}</Metric>
                </div>
                <div className="mt-4">
                  <Text>Total Purchases</Text>
                  <Metric>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(metrics?.total_purchase_amount || 0)}
                  </Metric>
                </div>
                <div className="mt-4">
                  <Text>Outstanding Balance</Text>
                  <Metric>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(metrics?.total_purchase_balance || 0)}
                  </Metric>
                </div>
                <div className="mt-6">
                  <Link 
                    to="/purchase-orders" 
                    className="inline-flex items-center text-indigo-500 hover:underline"
                  >
                    View All Purchase Orders
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </Card>
            </Grid>
          </TabPanel>
          
          {/* Inventory Tab */}
          <TabPanel>
            <div className="mt-6 space-y-6">
              <Card>
                <Flex justifyContent="between" alignItems="center">
                  <div>
                    <Title>Inventory Overview</Title>
                    <Text>Products, samples, and fronted inventory</Text>
                  </div>
                  <ShoppingBag className="h-6 w-6 text-gray-500" />
                </Flex>
                
                <Grid numItemsLg={3} className="mt-6 gap-6">
                  <Card decoration="left" decorationColor="green">
                    <Title>Products</Title>
                    <Metric>{metrics?.total_products || 0}</Metric>
                    <div className="mt-4">
                      <Link 
                        to="/products" 
                        className="inline-flex items-center text-green-500 hover:underline"
                      >
                        View All Products
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </Card>
                  
                  <Card decoration="left" decorationColor="violet">
                    <Title>Samples</Title>
                    <Metric>{unpaidInventory.samples.length}</Metric>
                    <Text>Value: {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(unpaidInventory.samples.reduce((sum, item) => sum + item.unpaid_value, 0))}</Text>
                    <div className="mt-4">
                      <Link 
                        to="/unpaid-inventory" 
                        className="inline-flex items-center text-violet-500 hover:underline"
                      >
                        View All Samples
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </Card>
                  
                  <Card decoration="left" decorationColor="indigo">
                    <Title>Fronted</Title>
                    <Metric>{unpaidInventory.fronted.length}</Metric>
                    <Text>Value: {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(unpaidInventory.fronted.reduce((sum, item) => sum + item.unpaid_value, 0))}</Text>
                    <div className="mt-4">
                      <Link 
                        to="/unpaid-inventory" 
                        className="inline-flex items-center text-indigo-500 hover:underline"
                      >
                        View All Fronted Items
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </Card>
                </Grid>
              </Card>
              
              <UnpaidInventoryCard 
                samples={unpaidInventory.samples} 
                fronted={unpaidInventory.fronted}
                totalValue={unpaidInventory.totalValue}
                isLoading={isLoading} 
              />
            </div>
          </TabPanel>
          
          {/* Accounts Tab */}
          <TabPanel>
            <div className="mt-6 space-y-6">
              <Card>
                <Flex justifyContent="between" alignItems="center">
                  <div>
                    <Title>Account Overview</Title>
                    <Text>Customers and vendors</Text>
                  </div>
                  <Users className="h-6 w-6 text-gray-500" />
                </Flex>
                
                <Grid numItemsLg={2} className="mt-6 gap-6">
                  <Card decoration="left" decorationColor="blue">
                    <Title>Customers</Title>
                    <Metric>{metrics?.total_customers || 0}</Metric>
                    <div className="mt-4">
                      <Link 
                        to="/accounts?type=customer" 
                        className="inline-flex items-center text-blue-500 hover:underline"
                      >
                        View All Customers
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </Card>
                  
                  <Card decoration="left" decorationColor="amber">
                    <Title>Vendors</Title>
                    <Metric>{metrics?.total_vendors || 0}</Metric>
                    <div className="mt-4">
                      <Link 
                        to="/accounts?type=vendor" 
                        className="inline-flex items-center text-amber-500 hover:underline"
                      >
                        View All Vendors
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                  </Card>
                </Grid>
              </Card>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
