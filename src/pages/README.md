# Pages Directory

This directory contains all the page components for the application. We are in the process of migrating toward a more organized structure following these principles:

## Organizational Principles

1. **Directory Structure**: Each feature gets its own directory with a consistent structure
2. **File Naming**: All files use kebab-case (e.g., `expense-list.tsx`)
3. **Barrel Files**: Each feature directory has an `index.ts` barrel file for exports
4. **Nested Routes**: Related routes are grouped together in `App.tsx`
5. **Page Naming**: Page components are named with a `Page` suffix (e.g., `ExpensesPage`)

## Current Progress

✅ **Migrated Features:**
- Expenses (`/expenses/*`)

⏳ **Features to Migrate:**
- Accounts
- Invoices
- Products
- Estimates
- Purchase Orders

## Directory Structure Template

For each feature, we follow this directory structure:

```
src/pages/[feature-name]/
├── index.tsx           # Main listing page
├── index.ts            # Barrel file for exports
├── page-exports.ts     # Direct exports to avoid circular references
├── create.tsx          # Creation page (if applicable)
├── [id].tsx            # Detail page
├── [id]/               # Nested pages for specific ID
│   └── edit.tsx        # Edit page
└── README.md           # Documentation
```

See the `TEMPLATE` directory for a ready-to-use template for future migrations.

## Importing Pages

You can import pages from the main barrel file:

```typescript
import { 
  ExpensesPage,
  CreateExpensePage,
  // etc.
} from '@/pages';
```

Or directly from a feature's barrel file:

```typescript
import { 
  ExpensesPage,
  CreateExpensePage,
  // etc.
} from '@/pages/expenses';
``` 