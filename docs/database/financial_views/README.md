# Financial Analysis SQL Views

This directory contains SQL views designed for financial analysis of the database. These views can be used to generate financial reports, dashboards, and business insights.

## View Descriptions

### 1. Balance Sheet View (`01_balance_sheet_view.sql`)
A comprehensive balance sheet that shows:
- Assets (accounts receivable, inventory, etc.)
- Liabilities (accounts payable, unpaid purchase orders, etc.)
- Equity 
- Key financial ratios (current ratio, debt ratio, etc.)

### 2. Cash Flow Statement View (`02_cash_flow_statement_view.sql`)
A cash flow statement that tracks:
- Operating activities (customer payments, vendor payments, expenses)
- Changes in working capital (accounts receivable, inventory, accounts payable)
- Net cash flow over a specified time period

### 3. Financial Ratios View (`03_financial_ratios_view.sql`)
Calculates key financial ratios and metrics including:
- Profitability ratios (gross profit margin, net profit margin)
- Liquidity ratios (current ratio, quick ratio)
- Activity ratios (accounts receivable turnover, inventory turnover)
- Growth rates compared to previous periods

### 4. Profitability Analysis View (`04_profitability_analysis_view.sql`)
Provides detailed profitability analysis by:
- Product
- Customer
- Product category
- Overall business performance

### 5. Budget Variance Analysis View (`05_budget_variance_analysis_view.sql`)
Compares current performance against previous year's data (used as a budget proxy):
- Revenue variance
- Expense variance by category
- Purchase order variance
- Product sales variance by category

## Usage Examples

### Balance Sheet
```sql
SELECT * FROM balance_sheet_view;
```

### Financial Ratios
```sql
SELECT 
    gross_profit_margin_pct,
    net_profit_margin_pct,
    current_ratio,
    quick_ratio 
FROM financial_ratios_view;
```

### Profitability by Product Category
```sql
SELECT 
    entity_name AS category,
    total_revenue,
    gross_profit,
    gross_profit_margin_pct
FROM profitability_analysis_view
WHERE analysis_type = 'category'
ORDER BY total_revenue DESC;
```

### Budget Variance Analysis
```sql
SELECT 
    metric,
    current_amount,
    budget_amount,
    variance_amount,
    variance_percent,
    performance
FROM budget_variance_analysis_view
WHERE performance = 'Unfavorable';
```

## Implementation Notes

These views are designed to work with the existing database schema and tables:
- `gl_accounts`
- `gl_invoices`
- `gl_invoice_lines`
- `gl_products`
- `gl_expenses`
- `gl_purchase_orders`
- `gl_customer_payments`
- `gl_vendor_payments`

No additional tables or modifications to the database schema are required to use these views. 