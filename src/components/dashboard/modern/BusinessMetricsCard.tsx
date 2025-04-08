import React from 'react';
import { 
  Card,
  Metric,
  Text,
  Flex,
  Grid,
  BadgeDelta,
  DeltaType,
  ProgressBar
} from '@tremor/react';
import { 
  TrendingUp, 
  ShoppingBag, 
  FileText, 
  ClipboardList, 
  Users, 
  Truck,
  DollarSign,
  BarChart2
} from 'lucide-react';
import { BusinessMetrics } from '@/types/business';

interface BusinessMetricsCardProps {
  metrics: BusinessMetrics | null;
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

// Helper function to format large numbers with commas
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

// Calculate payment progress percentage
const calculateProgress = (total: number, paid: number): number => {
  if (total === 0) return 0;
  return Math.min(100, (paid / total) * 100);
};

// Determine delta type based on values
const determineDeltaType = (value: number): DeltaType => {
  if (value > 0) return 'increase';
  if (value < 0) return 'decrease';
  return 'unchanged';
};

const BusinessMetricsCard = ({ metrics, isLoading }: BusinessMetricsCardProps) => {
  if (isLoading || !metrics) {
    return (
      <Card className="mx-auto">
        <Text>Loading business metrics...</Text>
        <ProgressBar value={100} color="indigo" className="mt-3" />
      </Card>
    );
  }

  // Calculate invoice collection rate
  const invoiceCollectionRate = metrics.total_invoice_amount > 0 
    ? (metrics.total_payments_received / metrics.total_invoice_amount) * 100 
    : 0;

  // Calculate purchase payment rate
  const purchasePaymentRate = metrics.total_purchase_amount > 0 
    ? (metrics.total_payments_made / metrics.total_purchase_amount) * 100 
    : 0;

  return (
    <Card className="mx-auto">
      <Flex alignItems="start">
        <div>
          <Text>Business Overview</Text>
          <Metric>Performance Dashboard</Metric>
        </div>
        <BadgeDelta deltaType="moderateIncrease">Active</BadgeDelta>
      </Flex>
      
      <Grid numItemsLg={3} className="mt-6 gap-6">
        {/* Documents Section */}
        <Card decoration="top" decorationColor="blue">
          <Flex justifyContent="between" alignItems="center">
            <Text>Documents</Text>
            <FileText className="h-5 w-5 text-blue-500" />
          </Flex>
          <div className="mt-4 space-y-2">
            <Flex justifyContent="between">
              <Text>Invoices</Text>
              <Text>{formatNumber(metrics.total_invoices)}</Text>
            </Flex>
            <Flex justifyContent="between">
              <Text>Estimates</Text>
              <Text>{formatNumber(metrics.total_estimates)}</Text>
            </Flex>
            <Flex justifyContent="between">
              <Text>Purchase Orders</Text>
              <Text>{formatNumber(metrics.total_purchase_orders)}</Text>
            </Flex>
          </div>
        </Card>

        {/* Accounts Section */}
        <Card decoration="top" decorationColor="indigo">
          <Flex justifyContent="between" alignItems="center">
            <Text>Accounts</Text>
            <Users className="h-5 w-5 text-indigo-500" />
          </Flex>
          <div className="mt-4 space-y-2">
            <Flex justifyContent="between">
              <Text>Customers</Text>
              <Text>{formatNumber(metrics.total_customers)}</Text>
            </Flex>
            <Flex justifyContent="between">
              <Text>Vendors</Text>
              <Text>{formatNumber(metrics.total_vendors)}</Text>
            </Flex>
            <Flex justifyContent="between">
              <Text>Products</Text>
              <Text>{formatNumber(metrics.total_products)}</Text>
            </Flex>
          </div>
        </Card>

        {/* Inventory Section */}
        <Card decoration="top" decorationColor="green">
          <Flex justifyContent="between" alignItems="center">
            <Text>Inventory</Text>
            <ShoppingBag className="h-5 w-5 text-green-500" />
          </Flex>
          <div className="mt-4 space-y-2">
            <Flex justifyContent="between">
              <Text>Total Products</Text>
              <Text>{formatNumber(metrics.total_products)}</Text>
            </Flex>
            <Flex justifyContent="between">
              <Text>Purchase Value</Text>
              <Text>{formatCurrency(metrics.total_purchase_amount)}</Text>
            </Flex>
          </div>
        </Card>
      </Grid>

      <Grid numItemsLg={2} className="mt-6 gap-6">
        {/* Sales Performance */}
        <Card>
          <Flex alignItems="start">
            <div>
              <Text>Sales Performance</Text>
              <Metric>{formatCurrency(metrics.total_invoice_amount)}</Metric>
            </div>
            <BadgeDelta deltaType={determineDeltaType(metrics.total_payments_received - metrics.total_outstanding_balance)}>
              {invoiceCollectionRate.toFixed(1)}% collected
            </BadgeDelta>
          </Flex>
          <Flex className="mt-4">
            <Text className="truncate">
              {formatCurrency(metrics.total_payments_received)} received of {formatCurrency(metrics.total_invoice_amount)}
            </Text>
            <Text>{invoiceCollectionRate.toFixed(1)}%</Text>
          </Flex>
          <ProgressBar value={invoiceCollectionRate} color="blue" className="mt-2" />
          <Flex className="mt-4">
            <div>
              <Text>Outstanding</Text>
              <Text className="font-medium">{formatCurrency(metrics.total_outstanding_balance)}</Text>
            </div>
            <div>
              <Text>Received</Text>
              <Text className="font-medium">{formatCurrency(metrics.total_payments_received)}</Text>
            </div>
          </Flex>
        </Card>

        {/* Purchase Performance */}
        <Card>
          <Flex alignItems="start">
            <div>
              <Text>Purchase Performance</Text>
              <Metric>{formatCurrency(metrics.total_purchase_amount)}</Metric>
            </div>
            <BadgeDelta deltaType={determineDeltaType(metrics.total_payments_made - metrics.total_purchase_balance)}>
              {purchasePaymentRate.toFixed(1)}% paid
            </BadgeDelta>
          </Flex>
          <Flex className="mt-4">
            <Text className="truncate">
              {formatCurrency(metrics.total_payments_made)} paid of {formatCurrency(metrics.total_purchase_amount)}
            </Text>
            <Text>{purchasePaymentRate.toFixed(1)}%</Text>
          </Flex>
          <ProgressBar value={purchasePaymentRate} color="indigo" className="mt-2" />
          <Flex className="mt-4">
            <div>
              <Text>Outstanding</Text>
              <Text className="font-medium">{formatCurrency(metrics.total_purchase_balance)}</Text>
            </div>
            <div>
              <Text>Paid</Text>
              <Text className="font-medium">{formatCurrency(metrics.total_payments_made)}</Text>
            </div>
          </Flex>
        </Card>
      </Grid>
    </Card>
  );
};

export default BusinessMetricsCard;
