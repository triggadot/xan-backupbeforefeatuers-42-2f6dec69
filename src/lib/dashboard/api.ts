
import { supabase } from '@/lib/supabaseClient';
import { formatISO } from 'date-fns';

/**
 * Dashboard API functions for retrieving dashboard data
 */

export async function getSalesOverview(timeframe = '30d') {
  try {
    // Determine date range based on timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    // Format dates for Postgres
    const startDateStr = formatISO(startDate).split('T')[0];
    const endDateStr = formatISO(now).split('T')[0];
    
    // Query for total sales, invoices, and paid amounts
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('gl_invoices')
      .select('total_amount, total_paid, payment_status, created_at, date_of_invoice')
      .gte('date_of_invoice', startDateStr)
      .lte('date_of_invoice', endDateStr);
    
    if (invoiceError) throw invoiceError;
    
    // Calculate metrics
    const totalSales = invoiceData.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
    const paidAmount = invoiceData.reduce((sum, invoice) => sum + (invoice.total_paid || 0), 0);
    const unpaidAmount = totalSales - paidAmount;
    const invoiceCount = invoiceData.length;
    const paidInvoiceCount = invoiceData.filter(invoice => invoice.payment_status === 'paid').length;
    const partiallyPaidCount = invoiceData.filter(invoice => invoice.payment_status === 'partial').length;
    const unpaidInvoiceCount = invoiceData.filter(invoice => invoice.payment_status === 'unpaid').length;
    
    // Daily sales data for chart
    const dailySales = {};
    invoiceData.forEach(invoice => {
      const date = invoice.date_of_invoice ? new Date(invoice.date_of_invoice).toISOString().split('T')[0] : null;
      if (!date) return;
      
      if (!dailySales[date]) {
        dailySales[date] = {
          date,
          sales: 0,
          payments: 0,
        };
      }
      
      dailySales[date].sales += invoice.total_amount || 0;
      dailySales[date].payments += invoice.total_paid || 0;
    });
    
    // Convert to array and sort by date
    const salesChartData = Object.values(dailySales).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return {
      overview: {
        totalSales,
        paidAmount,
        unpaidAmount,
        invoiceCount,
        paidInvoiceCount,
        partiallyPaidCount,
        unpaidInvoiceCount
      },
      salesChartData
    };
  } catch (error) {
    console.error("Error fetching sales overview:", error);
    throw error;
  }
}

export async function getCustomerOverview() {
  try {
    // Get all customers
    const { data: customers, error: customerError } = await supabase
      .from('gl_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (customerError) throw customerError;
    
    // Count invoices per customer
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('gl_invoices')
      .select('rowid_accounts, total_amount');
    
    if (invoiceError) throw invoiceError;
    
    // Calculate customer metrics
    const customerMetrics = customers.map(customer => {
      const customerInvoices = invoiceData.filter(invoice => invoice.rowid_accounts === customer.glide_row_id);
      const totalSpent = customerInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0);
      
      return {
        id: customer.id,
        name: customer.account_name,
        invoiceCount: customerInvoices.length,
        totalSpent,
        createdAt: customer.created_at
      };
    });
    
    // Sort by total spent
    const topCustomers = [...customerMetrics]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
    
    // New vs returning calculation (simplified)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
    
    const newCustomers = customers.filter(c => c.created_at >= thirtyDaysAgoStr).length;
    const returningCustomers = customers.length - newCustomers;
    
    return {
      overview: {
        totalCustomers: customers.length,
        newCustomers,
        returningCustomers,
        averageSpend: customerMetrics.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length
      },
      topCustomers
    };
  } catch (error) {
    console.error("Error fetching customer overview:", error);
    throw error;
  }
}

export async function getRecentTransactions(limit = 5) {
  try {
    // Get recent invoices
    const { data: invoices, error: invoiceError } = await supabase
      .from('gl_invoices')
      .select(`
        *,
        account:rowid_accounts(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (invoiceError) throw invoiceError;
    
    // Get recent payments
    const { data: payments, error: paymentError } = await supabase
      .from('gl_customer_payments')
      .select(`
        *,
        account:rowid_accounts(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (paymentError) throw paymentError;
    
    // Combine and sort
    const transactions = [
      ...invoices.map(invoice => ({
        id: invoice.id,
        type: 'invoice',
        amount: invoice.total_amount,
        date: invoice.date_of_invoice || invoice.created_at,
        customer: invoice.account?.account_name || 'Unknown',
        customerId: invoice.rowid_accounts,
        status: invoice.payment_status,
        reference: invoice.invoice_uid
      })),
      ...payments.map(payment => ({
        id: payment.id,
        type: 'payment',
        amount: payment.payment_amount,
        date: payment.date_of_payment || payment.created_at,
        customer: payment.account?.account_name || 'Unknown',
        customerId: payment.rowid_accounts,
        status: 'completed',
        reference: `Payment for ${payment.rowid_invoices || 'invoice'}`
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
    
    return transactions;
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    throw error;
  }
}

export async function getInventorySummary() {
  try {
    // Get inventory data
    const { data: products, error: productError } = await supabase
      .from('gl_products')
      .select('*');
    
    if (productError) throw productError;
    
    // Calculate inventory metrics
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => {
      const cost = product.cost || 0;
      const qty = product.total_qty_purchased || 0;
      return sum + (cost * qty);
    }, 0);
    
    // Group by category
    const categoryCounts = {};
    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (!categoryCounts[category]) {
        categoryCounts[category] = 0;
      }
      categoryCounts[category]++;
    });
    
    const categoryData = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count
    }));
    
    return {
      overview: {
        totalProducts,
        totalValue,
        categoryCount: Object.keys(categoryCounts).length,
        lowStockCount: products.filter(p => (p.total_qty_purchased || 0) <= 3).length
      },
      categoryData
    };
  } catch (error) {
    console.error("Error fetching inventory summary:", error);
    throw error;
  }
}

// Add more dashboard API functions as needed
