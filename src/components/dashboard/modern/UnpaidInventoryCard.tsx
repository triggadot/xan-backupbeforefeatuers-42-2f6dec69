import React from 'react';
import { 
  Card, 
  Title, 
  Text, 
  Tab, 
  TabGroup, 
  TabList, 
  TabPanel, 
  TabPanels,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Badge,
  Flex,
  Metric,
  DonutChart,
  Legend
} from '@tremor/react';
import { Package, Gift, Calendar, DollarSign, ShoppingBag, User } from 'lucide-react';
import { UnpaidProduct } from '@/types/products';
import { Link } from 'react-router-dom';

interface UnpaidInventoryCardProps {
  samples: UnpaidProduct[];
  fronted: UnpaidProduct[];
  totalValue: number;
  isLoading: boolean;
}

// Helper function to format currency values
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Helper function to format dates
const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const UnpaidInventoryCard = ({ samples, fronted, totalValue, isLoading }: UnpaidInventoryCardProps) => {
  if (isLoading) {
    return (
      <Card className="mx-auto">
        <Text>Loading unpaid inventory data...</Text>
      </Card>
    );
  }

  // Calculate total counts and values
  const totalSamples = samples.length;
  const totalFronted = fronted.length;
  const sampleValue = samples.reduce((sum, item) => sum + item.unpaid_value, 0);
  const frontedValue = fronted.reduce((sum, item) => sum + item.unpaid_value, 0);

  // Prepare chart data
  const chartData = [
    { name: 'Samples', value: sampleValue },
    { name: 'Fronted', value: frontedValue }
  ];

  // Prepare vendor summary data
  const vendorMap = new Map<string, { count: number, value: number }>();
  
  [...samples, ...fronted].forEach(item => {
    const vendorName = item.vendor_name || 'Unknown';
    const current = vendorMap.get(vendorName) || { count: 0, value: 0 };
    vendorMap.set(vendorName, {
      count: current.count + 1,
      value: current.value + item.unpaid_value
    });
  });
  
  const vendorSummary = Array.from(vendorMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 vendors

  return (
    <Card>
      <Title>Unpaid Inventory</Title>
      <Text>Samples and fronted products that need attention</Text>
      
      <TabGroup className="mt-6">
        <TabList>
          <Tab icon={ShoppingBag}>Overview</Tab>
          <Tab icon={Gift}>Samples ({totalSamples})</Tab>
          <Tab icon={Package}>Fronted ({totalFronted})</Tab>
        </TabList>
        
        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <div className="mt-6">
              <Flex>
                <div>
                  <Text>Total Unpaid Value</Text>
                  <Metric>{formatCurrency(totalValue)}</Metric>
                  <Text className="mt-2">Total Items: {totalSamples + totalFronted}</Text>
                </div>
                <div className="w-1/2">
                  <DonutChart
                    className="mt-6"
                    data={chartData}
                    category="value"
                    index="name"
                    valueFormatter={formatCurrency}
                    colors={["violet", "indigo"]}
                  />
                  <Legend
                    className="mt-3"
                    categories={["Samples", "Fronted"]}
                    colors={["violet", "indigo"]}
                  />
                </div>
              </Flex>
            </div>
            
            {vendorSummary.length > 0 && (
              <div className="mt-6">
                <Title className="text-base">Top Vendors</Title>
                <Table className="mt-4">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Vendor</TableHeaderCell>
                      <TableHeaderCell>Items</TableHeaderCell>
                      <TableHeaderCell>Value</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vendorSummary.map((vendor) => (
                      <TableRow key={vendor.name}>
                        <TableCell>{vendor.name}</TableCell>
                        <TableCell>{vendor.count}</TableCell>
                        <TableCell>{formatCurrency(vendor.value)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            <div className="mt-6 text-center">
              <Link 
                to="/unpaid-inventory" 
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
              >
                View All Unpaid Inventory
              </Link>
            </div>
          </TabPanel>
          
          {/* Samples Tab */}
          <TabPanel>
            <div className="mt-4">
              <Flex>
                <div>
                  <Text>Total Sample Value</Text>
                  <Metric>{formatCurrency(sampleValue)}</Metric>
                </div>
                <div>
                  <Text>Total Samples</Text>
                  <Metric>{totalSamples}</Metric>
                </div>
              </Flex>
            </div>
            
            <Table className="mt-6">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Product</TableHeaderCell>
                  <TableHeaderCell>Vendor</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Quantity</TableHeaderCell>
                  <TableHeaderCell>Value</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {samples.slice(0, 5).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Badge color="violet" size="xs" className="mr-2">Sample</Badge>
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-gray-500" />
                        {item.vendor_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                        {formatDate(item.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                        {formatCurrency(item.unpaid_value)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {samples.length > 5 && (
              <div className="mt-4 text-center">
                <Text className="text-sm text-gray-500">
                  Showing 5 of {samples.length} samples
                </Text>
                <Link 
                  to="/unpaid-inventory" 
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 mt-2"
                >
                  View All Samples
                </Link>
              </div>
            )}
          </TabPanel>
          
          {/* Fronted Tab */}
          <TabPanel>
            <div className="mt-4">
              <Flex>
                <div>
                  <Text>Total Fronted Value</Text>
                  <Metric>{formatCurrency(frontedValue)}</Metric>
                </div>
                <div>
                  <Text>Total Fronted Items</Text>
                  <Metric>{totalFronted}</Metric>
                </div>
              </Flex>
            </div>
            
            <Table className="mt-6">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Product</TableHeaderCell>
                  <TableHeaderCell>Vendor</TableHeaderCell>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Quantity</TableHeaderCell>
                  <TableHeaderCell>Value</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fronted.slice(0, 5).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Badge color="indigo" size="xs" className="mr-2">Fronted</Badge>
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-gray-500" />
                        {item.vendor_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                        {formatDate(item.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                        {formatCurrency(item.unpaid_value)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {fronted.length > 5 && (
              <div className="mt-4 text-center">
                <Text className="text-sm text-gray-500">
                  Showing 5 of {fronted.length} fronted items
                </Text>
                <Link 
                  to="/unpaid-inventory" 
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 mt-2"
                >
                  View All Fronted Items
                </Link>
              </div>
            )}
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Card>
  );
};

export default UnpaidInventoryCard;
