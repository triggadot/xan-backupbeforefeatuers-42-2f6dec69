import React from 'react';
import { 
  Card, 
  Title, 
  BarChart, 
  Subtitle, 
  Flex, 
  Text, 
  Grid, 
  Tab, 
  TabGroup, 
  TabList, 
  TabPanel, 
  TabPanels, 
  ProgressBar,
  Metric
} from '@tremor/react';
import { FileText, ClipboardList, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { StatusMetrics } from '@/types/business';

interface StatusMetricsCardProps {
  statusMetrics: StatusMetrics[];
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

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'invoices':
      return <FileText className="h-5 w-5 text-blue-500" />;
    case 'estimates':
      return <ClipboardList className="h-5 w-5 text-amber-500" />;
    case 'purchase_orders':
      return <Truck className="h-5 w-5 text-indigo-500" />;
    default:
      return null;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'invoices':
      return 'Invoices';
    case 'estimates':
      return 'Estimates';
    case 'purchase_orders':
      return 'Purchase Orders';
    default:
      return category;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'invoices':
      return 'blue';
    case 'estimates':
      return 'amber';
    case 'purchase_orders':
      return 'indigo';
    default:
      return 'gray';
  }
};

const StatusMetricsCard = ({ statusMetrics, isLoading }: StatusMetricsCardProps) => {
  if (isLoading || !statusMetrics || statusMetrics.length === 0) {
    return (
      <Card className="mx-auto">
        <Text>Loading document status metrics...</Text>
        <ProgressBar value={100} color="indigo" className="mt-3" />
      </Card>
    );
  }

  // Prepare chart data
  const chartData = statusMetrics.map(metric => ({
    name: getCategoryLabel(metric.category),
    Paid: metric.paid_count,
    Unpaid: metric.unpaid_count,
    Draft: metric.draft_count,
    category: metric.category
  }));

  // Calculate collection rates for each document type
  const documentStats = statusMetrics.map(metric => {
    const collectionRate = metric.total_amount > 0 
      ? (metric.total_paid / metric.total_amount) * 100 
      : 0;
    
    return {
      category: metric.category,
      label: getCategoryLabel(metric.category),
      icon: getCategoryIcon(metric.category),
      color: getCategoryColor(metric.category),
      total_count: metric.total_count,
      total_amount: metric.total_amount,
      total_paid: metric.total_paid,
      balance_amount: metric.balance_amount,
      collection_rate: collectionRate,
      paid_count: metric.paid_count,
      unpaid_count: metric.unpaid_count,
      draft_count: metric.draft_count
    };
  });

  return (
    <Card>
      <Title>Document Status</Title>
      <Subtitle>Overview of document status and financial metrics</Subtitle>
      
      <TabGroup className="mt-6">
        <TabList>
          <Tab icon={FileText}>Overview</Tab>
          <Tab icon={CheckCircle}>Paid</Tab>
          <Tab icon={Clock}>Pending</Tab>
          <Tab icon={AlertCircle}>Draft</Tab>
        </TabList>
        
        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <div className="mt-4">
              <BarChart
                className="mt-6 h-72"
                data={chartData}
                index="name"
                categories={["Paid", "Unpaid", "Draft"]}
                colors={["emerald", "amber", "slate"]}
                stack
                valueFormatter={(value) => `${value.toLocaleString()} docs`}
                yAxisWidth={48}
              />
            </div>
            
            <Grid numItemsLg={3} className="mt-6 gap-6">
              {documentStats.map((stat) => (
                <Card key={stat.category} decoration="top" decorationColor={stat.color as any}>
                  <Flex justifyContent="between" alignItems="center">
                    <Title>{stat.label}</Title>
                    {stat.icon}
                  </Flex>
                  
                  <Flex className="mt-4">
                    <Text>Collection Rate</Text>
                    <Text>{stat.collection_rate.toFixed(1)}%</Text>
                  </Flex>
                  <ProgressBar value={stat.collection_rate} color={stat.color as any} className="mt-2" />
                  
                  <Grid numItemsLg={2} className="mt-4 gap-4">
                    <div>
                      <Text>Total</Text>
                      <Metric>{formatCurrency(stat.total_amount)}</Metric>
                    </div>
                    <div>
                      <Text>Outstanding</Text>
                      <Metric>{formatCurrency(stat.balance_amount)}</Metric>
                    </div>
                  </Grid>
                  
                  <Flex className="mt-4 space-x-4">
                    <div className="text-center">
                      <Text>Total</Text>
                      <Text className="font-medium">{stat.total_count}</Text>
                    </div>
                    <div className="text-center">
                      <Text className="text-emerald-500">Paid</Text>
                      <Text className="font-medium">{stat.paid_count}</Text>
                    </div>
                    <div className="text-center">
                      <Text className="text-amber-500">Unpaid</Text>
                      <Text className="font-medium">{stat.unpaid_count}</Text>
                    </div>
                    <div className="text-center">
                      <Text className="text-slate-500">Draft</Text>
                      <Text className="font-medium">{stat.draft_count}</Text>
                    </div>
                  </Flex>
                </Card>
              ))}
            </Grid>
          </TabPanel>
          
          {/* Paid Tab */}
          <TabPanel>
            <Grid numItemsLg={3} className="mt-6 gap-6">
              {documentStats.map((stat) => (
                <Card key={stat.category} decoration="top" decorationColor="emerald">
                  <Flex justifyContent="between" alignItems="center">
                    <Title>{stat.label}</Title>
                    {stat.icon}
                  </Flex>
                  <div className="mt-4">
                    <Text>Paid Documents</Text>
                    <Metric>{stat.paid_count}</Metric>
                  </div>
                  <div className="mt-4">
                    <Text>Paid Amount</Text>
                    <Metric>{formatCurrency(stat.total_paid)}</Metric>
                  </div>
                  <Flex className="mt-4">
                    <Text>Percentage of Total</Text>
                    <Text>
                      {stat.total_count > 0 
                        ? ((stat.paid_count / stat.total_count) * 100).toFixed(1) 
                        : 0}%
                    </Text>
                  </Flex>
                  <ProgressBar 
                    value={stat.total_count > 0 ? (stat.paid_count / stat.total_count) * 100 : 0} 
                    color="emerald" 
                    className="mt-2" 
                  />
                </Card>
              ))}
            </Grid>
          </TabPanel>
          
          {/* Pending Tab */}
          <TabPanel>
            <Grid numItemsLg={3} className="mt-6 gap-6">
              {documentStats.map((stat) => (
                <Card key={stat.category} decoration="top" decorationColor="amber">
                  <Flex justifyContent="between" alignItems="center">
                    <Title>{stat.label}</Title>
                    {stat.icon}
                  </Flex>
                  <div className="mt-4">
                    <Text>Unpaid Documents</Text>
                    <Metric>{stat.unpaid_count}</Metric>
                  </div>
                  <div className="mt-4">
                    <Text>Outstanding Amount</Text>
                    <Metric>{formatCurrency(stat.balance_amount)}</Metric>
                  </div>
                  <Flex className="mt-4">
                    <Text>Percentage of Total</Text>
                    <Text>
                      {stat.total_count > 0 
                        ? ((stat.unpaid_count / stat.total_count) * 100).toFixed(1) 
                        : 0}%
                    </Text>
                  </Flex>
                  <ProgressBar 
                    value={stat.total_count > 0 ? (stat.unpaid_count / stat.total_count) * 100 : 0} 
                    color="amber" 
                    className="mt-2" 
                  />
                </Card>
              ))}
            </Grid>
          </TabPanel>
          
          {/* Draft Tab */}
          <TabPanel>
            <Grid numItemsLg={3} className="mt-6 gap-6">
              {documentStats.map((stat) => (
                <Card key={stat.category} decoration="top" decorationColor="slate">
                  <Flex justifyContent="between" alignItems="center">
                    <Title>{stat.label}</Title>
                    {stat.icon}
                  </Flex>
                  <div className="mt-4">
                    <Text>Draft Documents</Text>
                    <Metric>{stat.draft_count}</Metric>
                  </div>
                  <Flex className="mt-4">
                    <Text>Percentage of Total</Text>
                    <Text>
                      {stat.total_count > 0 
                        ? ((stat.draft_count / stat.total_count) * 100).toFixed(1) 
                        : 0}%
                    </Text>
                  </Flex>
                  <ProgressBar 
                    value={stat.total_count > 0 ? (stat.draft_count / stat.total_count) * 100 : 0} 
                    color="slate" 
                    className="mt-2" 
                  />
                </Card>
              ))}
            </Grid>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Card>
  );
};

export default StatusMetricsCard;
