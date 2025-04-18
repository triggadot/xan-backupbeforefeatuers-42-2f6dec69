# Documentation Guide

This document serves as a map to all documentation in the project, helping developers find the information they need quickly.

## Primary Documentation Sources (Single Source of Truth)

- **[README.md](../README.md)** - Project overview, setup instructions, and key conventions
- **[docs/documentation.md](./documentation.md)** - Comprehensive development standards and business logic
- **[docs/naming-convention-plan.md](./naming-convention-plan.md)** - Detailed file/component naming conventions and migration plan

## Domain-Specific Documentation

- **[docs/pdf-generation-system.md](./pdf-generation-system.md)** - PDF generation architecture and implementation details
- **[docs/products-module.md](./products-module.md)** - Products module architecture and implementation
- **[docs/glide-sync-documentation.md](./glide-sync-documentation.md)** - Glide synchronization system details
- **[docs/reusable-components.md](./reusable-components.md)** - Guide to reusable custom components
- **[docs/pdf-button-migration-guide.md](./pdf-button-migration-guide.md)** - PDF button migration guidance

## Module-Specific Documentation

- **[src/components/new/README.md](../src/components/new/README.md)** - New components implementation guide
- **[src/hooks/products/README.md](../src/hooks/products/README.md)** - Product hooks documentation

> **Note:** Component-specific READMEs outside of these key directories have been deprecated and removed in favor of centralized documentation and JSDoc comments within component files. All component documentation should follow the standards in `docs/documentation.md`.

## Database Documentation

- **[docs/database/](./database/)** - Database schema, views, functions, and queries

## Module Architecture

The application is structured around these primary modules:

1. **Accounts** - Customer and vendor management
2. **Products** - Product catalog and inventory management
3. **Invoices** - Customer invoicing and payment tracking
4. **Purchase Orders** - Vendor purchase orders and payment tracking
5. **Estimates** - Pre-invoice estimates and proposal management
6. **PDF Generation** - Dynamic PDF generation for business documents
7. **Shipping Records** - Shipping and logistics tracking

Each module follows the same pattern:
- UI Components in `src/components/[module-name]/`
- Data hooks in `src/hooks/[module-name]/`
- Service layer in `src/services/supabase/[module-name]`
- Types in `src/types/[module-name]`
- Pages in `src/pages/[module-name]/`

## Documentation Standards

### When to Create New Documentation

1. For new features or major architectural changes
2. When implementing complex business logic
3. For cross-cutting concerns that affect multiple modules

### Documentation Format

All documentation should include:

1. **Purpose** - What the document covers and why it exists
2. **Architecture** - How the feature is structured
3. **Implementation** - Technical details and code examples
4. **Usage** - How to use the feature or component
5. **Edge Cases** - Common pitfalls and special considerations

### Preferred Documentation Methods

1. **Central Documentation Files** - Primary documentation should be in the `/docs` directory
2. **JSDoc Comments** - Component, hook and function documentation should use JSDoc comments
3. **Barrel File Comments** - Include brief description comments in index.ts barrel files
4. **README.md Files** - Only for major feature areas or special instructions

### Keeping Documentation Updated

When making significant changes:

1. Update relevant documentation files
2. Note the date of the last update
3. If a document becomes obsolete, mark it as deprecated and point to newer documentation 