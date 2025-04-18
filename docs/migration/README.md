# Migration Documentation

This directory contains documentation related to migration efforts and relationship mappings in the Xan system.

## Entity Relationships

The following documents outline the relationships between key entities in the system:

- [Customer Payment to Invoice Relationship](./customer-payment-invoice-relationship.md) - Describes how customer payments are linked to invoices
- [Vendor Payment to Purchase Order Relationship](./vendor-payment-purchase-order-relationship.md) - Describes how vendor payments are linked to purchase orders
- [Customer Credit to Estimate Relationship](./customer-credit-estimate-relationship.md) - Describes how customer credits are linked to estimates

## Type Migrations

The following documents outline migration plans for types in the system:

- [Purchase Order Types Migration](./purchase-order-types-migration.md) - Migration plan for purchase order types

## Migration Strategy

Our migration follows these key principles:

1. **Gradual Migration** - Components are migrated one at a time, rather than all at once
2. **Documentation First** - Document the current and target state before implementing changes
3. **Testing During Migration** - Ensure functionality is maintained during migration
4. **Backwards Compatibility** - Maintain backwards compatibility where possible

### Migration Process

1. Document the current state
2. Define the target state
3. Create a migration plan
4. Implement changes component by component
5. Test and verify

## Future Work

Future migration efforts will include:

- Consolidation of payment-related components into the new directory structure
- Complete migration of all legacy types to the new type system
- Implementation of consistent navigation patterns between related entities 