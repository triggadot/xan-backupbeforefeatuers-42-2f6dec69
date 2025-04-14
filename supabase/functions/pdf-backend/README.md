# PDF Backend Architecture

This edge function is the standardized approach for PDF generation in the Xan-1 project. It handles the generation, storage, and database updating of PDFs for invoices, estimates, and purchase orders.

## Core Features

- **Centralized PDF Generation**: Single source of truth for all PDF generation
- **Queue-Based Processing**: Robust processing with retry logic and error handling
- **Standardized Storage**: Consistent folder and filename structure
- **Glidebase Integration**: Follows the Glidebase sync pattern using `glide_row_id` for relationships

## Storage Structure

All PDFs are stored with a consistent structure:

```
https://swrfsullhirscyxqneay.supabase.co/storage/v1/object/public/pdfs/[TypeFolder]/[UUID].pdf
```

Where:
- **TypeFolder**: Properly capitalized folder name (`Invoices`, `Estimates`, or `PurchaseOrders`)
- **UUID**: Document's unique record ID for consistent identification

## Database Fields

All PDFs are referenced using the `supabase_pdf_url` field in their respective tables:
- `gl_invoices.supabase_pdf_url`
- `gl_estimates.supabase_pdf_url`
- `gl_purchase_orders.supabase_pdf_url`

**Important**: Legacy fields like `pdf_url` or `glide_pdf_url` should not be used.

## How to Use

### From Frontend

Use the `triggerPDFGeneration` utility in `pdf-utils.ts`:

```typescript
import { triggerPDFGeneration } from '../../lib/pdf-utils';

// Generate a PDF for a document
const pdfUrl = await triggerPDFGeneration(
  'invoice', // or 'estimate', 'purchase_order'
  document,
  forceRegenerate // optional, defaults to false
);
```

### Batch Generation

Use the `BatchPDFGenerator` component to process multiple documents:

```typescript
import { BatchPDFGenerator } from '../../lib/batch-pdf-generator';

// Create a batch job
const job = await BatchPDFGenerator.createJob({
  documentType: 'invoice',
  documentIds: [id1, id2, id3],
  forceRegenerate: true
});

// Start the job
await BatchPDFGenerator.startJob(job.id);
```

### Direct API Call

For manual testing or direct integration, call the edge function:

```typescript
const response = await supabase.functions.invoke('pdf-backend', {
  body: {
    action: 'generate',
    documentType: 'invoice',
    documentId: 'document-uuid',
    overwriteExisting: true
  }
});
```

## Queue Processing

The system uses a queue-based approach with `gl_pdf_generation_queue` table and `process_pdf_generation_queue()` function.

To manually trigger queue processing:

```sql
SELECT process_pdf_generation_queue();
```

## Removed Legacy Components

The following edge functions have been completely removed from the codebase as of April 2025:

1. `store-pdf`
2. `generate-pdf`
3. `batch-generate-and-store-pdfs`
4. `auto-generate-pdf`

All code now uses the standardized `pdf-backend` approach. Any references to these legacy functions should be updated to use the current implementation.
