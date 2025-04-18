import { supabase } from '../src/lib/pdf/supabase';

async function getDashboardKPIs({ selectedPeriod, dateFrom, dateTo, useCustomDates }) {
  // Define date ranges based on period or custom dates
  let currentPeriodStart, currentPeriodEnd, previousPeriodStart, previousPeriodEnd;

  if (useCustomDates) {
    // Use custom date range
    currentPeriodEnd = new Date(dateTo);
    currentPeriodStart = new Date(dateFrom);

    // Calculate previous period of the same duration
    const durationMs = currentPeriodEnd - currentPeriodStart;
    previousPeriodEnd = new Date(currentPeriodStart);
    previousPeriodStart = new Date(currentPeriodStart.getTime() - durationMs);
  } else {
    // Calculate date ranges based on selected period
    const today = new Date();

    switch (selectedPeriod) {
      case 'week':
        currentPeriodEnd = new Date();
        currentPeriodStart = new Date();
        currentPeriodStart.setDate(today.getDate() - 7);

        previousPeriodEnd = new Date(currentPeriodStart);
        previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
        break;

      case 'month':
        currentPeriodEnd = new Date();
        currentPeriodStart = new Date(today.getFullYear(), today.getMonth(), 1);

        previousPeriodEnd = new Date(currentPeriodStart);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
        previousPeriodStart = new Date(previousPeriodEnd.getFullYear(), previousPeriodEnd.getMonth(), 1);
        break;

      case 'quarter':
        currentPeriodEnd = new Date();
        const currentQuarterMonth = Math.floor(today.getMonth() / 3) * 3;
        currentPeriodStart = new Date(today.getFullYear(), currentQuarterMonth, 1);

        previousPeriodEnd = new Date(currentPeriodStart);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
        const previousQuarterMonth = Math.floor(previousPeriodEnd.getMonth() / 3) * 3;
        previousPeriodStart = new Date(previousPeriodEnd.getFullYear(), previousQuarterMonth, 1);
        break;

      case 'year':
        currentPeriodEnd = new Date();
        currentPeriodStart = new Date(today.getFullYear(), 0, 1);

        previousPeriodEnd = new Date(today.getFullYear() - 1, 11, 31);
        previousPeriodStart = new Date(today.getFullYear() - 1, 0, 1);
        break;
    }
  }

  // Format dates for SQL queries
  const formatDate = (date) => date.toISOString().split('T')[0];
  const currentStartFormatted = formatDate(currentPeriodStart);
  const currentEndFormatted = formatDate(currentPeriodEnd);
  const previousStartFormatted = formatDate(previousPeriodStart);
  const previousEndFormatted = formatDate(previousPeriodEnd);

  // Get revenue data
  const currentRevenueQuery = `
    SELECT COALESCE(SUM(total_amount), 0) as revenue
    FROM gl_invoices
    WHERE date_of_invoice >= '${currentStartFormatted}'
    AND date_of_invoice <= '${currentEndFormatted}'
  `;

  const previousRevenueQuery = `
    SELECT COALESCE(SUM(total_amount), 0) as revenue
    FROM gl_invoices
    WHERE date_of_invoice >= '${previousStartFormatted}'
    AND date_of_invoice <= '${previousEndFormatted}'
  `;

  // Get revenue data using Supabase JS
  const { data: currentRevenueData, error: currentRevenueError } = await supabase
    .from('gl_invoices')
    .select('total_amount')
    .gte('date_of_invoice', currentStartFormatted)
    .lte('date_of_invoice', currentEndFormatted);
  const { data: previousRevenueData, error: previousRevenueError } = await supabase
    .from('gl_invoices')
    .select('total_amount')
    .gte('date_of_invoice', previousStartFormatted)
    .lte('date_of_invoice', previousEndFormatted);

  const sumAmounts = arr => (Array.isArray(arr) ? arr.reduce((sum, row) => sum + (parseFloat(row.total_amount) || 0), 0) : 0);
  const currentRevenue = sumAmounts(currentRevenueData);
  const previousRevenue = sumAmounts(previousRevenueData);
  const revenueChange = previousRevenue === 0 ? 0 : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

  // Get invoice count
  const currentInvoiceCountQuery = `
    SELECT COUNT(*) as count
    FROM gl_invoices
    WHERE date_of_invoice >= '${currentStartFormatted}'
    AND date_of_invoice <= '${currentEndFormatted}'
  `;

  const previousInvoiceCountQuery = `
    SELECT COUNT(*) as count
    FROM gl_invoices
    WHERE date_of_invoice >= '${previousStartFormatted}'
    AND date_of_invoice <= '${previousEndFormatted}'
  `;

  // Get invoice count using Supabase JS
  const { count: currentInvoiceCount, error: currentInvoiceCountError } = await supabase
    .from('gl_invoices')
    .select('*', { count: 'exact', head: true })
    .gte('date_of_invoice', currentStartFormatted)
    .lte('date_of_invoice', currentEndFormatted);
  const { count: previousInvoiceCount, error: previousInvoiceCountError } = await supabase
    .from('gl_invoices')
    .select('*', { count: 'exact', head: true })
    .gte('date_of_invoice', previousStartFormatted)
    .lte('date_of_invoice', previousEndFormatted);
  const safeCurrentInvoiceCount = currentInvoiceCount ?? 0;
  const safePreviousInvoiceCount = previousInvoiceCount ?? 0;
  const invoiceCountChange = safePreviousInvoiceCount === 0 ? 0 : ((safeCurrentInvoiceCount - safePreviousInvoiceCount) / safePreviousInvoiceCount) * 100;

  // Get active client count (clients with invoices in the period)
  const currentClientCountQuery = `
    SELECT COUNT(DISTINCT rowid_accounts) as count
    FROM gl_invoices
    WHERE date_of_invoice >= '${currentStartFormatted}'
    AND date_of_invoice <= '${currentEndFormatted}'
  `;

  const previousClientCountQuery = `
    SELECT COUNT(DISTINCT rowid_accounts) as count
    FROM gl_invoices
    WHERE date_of_invoice >= '${previousStartFormatted}'
    AND date_of_invoice <= '${previousEndFormatted}'
  `;

  // Use Supabase JS client for client count
  const { data: currentClientCountData, error: currentClientCountError } = await supabase
    .from('gl_invoices')
    .select('rowid_accounts', { count: 'exact', head: true })
    .gte('date_of_invoice', currentStartFormatted)
    .lte('date_of_invoice', currentEndFormatted);
  const { data: previousClientCountData, error: previousClientCountError } = await supabase
    .from('gl_invoices')
    .select('rowid_accounts', { count: 'exact', head: true })
    .gte('date_of_invoice', previousStartFormatted)
    .lte('date_of_invoice', previousEndFormatted);

  const currentClientCount = currentClientCountData?.count ?? 0;
  const previousClientCount = previousClientCountData?.count ?? 0;
  const clientCountChange = previousClientCount === 0 ? 0 : ((currentClientCount - previousClientCount) / previousClientCount) * 100;

  // Calculate average invoice amount
  const currentAverageInvoice = currentInvoiceCount === 0 ? 0 : currentRevenue / currentInvoiceCount;
  const previousAverageInvoice = previousInvoiceCount === 0 ? 0 : previousRevenue / previousInvoiceCount;
  const averageInvoiceChange = previousAverageInvoice === 0 ? 0 : ((currentAverageInvoice - previousAverageInvoice) / previousAverageInvoice) * 100;

  // Get expenses data
  const currentExpensesQuery = `
    SELECT COALESCE(SUM(amount), 0) as expenses
    FROM gl_expenses
    WHERE date >= '${currentStartFormatted}'
    AND date <= '${currentEndFormatted}'
  `;

  const previousExpensesQuery = `
    SELECT COALESCE(SUM(amount), 0) as expenses
    FROM gl_expenses
    WHERE date >= '${previousStartFormatted}'
    AND date <= '${previousEndFormatted}'
  `;

  // Get expenses data using Supabase JS
  const { data: currentExpensesData, error: currentExpensesError } = await supabase
    .from('gl_expenses')
    .select('amount')
    .gte('date', currentStartFormatted)
    .lte('date', currentEndFormatted);
  const { data: previousExpensesData, error: previousExpensesError } = await supabase
    .from('gl_expenses')
    .select('amount')
    .gte('date', previousStartFormatted)
    .lte('date', previousEndFormatted);
  const sumExpenseAmounts = arr => (Array.isArray(arr) ? arr.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0) : 0);
  const currentExpenses = sumExpenseAmounts(currentExpensesData);
  const previousExpenses = sumExpenseAmounts(previousExpensesData);
  const expensesChange = previousExpenses === 0 ? 0 : ((currentExpenses - previousExpenses) / previousExpenses) * 100;

  // Calculate profit
  const currentProfit = currentRevenue - currentExpenses;
  const previousProfit = previousRevenue - previousExpenses;
  const profitChange = previousProfit === 0 ? 0 : ((currentProfit - previousProfit) / previousProfit) * 100;

  // Calculate profit margin
  const currentProfitMargin = currentRevenue === 0 ? 0 : (currentProfit / currentRevenue) * 100;
  const previousProfitMargin = previousRevenue === 0 ? 0 : (previousProfit / previousRevenue) * 100;
  const profitMarginChange = previousProfitMargin === 0 ? 0 : (currentProfitMargin - previousProfitMargin);

  // Get payment rate (percentage of invoices paid)
  const { data: currentPaidInvoices, error: currentPaidError } = await supabase
    .from('gl_invoices')
    .select('payment_status')
    .eq('payment_status', 'paid')
    .gte('date_of_invoice', currentStartFormatted)
    .lte('date_of_invoice', currentEndFormatted);
  const { count: currentTotalCount, error: currentTotalError } = await supabase
    .from('gl_invoices')
    .select('*', { count: 'exact', head: true })
    .gte('date_of_invoice', currentStartFormatted)
    .lte('date_of_invoice', currentEndFormatted);
  const { data: previousPaidInvoices, error: previousPaidError } = await supabase
    .from('gl_invoices')
    .select('payment_status')
    .eq('payment_status', 'paid')
    .gte('date_of_invoice', previousStartFormatted)
    .lte('date_of_invoice', previousEndFormatted);
  const { count: previousTotalCount, error: previousTotalError } = await supabase
    .from('gl_invoices')
    .select('*', { count: 'exact', head: true })
    .gte('date_of_invoice', previousStartFormatted)
    .lte('date_of_invoice', previousEndFormatted);

  const currentPaidCount = Array.isArray(currentPaidInvoices) ? currentPaidInvoices.length : 0;
  const previousPaidCount = Array.isArray(previousPaidInvoices) ? previousPaidInvoices.length : 0;

  const safeCurrentTotalCount = currentTotalCount ?? 0;
  const safePreviousTotalCount = previousTotalCount ?? 0;

  const currentPaymentRate = safeCurrentTotalCount === 0 ? 0 : (currentPaidCount / safeCurrentTotalCount) * 100;
  const previousPaymentRate = safePreviousTotalCount === 0 ? 0 : (previousPaidCount / safePreviousTotalCount) * 100;
  const paymentRateChange = previousPaymentRate === 0 ? 0 : (currentPaymentRate - previousPaymentRate);

  // Generate revenue chart data
  const { data: revenueChartData, error: revenueChartError } = await supabase
    .from('gl_invoices')
    .select('date_of_invoice, total_amount')
    .gte('date_of_invoice', currentStartFormatted)
    .lte('date_of_invoice', currentEndFormatted);

  // Format chart data
  const formatChartDate = (dateStr) => {
    const date = new Date(dateStr);
    if (selectedPeriod === 'week' || selectedPeriod === 'month') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (selectedPeriod === 'quarter') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  };

  const revenueChart = {
    labels: revenueChartData.map(item => formatChartDate(item.date_of_invoice)),
    data: revenueChartData.map(item => parseFloat(item.total_amount || 0))
  };

  // Get revenue by client type
  const { data: revenueByClientTypeData, error: revenueByClientTypeError } = await supabase
    .from('gl_invoices')
    .select('rowid_accounts, total_amount')
    .gte('date_of_invoice', currentStartFormatted)
    .lte('date_of_invoice', currentEndFormatted);

  const revenueByClientType = {
    labels: [...new Set(revenueByClientTypeData.map(item => item.rowid_accounts))],
    data: [...new Set(revenueByClientTypeData.map(item => item.rowid_accounts))].map(client => {
      const clientData = revenueByClientTypeData.filter(item => item.rowid_accounts === client);
      return clientData.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);
    })
  };

  return {
    revenue: {
      value: currentRevenue,
      change: revenueChange
    },
    invoiceCount: {
      value: safeCurrentInvoiceCount,
      change: invoiceCountChange
    },
    activeClientCount: {
      value: currentClientCount,
      change: clientCountChange
    },
    averageInvoice: {
      value: currentAverageInvoice,
      change: averageInvoiceChange
    },
    expenses: {
      value: currentExpenses,
      change: expensesChange
    },
    profit: {
      value: currentProfit,
      change: profitChange
    },
    profitMargin: {
      value: currentProfitMargin,
      change: profitMarginChange
    },
    paymentRate: {
      value: currentPaymentRate,
      change: paymentRateChange
    },
    revenueChart,
    revenueByClientType
  };
}
