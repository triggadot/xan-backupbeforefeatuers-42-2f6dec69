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

  const currentRevenueResult = await runSQL(currentRevenueQuery);
  const previousRevenueResult = await runSQL(previousRevenueQuery);

  const currentRevenue = parseFloat(currentRevenueResult[0]?.revenue || 0);
  const previousRevenue = parseFloat(previousRevenueResult[0]?.revenue || 0);
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

  const currentInvoiceCountResult = await runSQL(currentInvoiceCountQuery);
  const previousInvoiceCountResult = await runSQL(previousInvoiceCountQuery);

  const currentInvoiceCount = parseInt(currentInvoiceCountResult[0]?.count || 0);
  const previousInvoiceCount = parseInt(previousInvoiceCountResult[0]?.count || 0);
  const invoiceCountChange = previousInvoiceCount === 0 ? 0 : ((currentInvoiceCount - previousInvoiceCount) / previousInvoiceCount) * 100;

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

  const currentClientCountResult = await runSQL(currentClientCountQuery);
  const previousClientCountResult = await runSQL(previousClientCountQuery);

  const currentClientCount = parseInt(currentClientCountResult[0]?.count || 0);
  const previousClientCount = parseInt(previousClientCountResult[0]?.count || 0);
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

  const currentExpensesResult = await runSQL(currentExpensesQuery);
  const previousExpensesResult = await runSQL(previousExpensesQuery);

  const currentExpenses = parseFloat(currentExpensesResult[0]?.expenses || 0);
  const previousExpenses = parseFloat(previousExpensesResult[0]?.expenses || 0);
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
  const currentPaymentRateQuery = `
    SELECT
      COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as payment_rate
    FROM gl_invoices
    WHERE date_of_invoice >= '${currentStartFormatted}'
    AND date_of_invoice <= '${currentEndFormatted}'
  `;

  const previousPaymentRateQuery = `
    SELECT
      COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as payment_rate
    FROM gl_invoices
    WHERE date_of_invoice >= '${previousStartFormatted}'
    AND date_of_invoice <= '${previousEndFormatted}'
  `;

  const currentPaymentRateResult = await runSQL(currentPaymentRateQuery);
  const previousPaymentRateResult = await runSQL(previousPaymentRateQuery);

  const currentPaymentRate = parseFloat(currentPaymentRateResult[0]?.payment_rate || 0);
  const previousPaymentRate = parseFloat(previousPaymentRateResult[0]?.payment_rate || 0);
  const paymentRateChange = previousPaymentRate === 0 ? 0 : (currentPaymentRate - previousPaymentRate);

  // Generate revenue chart data
  const revenueChartQuery = `
    SELECT
      DATE_TRUNC('${selectedPeriod === 'week' ? 'day' :
                 selectedPeriod === 'month' ? 'day' :
                 selectedPeriod === 'quarter' ? 'week' : 'month'}', date_of_invoice) as time_period,
      SUM(total_amount) as revenue
    FROM gl_invoices
    WHERE date_of_invoice >= '${currentStartFormatted}'
    AND date_of_invoice <= '${currentEndFormatted}'
    GROUP BY time_period
    ORDER BY time_period
  `;

  const revenueChartData = await runSQL(revenueChartQuery);

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
    labels: revenueChartData.map(item => formatChartDate(item.time_period)),
    data: revenueChartData.map(item => parseFloat(item.revenue || 0))
  };

  // Get revenue by client type
  const revenueByClientTypeQuery = `
    SELECT
      a.client_type,
      COALESCE(SUM(i.total_amount), 0) as revenue
    FROM gl_invoices i
    JOIN gl_accounts a ON i.rowid_accounts = a.glide_row_id
    WHERE i.date_of_invoice >= '${currentStartFormatted}'
    AND i.date_of_invoice <= '${currentEndFormatted}'
    GROUP BY a.client_type
    ORDER BY revenue DESC
  `;

  const revenueByClientTypeData = await runSQL(revenueByClientTypeQuery);

  const revenueByClientType = {
    labels: revenueByClientTypeData.map(item => item.client_type || 'Unknown'),
    data: revenueByClientTypeData.map(item => parseFloat(item.revenue || 0))
  };

  return {
    revenue: {
      value: currentRevenue,
      change: revenueChange
    },
    invoiceCount: {
      value: currentInvoiceCount,
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
