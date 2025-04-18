# Financial Analysis SQL Queries: Quick Start Guide

This guide provides step-by-step instructions for getting started with the financial analysis SQL queries. Follow these steps to begin analyzing your financial data with Supabase.

## Prerequisites

Before you begin, ensure you have:

- A Supabase project set up
- Access to the SQL Editor in your Supabase dashboard
- Database tables created according to the schema outlined in `DATABASE_SCHEMA.md`
- Financial data loaded into your database

## 5-Minute Quick Start

### Step 1: Choose a Query to Run

Browse the available queries in the `docs/database/queries` directory:

- `balance_sheet.sql` - Financial position at a specific date
- `cash_flow_statement.sql` - Cash movements during a period
- `financial_ratios_analysis.sql` - Key financial indicators
- `budget_variance_analysis.sql` - Compare actual vs budgeted figures
- `tax_liability_analysis.sql` - Tax obligations and payments
- And more...

### Step 2: Copy and Customize the Query

1. Open the chosen SQL file
2. Copy the entire SQL query
3. Replace date parameters with your reporting period:
   - Find: `'2023-01-01'` and `'2023-12-31'`
   - Replace with your desired date range

### Step 3: Run the Query in Supabase

1. Open your [Supabase Dashboard](https://app.supabase.io)
2. Navigate to the SQL Editor
3. Paste your modified query
4. Click "Run" to execute

### Step 4: Analyze Your Results

The query will return a formatted dataset with calculated metrics relevant to the chosen analysis. Use these results to:

- Assess financial health
- Identify trends
- Make data-driven decisions
- Prepare financial reports

## Common Customizations

### Change Reporting Period

Replace date values in the query:

```sql
-- Find this:
WHERE
  transaction_date BETWEEN '2023-01-01' AND '2023-12-31'

-- Replace with your date range:
WHERE
  transaction_date BETWEEN '2022-07-01' AND '2022-12-31'
```

### Filter by Category or Department

Add additional WHERE clauses:

```sql
-- Add category filter:
AND category = 'marketing'

-- Filter by department:
AND department_id = 3
```

### Change Grouping Level

Modify the GROUP BY clause:

```sql
-- Change from monthly to quarterly grouping:
GROUP BY
  DATE_TRUNC('quarter', transaction_date)

-- Change from quarterly to yearly:
GROUP BY
  DATE_TRUNC('year', transaction_date)
```

## Creating Database Functions

For repeated use, convert queries into database functions:

1. Create a new function in Supabase SQL Editor:

```sql
CREATE OR REPLACE FUNCTION get_balance_sheet(as_of_date DATE)
RETURNS TABLE (
  category TEXT,
  subcategory TEXT,
  amount NUMERIC,
  percentage NUMERIC
) AS $$
  -- Insert the balance sheet query here, replacing hardcoded dates with as_of_date
$$ LANGUAGE SQL;
```

2. Call the function:

```sql
SELECT * FROM get_balance_sheet('2023-03-31');
```

## Integrating with Your Application

### Using the Supabase JavaScript Client

```javascript
// In your React component or JavaScript application:
import { supabase } from './supabaseClient';

async function getFinancialRatios(startDate, endDate) {
  const { data, error } = await supabase
    .rpc('get_financial_ratios', { 
      start_date: startDate, 
      end_date: endDate 
    });
  
  if (error) console.error('Error fetching financial ratios:', error);
  return data;
}

// Call the function:
const ratios = await getFinancialRatios('2023-01-01', '2023-03-31');
```

### Using Supabase Edge Functions

1. Create an edge function in `supabase/functions/financial-analysis/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'

serve(async (req) => {
  const { start_date, end_date, analysis_type } = await req.json()
  
  // Create a Supabase client
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )
  
  let data, error
  
  switch (analysis_type) {
    case 'balance_sheet':
      ({ data, error } = await supabaseClient.rpc('get_balance_sheet', { as_of_date: end_date }))
      break
    case 'financial_ratios':
      ({ data, error } = await supabaseClient.rpc('get_financial_ratios', { start_date, end_date }))
      break
    // Add other analysis types as needed
  }
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
  
  return new Response(JSON.stringify({ data }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})
```

2. Call the edge function from your frontend:

```javascript
async function getFinancialAnalysis(type, startDate, endDate) {
  const { data, error } = await supabase.functions.invoke('financial-analysis', {
    body: {
      analysis_type: type,
      start_date: startDate,
      end_date: endDate
    }
  })
  
  if (error) console.error('Error:', error)
  return data
}
```

## Troubleshooting

### Query Returns No Results

- Check date ranges - ensure transactions exist in the specified period
- Verify table names match your schema
- Check JOIN conditions are correct for your data model
- Ensure data exists in all required tables

### Incorrect Calculations

- Verify account types are correctly assigned in your data
- Check current/non-current designations for assets and liabilities
- Ensure correct transaction_type values ('debit'/'credit')
- Validate calculation formulas match your accounting practices

### Performance Issues

- Add appropriate indexes to frequently queried columns
- Limit date ranges to necessary periods
- For large datasets, consider materializing intermediate results
- Use EXPLAIN ANALYZE to identify bottlenecks

## Next Steps

- Explore the detailed documentation in `DOCUMENTATION.md`
- Review the database schema in `DATABASE_SCHEMA.md`
- Check out the README for descriptions of all available queries
- Create stored procedures for frequently used analyses
- Set up automated reporting with scheduled functions

## Need Help?

If you encounter issues or need assistance customizing these queries for your specific needs:

- Consult the Supabase documentation: [https://supabase.com/docs](https://supabase.com/docs)
- Ask questions in the Supabase community: [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
- Refer to PostgreSQL documentation: [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/) 