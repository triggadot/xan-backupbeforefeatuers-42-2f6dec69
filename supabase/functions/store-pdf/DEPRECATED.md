# DEPRECATED

**⚠️ This edge function is deprecated and will be removed in a future release. ⚠️**

Please use the `pdf-backend` edge function instead, which handles PDF generation
using the standardized Glidebase sync pattern and consistent naming conventions.

## Migration Guide

Update your frontend code to use the `triggerPDFGeneration` utility function in `src/lib/pdf-utils.ts`:

```typescript
import { triggerPDFGeneration } from '../../lib/pdf-utils';

// Before (deprecated)
const response = await supabase.functions.invoke('store-pdf', {
  body: { documentType, documentId, pdfBase64 }
});

// After (new approach)
const pdfUrl = await triggerPDFGeneration(
  documentType,
  document,
  true // Force regenerate
);
```

See `/supabase/functions/pdf-backend/README.md` for complete documentation on the new standardized approach.
