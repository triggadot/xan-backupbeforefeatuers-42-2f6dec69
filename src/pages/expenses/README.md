# Expense Pages

This directory contains all expense-related pages following the kebab-case naming convention and organized hierarchically.

## Directory Structure

```
src/pages/expenses/
├── index.tsx           # Main expense list page
├── index.ts            # Barrel file exporting all expense pages
├── create.tsx          # Create new expense page
├── [id].tsx            # Expense detail page
├── [id]/               # Nested pages for specific expense ID
│   └── edit.tsx        # Edit expense page
└── README.md           # This documentation file
```

## Page Components

### ExpensesPage (`index.tsx`)
Main page that displays a list of expenses using the `ExpenseList` component.

### CreateExpensePage (`create.tsx`)
Provides a form for creating a new expense using the `ExpenseForm` component.

### ExpenseDetailPage (`[id].tsx`)
Shows detailed information about a specific expense using the `ExpenseDetail` component.

### EditExpensePage (`[id]/edit.tsx`)
Provides a form for editing an existing expense using the `ExpenseForm` component with the `isEdit` prop set to true.

## Importing

All pages are exported through the barrel file (`index.ts`), so they can be imported from other parts of the application like this:

```typescript
import { 
  ExpensesPage,
  CreateExpensePage,
  ExpenseDetailPage,
  EditExpensePage
} from '@/pages/expenses';
```

Or through the main pages barrel file:

```typescript
import { 
  ExpensesPage,
  CreateExpensePage,
  ExpenseDetailPage,
  EditExpensePage
} from '@/pages';
```

## Routing

Routes for these pages are defined in `App.tsx` as follows:

- `/expenses` → `ExpensesPage`
- `/expenses/new` → `CreateExpensePage`
- `/expenses/:id` → `ExpenseDetailPage`
- `/expenses/:id/edit` → `EditExpensePage` 