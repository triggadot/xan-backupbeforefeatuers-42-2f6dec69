# DEPRECATED

**u26a0ufe0f This edge function is deprecated and will be removed in a future release. u26a0ufe0f**

Please use the `pdf-backend` edge function instead, which handles PDF generation
using the standardized Glidebase sync pattern and consistent naming conventions.

## Migration Guide

Update your frontend code to use the `triggerPDFGeneration` utility function in `src/lib/pdf-utils.ts`:

```typescript
import { triggerPDFGeneration } from '../../lib/pdf-utils';

// Before (deprecated)
const response = await supabase.functions.invoke('generate-pdf', {
  body: { type, id }
});

// After (new approach)
const pdfUrl = await triggerPDFGeneration(
  documentType, // 'invoice', 'estimate', or 'purchase_order'
  document,
  true // Force regenerate
);
```

See `/supabase/functions/pdf-backend/README.md` for complete documentation on the new standardized approach.
