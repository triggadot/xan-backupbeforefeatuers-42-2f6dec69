# DEPRECATED

**u26a0ufe0f This edge function is deprecated and will be removed in a future release. u26a0ufe0f**

Please use the `pdf-backend` edge function instead, which handles PDF generation
using the standardized Glidebase sync pattern and consistent naming conventions.

## Migration Guide

The automatic PDF generation functionality has been replaced by a more robust queue-based approach:

1. Database triggers add items to the `gl_pdf_generation_queue` when documents are created or updated
2. The `process_pdf_generation_queue()` function processes these items
3. Scheduled jobs ensure regular processing of the queue

For manual PDF generation, use the `triggerPDFGeneration` utility:

```typescript
import { triggerPDFGeneration } from '../../lib/pdf-utils';

const pdfUrl = await triggerPDFGeneration(
  documentType, // 'invoice', 'estimate', or 'purchase_order'
  document,
  true // Force regenerate
);
```

See `/supabase/functions/pdf-backend/README.md` for complete documentation on the new standardized approach.
