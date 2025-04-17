/**
 * Main barrel file for pages
 * Re-exports all pages for easy importing
 */

// Auth & core pages
export { default as Index } from "./Index";
export { default as Auth } from "./utils/Auth";
export { default as NotFound } from "./utils/NotFound";

// Dashboard pages
export { default as ModernDashboard } from "./dashboard/ModernDashboard";
export { default as DataManagement } from "./data-tables/DataManagement";
export { default as Sync } from "./sync-glide/Sync";

// Demo pages
export { default as ResponsiveExamples } from "./TEMPLATE/ResponsiveExamples";
export { default as SidebarDemo } from "./TEMPLATE/SidebarDemo";
export { default as TableDemo } from "./TEMPLATE/TableDemo";

// Account pages
export { default as AccountDetail } from "./accounts/AccountDetail";
export { default as AccountOverview } from "./accounts/AccountOverview";
export { default as Accounts } from "./accounts/Accounts";

// Re-export all expense pages
// export * from './expenses'; // Directory doesn't exist yet - commented until implementation

// Re-export other page modules as they're migrated to proper folders
// TODO: Migrate other pages to dedicated folders with barrel files
