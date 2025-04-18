# Naming Convention Standardization Plan

## Current State Analysis

The codebase currently exhibits inconsistent naming conventions:

1. **File Names:**
   - PascalCase: `PurchaseOrderTable.tsx`, `PurchaseOrderDemo.tsx`
   - kebab-case: `purchase-order-table.tsx`, `purchase-order-demo.tsx`

2. **Directory Names:**
   - Mostly kebab-case: `purchase-orders/`, `new/invoices/`

3. **Component Names:**
   - Consistently PascalCase: `PurchaseOrderTable`, `InvoiceList`

4. **Import Statements:**
   - Direct imports from both PascalCase and kebab-case files
   - Inconsistent use of barrel exports (index.ts)

5. **Duplication:**
   - Some components exist in both PascalCase and kebab-case versions with similar functionality

## Target Conventions (Based on Custom Instructions)

1. **File & Directory Names:** kebab-case
   - Example: `purchase-order-table.tsx`, `invoice-list.tsx`

2. **Component Names:** PascalCase
   - Example: `PurchaseOrderTable`, `InvoiceList`

3. **Variables, Functions, Methods:** camelCase
   - Example: `handleViewPdf`, `filteredPurchaseOrders`

4. **Environment Variables:** UPPERCASE
   - Example: `API_URL`, `DATABASE_CONNECTION`

5. **Component Exports:** Named exports
   - Example: `export function InvoiceList() {...}`

## Migration Plan

### Phase 1: Immediate Fixes

1. **Update Barrel Files (index.ts):**
   - Modify exports to point to kebab-case files
   - Example: `export { PurchaseOrderTable } from './purchase-order-table'`

2. **Fix Imports in Application:**
   - Update imports to use barrel files where possible
   - Otherwise update paths to use kebab-case

3. **Consolidate Duplicate Components:**
   - Identify duplicates (PascalCase vs kebab-case)
   - Ensure kebab-case version has all functionality
   - Update index exports to use kebab-case version

### Phase 2: Systematic Conversion (By Feature Area)

1. **Purchase Orders Module:**
   - Rename PascalCase files to kebab-case
   - Update internal imports
   - Update barrel exports

2. **Invoices Module:** (Similar process)

3. **Products Module:** (Similar process)

4. **Accounts Module:** (Similar process)

5. **UI Components:**
   - Update only if already following kebab-case convention
   - Otherwise, document as technical debt

### Phase 3: New Component Guidelines

1. **Component Creation Template:**
   ```typescript
   // src/components/feature/component-name.tsx
   import { useState } from 'react';
   
   export interface ComponentNameProps {
     // Props definition
   }
   
   export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
     // Component implementation
   }
   ```

2. **Barrel Export Pattern:**
   ```typescript
   // src/components/feature/index.ts
   export { ComponentName } from './component-name';
   ```

3. **Import Pattern:**
   ```typescript
   import { ComponentName } from '@/components/feature';
   ```

## Implementation Notes

1. **Avoid breaking changes:**
   - Keep exports consistent using barrel files
   - Test thoroughly after each module conversion

2. **File renames:**
   - Use git rename to preserve history
   - Example: `git mv PurchaseOrderTable.tsx purchase-order-table.tsx`

3. **Documentation:**
   - Update component documentation with new paths
   - Add JSDoc comments for complex components

## Tooling Support

1. **ESLint Rules:**
   - Add custom ESLint rules to enforce naming conventions
   - Example: filename-convention rule for kebab-case files

2. **VS Code Snippets:**
   - Create snippets for new component creation following conventions

## Timeline

1. **Phase 1:** Immediate fixes - 1-2 days
2. **Phase 2:** Module-by-module conversion - 1-2 weeks
3. **Phase 3:** Guidelines implementation - Ongoing

## Progress Tracking

| Module | Status | Completion Date |
|--------|--------|----------------|
| Purchase Orders | In Progress | - |
| Invoices | Not Started | - |
| Products | Not Started | - |
| Accounts | Not Started | - |
| UI Components | Not Started | - | 