# SQL Queries for Financial Analysis

This directory contains SQL queries for analyzing financial data in our database. These queries are designed to work with our Supabase PostgreSQL database and provide insights into various aspects of our financial operations.

## Available Queries

### [Monthly Revenue Analysis](./monthly_revenue_analysis.sql)
- **Purpose**: Track revenue generation on a monthly basis
- **Metrics**: Invoice count, total revenue, payments received, outstanding balance
- **Use Case**: Monitor monthly performance and identify trends in revenue generation

### [Top Customers Analysis](./top_customers_analysis.sql)
- **Purpose**: Identify most valuable customers by revenue
- **Metrics**: Invoice count, total revenue, payments, outstanding balance per customer
- **Use Case**: Focus customer retention efforts on high-value accounts

### [Accounts Receivable Aging](./accounts_receivable_aging.sql)
- **Purpose**: Monitor outstanding payments by age
- **Metrics**: Outstanding balances in different time buckets (0-30, 31-60, 61-90, 90+ days)
- **Use Case**: Prioritize collection efforts and improve cash flow management

### [Cash Flow Analysis](./cash_flow_analysis.sql)
- **Purpose**: Track cash inflows and outflows over time
- **Metrics**: Cash inflow from customers, outflow to expenses and vendors, net cash flow
- **Use Case**: Monitor liquidity and forecast future cash positions

### [Product Profitability Analysis](./product_profitability.sql)
- **Purpose**: Analyze profitability of individual products
- **Metrics**: Sales count, quantity sold, revenue, cost, gross profit, profit margin
- **Use Case**: Optimize product mix and pricing strategies

### [Customer Payment Trends](./customer_payment_trends.sql)
- **Purpose**: Analyze customer payment behaviors
- **Metrics**: Payment count, total payments, payment methods by customer
- **Use Case**: Understand customer payment preferences and improve collection strategies

### [Expense Analysis by Category](./expense_category_analysis.sql)
- **Purpose**: Analyze expenses by category
- **Metrics**: Expense count, total amount, average expense per category
- **Use Case**: Control costs and identify areas for potential savings

### [Monthly Expense Trends](./monthly_expense_trends.sql)
- **Purpose**: Track expenses over time by category
- **Metrics**: Monthly expense totals by category
- **Use Case**: Monitor spending patterns and budget adherence

### [Vendor Spending Analysis](./vendor_spending_analysis.sql)
- **Purpose**: Analyze spending with vendors
- **Metrics**: Payment count, total spent, payment history by vendor
- **Use Case**: Optimize vendor relationships and negotiate better terms

### [Purchase Order Analysis](./purchase_order_analysis.sql)
- **Purpose**: Analyze purchase order trends
- **Metrics**: PO count, total amount, paid amount, outstanding balance
- **Use Case**: Monitor purchasing activity and manage vendor commitments

### [Balance Sheet](./balance_sheet.sql)
- **Purpose**: Generate a balance sheet for a specific point in time
- **Metrics**: Assets, liabilities, equity, key financial ratios
- **Use Case**: Assess financial position and solvency at a specific date

### [Profit and Loss Statement](./profit_loss_statement.sql)
- **Purpose**: Generate a profit and loss statement for any date range
- **Metrics**: Revenue by category, expenses by category, gross profit, net profit
- **Use Case**: Evaluate profitability and operating performance over time

### [Cash Flow Statement](./cash_flow_statement.sql)
- **Purpose**: Generate a cash flow statement for a specific period
- **Metrics**: Operating activities, investing activities, financing activities, net change in cash
- **Use Case**: Analyze cash generation and usage across different business activities

### [Financial Ratios Analysis](./financial_ratios_analysis.sql)
- **Purpose**: Calculate key financial ratios to evaluate business performance
- **Metrics**: Liquidity, profitability, efficiency, solvency, and valuation ratios
- **Use Case**: Assess financial health, benchmark performance, and identify improvement areas

### [Budget Variance Analysis](./budget_variance_analysis.sql)
- **Purpose**: Compare actual financial results to budgeted figures
- **Metrics**: Revenue/expense variances, net income variance, variance percentages
- **Use Case**: Track performance against budgets and identify areas requiring attention

### [Tax Liability Analysis](./tax_liability_analysis.sql)
- **Purpose**: Track tax accruals, payments, and outstanding liabilities
- **Metrics**: Tax accruals by type, payments, outstanding liabilities, tax as percentage of revenue
- **Use Case**: Monitor tax obligations and optimize tax planning

## Usage Guidelines

1. These queries are designed to work with our specific database schema
2. Always test queries in a non-production environment first
3. For large datasets, consider adding appropriate WHERE clauses to limit results
4. Some queries may need modification based on your specific analysis needs

## Contributing

To add new queries to this documentation:

1. Create a new .sql file with a descriptive name
2. Include comments in the SQL file explaining the query's purpose and any parameters
3. Update this README to include information about your new query
4. Consider adding example results to the examples directory 