/**
 * Main barrel file for pages
 * Re-exports all pages for easy importing
 */

// Auth & core pages
export { default as Auth } from './Auth';
export { default as Index } from './Index';
export { default as NotFound } from './NotFound';

// Dashboard pages
export { default as ModernDashboard } from './ModernDashboard';
export { default as DataManagement } from './DataManagement';
export { default as Sync } from './Sync';

// Demo pages
export { default as ResponsiveExamples } from './ResponsiveExamples';
export { default as TableDemo } from './TableDemo';
export { default as SidebarDemo } from './SidebarDemo';

// Account pages
export { default as Accounts } from './Accounts';
export { default as AccountDetail } from './AccountDetail';
export { default as AccountOverview } from './AccountOverview';

// Re-export all expense pages
export * from './expenses';

// Re-export other page modules as they're migrated to proper folders
// TODO: Migrate other pages to dedicated folders with barrel files 