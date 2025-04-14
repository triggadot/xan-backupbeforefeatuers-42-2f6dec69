# DEPRECATED

**⚠️ This edge function is deprecated and will be removed in a future release. ⚠️**

Please use the `pdf-backend` edge function instead, which handles PDF generation
using the standardized Glidebase sync pattern and consistent naming conventions.

## Migration Guide

Update your frontend code to use the `BatchPDFGenerator` utility in `src/lib/batch-pdf-generator.ts`:

```typescript
import { BatchPDFGenerator } from '../../lib/batch-pdf-generator';

// Before (deprecated)
const response = await supabase.functions.invoke('batch-generate-and-store-pdfs', {
  body: { items: [...] }
});

// After (new approach)
const job = await BatchPDFGenerator.createJob({
  documentType: 'invoice', // or 'estimate', 'purchase_order'
  documentIds: [id1, id2, id3],
  forceRegenerate: true
});

// Start the job
await BatchPDFGenerator.startJob(job.id);
```

See `/supabase/functions/pdf-backend/README.md` for complete documentation on the new standardized approach.
