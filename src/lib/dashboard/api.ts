import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches business statistics for dashboard metrics
 */
export async function fetchBusinessStats() {
  const { data, error } = await supabase
    .rpc('gl_get_business_stats');

  if (error) {
    console.error('Error fetching business stats:', error);
    throw error;
  }

  return data?.[0] || null;
}

/**
 * Fetches recent transactions (customer payments and vendor payments)
 * Uses gl_get_recent_transactions RPC function for better performance
 */
export async function fetchRecentTransactions(limit = 10, days = 30) {
  try {
    // Use the RPC function to get consolidated transactions
    const { data, error } = await supabase
      .rpc('gl_get_recent_transactions', {
        days_back: days,
        limit_count: limit
      });

    if (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }

    // The data is already formatted correctly by the SQL function
    return data || [];
  } catch (err) {
    console.error('Error in fetchRecentTransactions:', err);
    return [];
  }
}

/**
 * Fetches financial metrics data (revenue, expenses, profit)
 * Uses SQL functions to get accurate metrics
 */
export async function fetchFinancialMetrics() {
  try {
    // Fetch invoice metrics (revenue)
    const { data: invoiceMetrics, error: invoiceError } = await supabase
      .rpc('gl_get_invoice_metrics');

    if (invoiceError) {
      console.error('Error fetching invoice metrics:', invoiceError);
      throw invoiceError;
    }

    // Fetch purchase order metrics (expenses)
    const { data: purchaseMetrics, error: purchaseError } = await supabase
      .rpc('gl_get_purchase_order_metrics');

    if (purchaseError) {
      console.error('Error fetching purchase metrics:', purchaseError);
      throw purchaseError;
    }

    // Extract metrics from the returned data
    const revenue = invoiceMetrics?.[0]?.total_invoice_amount || 0;
    const expenses = purchaseMetrics?.[0]?.total_purchase_amount || 0;
    const profit = revenue - expenses;
    
    // Also get paid/unpaid details which can be shown in the UI
    const paidInvoices = invoiceMetrics?.[0]?.paid_invoice_amount || 0;
    const unpaidInvoices = invoiceMetrics?.[0]?.unpaid_invoice_amount || 0;
    const pendingExpenses = purchaseMetrics?.[0]?.pending_purchase_amount || 0;

    return [
      {
        label: 'Revenue',
        value: revenue,
        secondaryValue: paidInvoices, // Paid amount
        secondaryLabel: 'Collected',
        tertiaryValue: unpaidInvoices, // Unpaid amount
        tertiaryLabel: 'Outstanding',
        color: 'bg-blue-600',
        textColor: 'text-blue-700 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950/50'
      },
      {
        label: 'Profit',
        value: profit,
        color: 'bg-emerald-600',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/50'
      },
      {
        label: 'Expenses',
        value: expenses,
        secondaryValue: pendingExpenses,
        secondaryLabel: 'Pending',
        color: 'bg-rose-600',
        textColor: 'text-rose-700 dark:text-rose-400',
        bgColor: 'bg-rose-50 dark:bg-rose-950/50'
      }
    ];
  } catch (err) {
    console.error('Error in fetchFinancialMetrics:', err);
    return [];
  }
}

/**
 * Fetches data for transaction chart (monthly income vs expenses)
 * Uses gl_get_monthly_revenue SQL function for better performance
 */
export async function fetchChartData(months = 8) {
  try {
    // Use our RPC function to get the monthly revenue data
    const { data, error } = await supabase
      .rpc('gl_get_monthly_revenue', {
        months_back: months
      });

    if (error) {
      console.error('Error fetching monthly revenue data:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform the data to match the expected format for the chart
    return data.map(item => ({
      date: item.month_year,
      Income: item.revenue,
      Expense: item.expenses
    }));
  } catch (err) {
    console.error('Error in fetchChartData:', err);
    return [];
  }
}

/**
 * Fetches contact data for quick transfer functionality
 */
export async function fetchContacts(limit = 5) {
  const { data, error } = await supabase
    .from('gl_accounts')
    .select('id, account_name, photo')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }

  return data.map(contact => ({
    id: contact.id,
    name: contact.account_name || 'Unnamed Contact',
    avatar: contact.photo || `https://i.pravatar.cc/150?u=${contact.id}`
  }));
}

/**
 * Fetches business metrics for the dashboard cards
 * Uses SQL functions to retrieve accurate metrics
 */
export async function fetchBusinessMetrics() {
  try {
    // Fetch overall business stats
    const { data: businessStats, error: statsError } = await supabase
      .rpc('gl_get_business_stats');

    if (statsError) {
      console.error('Error fetching business stats:', statsError);
      throw statsError;
    }

    const stats = businessStats?.[0] || {};
    
    // Calculate month-to-date and previous month revenue
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    // Get current month revenue
    const { data: currentMonthData, error: currentMonthError } = await supabase
      .from('gl_invoices')
      .select('total_amount')
      .gte('invoice_order_date', firstDayOfMonth.toISOString())
      .lte('invoice_order_date', today.toISOString());

    if (currentMonthError) {
      console.error('Error fetching current month invoices:', currentMonthError);
    }

    // Get last month revenue
    const { data: lastMonthData, error: lastMonthError } = await supabase
      .from('gl_invoices')
      .select('total_amount')
      .gte('invoice_order_date', firstDayOfLastMonth.toISOString())
      .lte('invoice_order_date', lastDayOfLastMonth.toISOString());

    if (lastMonthError) {
      console.error('Error fetching last month invoices:', lastMonthError);
    }

    // Calculate totals
    const currentMonthRevenue = currentMonthData?.reduce(
      (sum, invoice) => sum + (invoice.total_amount || 0), 0
    ) || 0;
    
    const lastMonthRevenue = lastMonthData?.reduce(
      (sum, invoice) => sum + (invoice.total_amount || 0), 0
    ) || 0;
    
    // Calculate growth rate
    const growthRate = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : currentMonthRevenue > 0 ? 100 : 0;

    return {
      totalBalance: stats.total_payments_received - stats.total_payments_made || 0,
      activeCustomers: stats.total_customers || 0,
      monthlyRevenue: currentMonthRevenue,
      growthRate: growthRate,
      totalProducts: stats.total_products || 0,
      totalVendors: stats.total_vendors || 0
    };
  } catch (err) {
    console.error('Error in fetchBusinessMetrics:', err);
    return {
      totalBalance: 0,
      activeCustomers: 0,
      monthlyRevenue: 0,
      growthRate: 0,
      totalProducts: 0,
      totalVendors: 0
    };
  }
} 