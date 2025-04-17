/**
 * Barrel file for expense pages
 * Export all expense-related pages for easy imports
 */

// Export the main expense pages
export { default as ExpensesPage } from './index';
export { default as CreateExpensePage } from './create';
export { default as ExpenseDetailPage } from './[id]';
export { default as EditExpensePage } from './[id]/edit'; 