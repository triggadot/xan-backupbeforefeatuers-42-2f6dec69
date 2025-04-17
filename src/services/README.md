# Services Directory

This directory contains service modules that interface with external data sources and APIs. 

## Directory Structure

```
src/services/
├── README.md                # This file
├── index.ts                 # Barrel file for services
└── supabase/                # Supabase-specific services
    ├── index.ts             # Supabase services barrel file
    └── tables/              # Table-specific service modules
        ├── gl-expenses.service.ts   # New service for expenses
        ├── gl-expenses.ts           # Original expenses service
        ├── gl-invoices.ts           # Invoices service
        └── ...              # Other table services
```

## Usage Guidelines

### Importing Services

Always import services through the barrel files for consistency:

```typescript
// Preferred: Import through barrel files
import { glExpensesService } from '@/services';
// or
import { glExpensesService } from '@/services/supabase';

// Avoid: Direct imports from specific files
import { glExpensesService } from '@/services/supabase/tables/gl-expenses.service';
```

### Supabase Table Services

Each service module in `services/supabase/tables/` provides typed methods for interacting with specific Supabase tables:

```typescript
// Example: Using the expenses service
import { glExpensesService } from '@/services';

// Getting expenses with filters
const expenses = await glExpensesService.getExpenses({
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  limit: 10
});

// Get a single expense by ID
const expense = await glExpensesService.getExpense('expense-uuid');

// Creating a new expense
await glExpensesService.createExpense({
  glide_row_id: 'row-123',
  amount: 150.75,
  notes: 'Office supplies'
});

// Updating an expense
await glExpensesService.updateExpense('expense-uuid', {
  amount: 165.25,
  notes: 'Updated description'
});

// Deleting an expense
await glExpensesService.deleteExpense('expense-uuid');

// Real-time subscriptions
const subscription = glExpensesService.subscribeToExpensesChanges((payload) => {
  console.log('Expense changed:', payload);
});

// Clean up subscription when component unmounts
return () => subscription.unsubscribe();
```

## Service Naming Conventions

- Service modules follow kebab-case: `gl-expenses.service.ts`
- Service objects use camelCase: `glExpensesService`
- Method names follow patterns:
  - `getItems()` - Get multiple records
  - `getItem(id)` - Get a single record
  - `createItem(data)` - Create a record
  - `updateItem(id, data)` - Update a record
  - `deleteItem(id)` - Delete a record
  - `subscribeToItemChanges(callback)` - Subscribe to changes

## Creating New Services

When creating a new service for a Supabase table:

1. Create a new file in `services/supabase/tables/` named `gl-[table-name].ts`
2. Export types and the service object 
3. Add your export to the barrel file at `services/supabase/tables/index.ts`

## Migrating to New Service Pattern

We're currently migrating to a more consistent service structure. New services should:

1. Use kebab-case for file names
2. Export service objects with camelCase names 
3. Use typed parameters and return values
4. Handle errors properly
5. Format data for frontend use when appropriate 