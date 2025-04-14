# PDF Button Migration Guide

## Overview

As part of the PDF generation system consolidation, we've standardized all PDF button components to use the new `StandardPDFButton` component. This guide explains how to migrate from legacy PDF button components to the new standardized approach.

## Migration Path

### Legacy Components (Deprecated)

The following components are now deprecated and will be removed in a future update:

- `PDFButton` - Basic PDF button for viewing, sharing, and downloading PDFs
- `PDFGenerationButton` - Enhanced button with dropdown and server-side generation support

These components now internally redirect to `StandardPDFButton` but should be replaced in your code to avoid deprecation warnings.

### New Standardized Component

```tsx
import { StandardPDFButton } from '@/components/pdf/StandardPDFButton';
import { DocumentType } from '@/types/pdf.unified';

// Basic usage
<StandardPDFButton 
  documentType={DocumentType.INVOICE}
  documentId="invoice-123"
  action="view"
/>

// With dropdown menu
<StandardPDFButton 
  documentType={DocumentType.ESTIMATE}
  documentId="estimate-456"
  useDropdown={true}
  allowServerGeneration={true}
/>
```

## Key Differences

1. **Document Type Enum**: Uses the standardized `DocumentType` enum from `pdf.unified.ts` instead of string literals
2. **Document ID Separation**: Requires separate `documentType` and `documentId` props instead of a document object
3. **Unified Actions**: Supports all actions in one component: `view`, `share`, `download`, `generate`, `regenerate`, and `server`
4. **Improved Error Handling**: Provides consistent error handling and feedback via toast notifications
5. **Backend Integration**: Uses the unified `pdf-backend` edge function for all PDF operations

## Migration Examples

### From PDFButton

**Before:**
```tsx
import { PDFButton } from '@/components/pdf/PDFButton';

<PDFButton 
  documentType="invoice"
  document={invoiceData}
  action="view"
/>
```

**After:**
```tsx
import { StandardPDFButton } from '@/components/pdf/StandardPDFButton';
import { DocumentType } from '@/types/pdf.unified';

<StandardPDFButton 
  documentType={DocumentType.INVOICE}
  documentId={invoiceData.id || invoiceData.glide_row_id}
  document={invoiceData} // Optional, for better filename generation
  action="view"
/>
```

### From PDFGenerationButton

**Before:**
```tsx
import { PDFGenerationButton } from '@/components/pdf/PDFGenerationButton';

<PDFGenerationButton 
  documentType="purchaseOrder"
  documentId="po-789"
  useDropdown={true}
  allowServerGeneration={true}
/>
```

**After:**
```tsx
import { StandardPDFButton } from '@/components/pdf/StandardPDFButton';
import { DocumentType } from '@/types/pdf.unified';

<StandardPDFButton 
  documentType={DocumentType.PURCHASE_ORDER}
  documentId="po-789"
  useDropdown={true}
  allowServerGeneration={true}
/>
```

## StandardPDFButton Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `documentType` | `DocumentType` | (required) | Type of document (from DocumentType enum) |
| `documentId` | `string` | (required) | ID of the document |
| `document` | `any` | `undefined` | Optional document data for better filename generation |
| `variant` | `ButtonVariant` | `'outline'` | Button variant (outline, default, ghost, etc.) |
| `size` | `ButtonSize` | `'default'` | Button size (default, sm, lg, icon) |
| `action` | `string` | `'view'` | Button action (view, share, download, generate, regenerate, server) |
| `onPDFGenerated` | `(url: string) => void` | `undefined` | Callback when PDF is generated |
| `onError` | `(error: any) => void` | `undefined` | Callback when an error occurs |
| `disabled` | `boolean` | `false` | Whether the button is disabled |
| `showLabel` | `boolean` | `true` | Whether to show the label |
| `className` | `string` | `''` | Additional CSS class |
| `useDropdown` | `boolean` | `false` | Whether to use a dropdown menu for multiple options |
| `allowServerGeneration` | `boolean` | `true` | Whether to allow server-side generation |
| `title` | `string` | `undefined` | Custom title for modals |
| `showShareOption` | `boolean` | `true` | Whether to show a share button in the preview modal |
| `forceRegenerate` | `boolean` | `false` | Whether to force regeneration of the PDF |
| `useBatchProcessing` | `boolean` | `false` | Whether to use batch processing for server-side generation |

## Backend Integration

The `StandardPDFButton` integrates with the `pdf-backend` edge function following the standardized PDF backend architecture. It uses the `supabase_pdf_url` field for storing and retrieving PDF URLs and follows the queue-based approach for batch operations.

For more details on the backend architecture, see the [PDF Backend Architecture Standardization](pdf-generation-system.md) documentation.
