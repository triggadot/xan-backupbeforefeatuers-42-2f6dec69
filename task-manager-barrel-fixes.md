# Barrel Files and Routing Consistency Task List

## Main Pages Barrel File

### Task 1: Update Main Barrel File (`/src/pages/index.ts`)

- [ ] Add missing exports for Gallery pages:
  ```typescript
  // Gallery pages
  export { default as GalleryPage } from "./gallery";
  export { default as PublicGalleryPage } from "./public-gallery";
  ```
- [ ] Add missing exports for Finance Overview page:
  ```typescript
  // Finance pages
  export { default as FinanceOverviewPage } from "./finance-overview";
  ```
- [ ] Uncomment and fix expenses exports:
  ```typescript
  // Expenses pages
  export { ExpensesPage } from "./expenses";
  ```
- [ ] Ensure all imports use consistent naming conventions (PascalCase for components)
- [ ] Review existing exports for naming consistency

## Component Exports in Individual Pages

### Task 2: Fix Gallery Page (`/src/pages/gallery/index.tsx`)

- [ ] Rename default export from `PublicMediaGallery` to `GalleryPage` for consistency:
  ```typescript
  export default function GalleryPage() {
    // existing implementation
  }
  ```

### Task 3: Fix Finance Overview Page (`/src/pages/finance-overview/index.tsx`)

- [ ] Rename default export from `Home` to `FinanceOverviewPage` for consistency:
  ```typescript
  export default function FinanceOverviewPage() {
    return <DashboardPage />
  }
  ```
- [ ] Remove duplicate imports/exports (file currently has duplicated code)

### Task 4: Fix Public Gallery Page (`/src/pages/public-gallery/index.tsx`)

- [ ] Export is already correctly named as `PublicGalleryPage`, no change needed

### Task 5: Fix Expenses Page (`/src/pages/expenses/index.ts`)

- [ ] Current barrel file is correct (exports `ExpensesPage`), no change needed
- [ ] Ensure `ExpensesPage.tsx` file exists and exports correctly

## Routing Updates

### Task 6: Update App.tsx with Missing Routes

- [ ] Add route for Gallery page:
  ```typescript
  <Route
    path="gallery"
    element={
      <ProtectedRoute>
        <GalleryPage />
      </ProtectedRoute>
    }
  />
  ```
- [ ] Add route for Public Gallery page:
  ```typescript
  <Route
    path="public-gallery"
    element={
      <ProtectedRoute>
        <PublicGalleryPage />
      </ProtectedRoute>
    }
  />
  ```
- [ ] Add route for Finance Overview page:
  ```typescript
  <Route
    path="finance-overview"
    element={
      <ProtectedRoute>
        <FinanceOverviewPage />
      </ProtectedRoute>
    }
  />
  ```
- [ ] Add route for Expenses page:
  ```typescript
  <Route
    path="expenses"
    element={
      <ProtectedRoute>
        <ExpensesPage />
      </ProtectedRoute>
    }
  />
  ```

### Task 7: Update App.tsx Imports

- [ ] Update imports in App.tsx to use barrel file for all pages:
  ```typescript
  import {
    // ... existing imports
    GalleryPage,
    PublicGalleryPage,
    FinanceOverviewPage,
    ExpensesPage,
  } from "@/pages";
  ```
- [ ] Remove any direct imports for pages that should come from the barrel file

## Additional Tasks

### Task 8: Review and Fix Other Barrel Files

- [ ] Review and fix `/src/pages/invoices/index.tsx` for consistent exports
- [ ] Review and fix `/src/pages/products/index.tsx` for consistent exports
- [ ] Review and fix `/src/pages/estimates/index.tsx` for consistent exports
- [ ] Review and fix `/src/pages/purchase-orders/index.tsx` for consistent exports
- [ ] Consider creating barrel files for folders that don't have them yet

### Task 9: Documentation

- [ ] Add comments to the main barrel file explaining the export structure
- [ ] Update README.md with barrel file conventions and routing patterns

## Testing Plan

### Task 10: Test All Routes After Changes

- [ ] Test navigation to Gallery page
- [ ] Test navigation to Public Gallery page
- [ ] Test navigation to Finance Overview page
- [ ] Test navigation to Expenses page
- [ ] Test all existing pages still work correctly

## Summary of Changes

| Route             | Page File                  | Current Export     | Target Export       | Route Status | Action Needed      |
| ----------------- | -------------------------- | ------------------ | ------------------- | ------------ | ------------------ |
| /gallery          | gallery/index.tsx          | PublicMediaGallery | GalleryPage         | Missing      | Rename + Add Route |
| /public-gallery   | public-gallery/index.tsx   | PublicGalleryPage  | PublicGalleryPage   | Missing      | Add Route          |
| /finance-overview | finance-overview/index.tsx | Home               | FinanceOverviewPage | Missing      | Rename + Add Route |
| /expenses         | expenses/index.ts          | ExpensesPage       | ExpensesPage        | Missing      | Add Route          |
