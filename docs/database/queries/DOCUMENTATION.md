# Financial Analysis SQL Queries Documentation

## Overview

This collection of SQL queries provides comprehensive financial analysis capabilities for businesses using our Supabase-powered financial management system. The queries are designed to work with PostgreSQL and leverage Common Table Expressions (CTEs) for readability and performance.

## Database Schema Requirements

These queries rely on the following tables in your Supabase database:

- `gl_accounts`: General ledger accounts
- `gl_transactions`: Individual financial transactions
- `gl_assets`: Asset accounts and their values
- `gl_liabilities`: Liability accounts and their values
- `gl_invoices`: Customer invoices
- `gl_invoice_items`: Line items in invoices
- `gl_expenses`: Business expenses
- `gl_customers`: Customer information
- `gl_products`: Product information and costs
- `gl_budget_items`: Budget data by category
- `gl_revenue_categories`: Revenue classification
- `gl_taxes`: Tax accruals
- `gl_tax_payments`: Tax payments made
- `gl_cash_flow_items`: Cash flow categorization

## Query Types and Their Purpose

### Financial Statements

1. **Balance Sheet** (`balance_sheet.sql`)
   - Creates a snapshot of financial position at a specific date
   - Shows assets, liabilities, and equity
   - Includes financial ratios like current ratio and debt-to-equity
   - **Data Needed**: Asset and liability values with dates and classifications

2. **Cash Flow Statement** (`cash_flow_statement.sql`)
   - Analyzes cash movement during a specific period
   - Categorizes cash flows into operating, investing, and financing activities
   - Calculates net change in cash and free cash flow
   - **Data Needed**: Transactions with dates, amounts, and cash flow classifications

3. **Profit and Loss Statement** (Income Statement)
   - Shows revenue, expenses, and profitability over a period
   - Breaks down revenue and expenses by category
   - Calculates gross profit, operating profit, and net profit
   - **Data Needed**: Revenue and expense data with dates and categories

### Financial Analysis

1. **Financial Ratios Analysis** (`financial_ratios_analysis.sql`)
   - Calculates key performance indicators across multiple categories
   - Includes liquidity, profitability, efficiency, and solvency ratios
   - Helps assess financial health and benchmark performance
   - **Data Needed**: Balance sheet and income statement data

2. **Profitability Analysis** (`profitability_analysis.sql`)
   - Analyzes profit margins by customer, product, or time period
   - Identifies most and least profitable segments
   - Tracks profitability trends over time
   - **Data Needed**: Sales data with costs, customer information, and dates

3. **Budget Variance Analysis** (`budget_variance_analysis.sql`)
   - Compares actual financial results to budgeted figures
   - Identifies favorable and unfavorable variances
   - Calculates variance percentages and net income variance
   - **Data Needed**: Budget data and actual financial results with categories

4. **Tax Liability Analysis** (`tax_liability_analysis.sql`)
   - Tracks tax obligations, payments, and outstanding liabilities
   - Analyzes tax expense as a percentage of revenue
   - Monitors tax efficiency across different tax types
   - **Data Needed**: Tax accruals, payments, jurisdictions, and revenue data

## Working with Dummy Data vs. Real Data

### Current Status

The queries are currently configured with example date ranges (mostly 2023) and use placeholder references to the database schema. These are **templates** that need configuration for your specific data.

### To Use with Real Data

1. **Date Ranges**: Replace the hardcoded date ranges (like `'2023-01-01'` and `'2023-12-31'`) with:
   - Parameters in your application code
   - Dynamic date calculations (e.g., `CURRENT_DATE - INTERVAL '1 year'`)
   - Specific reporting periods for your business

2. **Table Schema Verification**: Ensure your database tables match the expected schema:
   - Column names referenced in the queries exist in your tables
   - Data types are compatible (especially date fields)
   - Relationships between tables are properly established

3. **Data Quality Checks**: Add validation within queries to handle:
   - Missing data with appropriate `COALESCE` functions (already included in most queries)
   - Division by zero with `NULLIF` (already included)
   - Appropriate data filtering with `WHERE` clauses

## How to Use These Queries

### Direct Execution

1. Open your Supabase dashboard
2. Navigate to SQL Editor
3. Copy the query content
4. Modify date ranges and any specific parameters
5. Execute and view results

### Integration with Application

1. **Supabase JavaScript Client**:
   ```javascript
   const { data, error } = await supabase
     .rpc('get_financial_ratios', { start_date: '2023-01-01', end_date: '2023-12-31' })
   ```

2. **Stored Procedures**:
   - Convert these queries to PostgreSQL functions in your Supabase instance
   - Example:
     ```sql
     CREATE OR REPLACE FUNCTION get_balance_sheet(as_of_date DATE)
     RETURNS TABLE (
       category TEXT,
       subcategory TEXT,
       amount NUMERIC,
       -- other columns as needed
     ) AS $$
       -- Balance sheet query content with as_of_date parameter
     $$ LANGUAGE SQL;
     ```

3. **Edge Functions**:
   - Create Supabase Edge Functions that run these queries
   - Return formatted JSON for your frontend components

### Customization Options

1. **Filtering**:
   - Add WHERE clauses to limit data to specific departments, products, or entities
   - Example: `WHERE department_id = 5`

2. **Grouping**:
   - Modify GROUP BY clauses to change analysis granularity
   - Example: Change from monthly to quarterly analysis

3. **Extending**:
   - Add calculated columns for additional metrics
   - Join with other tables for deeper analysis

## Performance Considerations

1. **For Large Datasets**:
   - Add appropriate indexes to the tables being queried
   - Consider materializing frequently accessed data
   - Use time-based partitioning for transaction tables

2. **Query Optimization**:
   - Limit date ranges to necessary periods
   - Use EXPLAIN ANALYZE to identify bottlenecks
   - Consider creating views for common query patterns

## Examples

### Example: Quarterly Financial Ratios Analysis

```sql
-- Modify CTE date ranges for Q1 2023
WITH balance_sheet_data AS (
  -- Assets
  SELECT
    'assets' AS category,
    'current_assets' AS subcategory,
    SUM(CASE WHEN a.is_current THEN a.value ELSE 0 END) AS amount
  FROM
    gl_assets a
  WHERE
    a.as_of_date <= '2023-03-31'  -- End of Q1
    AND (a.end_date IS NULL OR a.end_date > '2023-03-31')
  
  -- ... remaining query content ...
),

income_statement_data AS (
  -- Revenue
  SELECT
    'income' AS category,
    'revenue' AS subcategory,
    SUM(i.total_amount) AS amount
  FROM
    gl_invoices i
  WHERE
    i.invoice_date BETWEEN '2023-01-01' AND '2023-03-31'  -- Q1 date range
    AND i.status = 'issued'
  
  -- ... remaining query content ...
)

-- Main ratio calculations
-- ... remaining query content ...
```

### Example: Creating a Stored Procedure

```sql
-- Create stored procedure for Balance Sheet
CREATE OR REPLACE FUNCTION get_balance_sheet(as_of_date DATE)
RETURNS TABLE (
  category TEXT,
  subcategory TEXT,
  amount NUMERIC,
  percentage NUMERIC
) AS $$
  WITH assets AS (
    -- Asset calculations with as_of_date parameter
    SELECT
      'current_assets' AS subcategory,
      SUM(CASE WHEN a.is_current THEN a.value ELSE 0 END) AS amount
    FROM
      gl_assets a
    WHERE
      a.as_of_date <= as_of_date
      AND (a.end_date IS NULL OR a.end_date > as_of_date)
    -- ... remaining assets calculation ...
  ),
  liabilities AS (
    -- Liability calculations with as_of_date parameter
    -- ... 
  )
  -- Main balance sheet query
  SELECT
    -- ... query using the CTEs
$$ LANGUAGE SQL;

-- Then call it with:
-- SELECT * FROM get_balance_sheet('2023-12-31');
```

## Conclusion

These SQL queries provide powerful financial analysis capabilities that can be customized for your specific business needs. They are designed as templates that you must adapt to your actual data and requirements.

For best results:
1. Understand your data structure
2. Adapt the date ranges to relevant periods
3. Test thoroughly with small data samples first
4. Consider converting frequently-used queries to stored procedures
5. Add appropriate indexes to optimize performance 