# PDF System Documentation

This document provides comprehensive information about the PDF generation and management system in the Xan-1 project.

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [PDF Utilities](#pdf-utilities)
4. [React Hooks](#react-hooks)
5. [UI Components](#ui-components)
6. [Best Practices](#best-practices)
7. [Examples](#examples)
8. [Error Handling](#error-handling)
9. [Troubleshooting](#troubleshooting)

## Overview

The PDF system in the Xan-1 project provides a unified approach to creating, viewing, sharing, and downloading PDFs for invoices, purchase orders, and estimates. The system follows the Feature-Based Architecture pattern and includes reusable components, hooks, and utilities.

The system uses jsPDF for PDF generation and Supabase for storage, with a consistent approach to error handling and database integration.

## Key Features

- Generate PDFs for invoices, purchase orders, and estimates
- Store PDFs in Supabase storage
- Update database records with PDF URLs
- Preview PDFs in a modal
- Share PDF links via clipboard or email
- Download PDFs locally
- Batch PDF generation for reports
- Standardized error handling
- PDF caching to avoid regenerating unchanged documents

## PDF Utilities

The core PDF utilities are located in `src/lib/pdf-utils.ts`.

### Key Functions

#### `generatePDF`

Generates a PDF document based on document type and data.

```typescript
function generatePDF(
  type: 'invoice' | 'purchaseOrder' | 'estimate',
  data: Invoice | PurchaseOrder | Estimate
): jsPDF | null
```

**Parameters:**
- `type`: The type of document ('invoice', 'purchaseOrder', or 'estimate')
- `data`: The document data

**Returns:** The generated jsPDF document or null if generation failed

**Example:**
```typescript
const doc = generatePDF('purchaseOrder', purchaseOrderData);
if (doc) {
  doc.save('purchase-order.pdf');
}
```

#### `generateAndStorePDF`

Complete workflow to generate, store, and update database with PDF link.

```typescript
async function generateAndStorePDF(
  type: 'invoice' | 'purchaseOrder' | 'estimate',
  data: Invoice | PurchaseOrder | Estimate,
  saveLocally: boolean = false,
  download: boolean = false
): Promise<string | null>
```

**Parameters:**
- `type`: The type of document ('invoice', 'purchaseOrder', or 'estimate')
- `data`: The document data
- `saveLocally`: Whether to also save the PDF locally
- `download`: Whether to trigger browser download

**Returns:** The URL of the uploaded PDF or null if any step failed

**Example:**
```typescript
const pdfUrl = await generateAndStorePDF('purchaseOrder', purchaseOrderData, true);
if (pdfUrl) {
  console.log('PDF generated and stored successfully:', pdfUrl);
}
```

#### `storePDFInSupabase`

Store a PDF document in Supabase storage.

```typescript
async function storePDFInSupabase(
  doc: jsPDF,
  entityType: 'invoice' | 'purchase-order' | 'estimate',
  entityId: string,
  fileName?: string
): Promise<string | null>
```

**Parameters:**
- `doc`: The jsPDF document to store
- `entityType`: The type of entity ('invoice', 'purchase-order', 'estimate')
- `entityId`: The ID of the entity
- `fileName`: Optional custom filename

**Returns:** The public URL of the stored PDF or null if storage failed

#### `updatePDFLinkInDatabase`

Update the PDF link in the database after uploading.

```typescript
async function updatePDFLinkInDatabase(
  table: 'gl_invoices' | 'gl_purchase_orders' | 'gl_estimates',
  id: string,
  pdfUrl: string
): Promise<boolean>
```

**Parameters:**
- `table`: The table to update ('gl_invoices', 'gl_purchase_orders', or 'gl_estimates')
- `id`: The ID of the record to update
- `pdfUrl`: The URL of the uploaded PDF

**Returns:** Whether the update was successful

**Example:**
```typescript
const success = await updatePDFLinkInDatabase('gl_invoices', '123', 'https://example.com/invoice.pdf');
```

### Deprecated Functions

The following functions are deprecated and should not be used in new code:

- `uploadPDFToStorage`: Use `storePDFInSupabase` instead
- `generateAndStoreInvoicePDF`: Use `generateAndStorePDF('invoice', ...)` instead
- `generateAndStoreEstimatePDF`: Use `generateAndStorePDF('estimate', ...)` instead
- `generateAndStorePurchaseOrderPDF`: Use `generateAndStorePDF('purchaseOrder', ...)` instead

### Error Handling

The PDF utilities use a standardized error handling system:

```typescript
enum PDFErrorType {
  FETCH_ERROR = 'FETCH_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

interface PDFOperationError {
  type: PDFErrorType;
  message: string;
  details?: any;
}

interface PDFOperationResult {
  success: boolean;
  url?: string;
  error?: PDFOperationError;
}
```

## React Hooks

### usePDFGeneration

The `usePDFGeneration` hook provides a React-friendly way to generate PDFs with data fetching.

```typescript
function usePDFGeneration() {
  // Returns functions for generating PDFs for different document types
  return {
    isGenerating,
    lastResult,
    generateInvoicePDF,
    generatePurchaseOrderPDF,
    generateEstimatePDF
  };
}
```

**Hook Values:**
- `isGenerating`: Whether a PDF is currently being generated
- `lastResult`: The result of the last PDF generation operation
- `generateInvoicePDF`: Function to generate an invoice PDF
- `generatePurchaseOrderPDF`: Function to generate a purchase order PDF
- `generateEstimatePDF`: Function to generate an estimate PDF

**Usage:**
```typescript
import { usePDFGeneration } from '@/hooks/pdf/usePDFGeneration';

function MyComponent() {
  const { generateInvoicePDF, isGenerating } = usePDFGeneration();
  
  const handleGeneratePDF = async () => {
    const result = await generateInvoicePDF('invoice-123', true);
    if (result.success) {
      console.log('PDF generated and available at:', result.url);
    } else {
      console.error('PDF generation failed:', result.error?.message);
    }
  };
  
  return (
    <button onClick={handleGeneratePDF} disabled={isGenerating}>
      Generate Invoice PDF
    </button>
  );
}
```

### usePDFOperations

`usePDFOperations` provides PDF operations without requiring the context.

```typescript
import { usePDFOperations } from '@/hooks/pdf/usePDFOperations';

function YourComponent() {
  const { 
    generatePDF, 
    viewPDF, 
    downloadPDF, 
    sharePDFLink, 
    sharePDFViaEmail, 
    isGenerating 
  } = usePDFOperations();
  
  // Use PDF operations
}
```

**Hook Values:**
- `generatePDF`: Function to generate and store a PDF
- `updateDocumentWithPDFUrl`: Function to update a document with its PDF URL
- `viewPDF`: Function to view a PDF in a new tab
- `downloadPDF`: Function to download a PDF
- `sharePDFLink`: Function to copy a PDF URL to the clipboard
- `sharePDFViaEmail`: Function to share a PDF via email
- `isGenerating`: Whether a PDF is being generated

## UI Components

### 1. PDFButton

`PDFButton.tsx` provides a simple, reusable button for PDF operations.

```tsx
import { PDFButton } from '@/components/pdf/PDFButton';

// Example usage
<PDFButton 
  documentType="invoice" 
  document={invoice} 
  action="view" 
  onPDFGenerated={(url) => console.log('PDF generated:', url)} 
/>
```

**Props:**
- `documentType`: 'invoice' | 'purchaseOrder' | 'estimate'
- `document`: The document data
- `action`: 'view' | 'share' | 'download' | 'generate'
- `variant`: Button variant (default, outline, ghost)
- `size`: Button size (default, sm, lg, icon)
- `onPDFGenerated`: Callback when PDF is generated
- `disabled`: Whether the button is disabled
- `showLabel`: Whether to show the button label
- `className`: Additional CSS classes

### 2. PDFGenerationButton

The `PDFGenerationButton` component uses the `usePDFGeneration` hook for enhanced PDF generation.

```tsx
<PDFGenerationButton
  documentType="invoice"
  documentId="123"
  showPreview={true}
  onSuccess={(url) => console.log('PDF URL:', url)}
/>
```

**Props:**
- `documentType`: 'invoice' | 'purchaseOrder' | 'estimate'
- `documentId`: The ID of the document to generate
- `download`: Whether to download the PDF after generation
- `showPreview`: Whether to show the PDF in a preview modal after generation
- `onSuccess`: Callback function when PDF is successfully generated
- `onError`: Callback function when PDF generation fails
- `showLabel`: Whether to show a label next to the icon
- `className`: Custom class name for styling

### 3. PDFActions

`PDFActions.tsx` provides a more comprehensive interface with multiple PDF actions.

```tsx
import { PDFActions } from '@/components/pdf/PDFActions';

// Example usage
<PDFActions 
  documentType="invoice" 
  document={invoice} 
  size="default" 
  showLabels={true} 
/>
```

**Props:**
- `documentType`: 'invoice' | 'purchaseOrder' | 'estimate'
- `document`: The document data
- `variant`: Button variant
- `size`: Button size (controls layout - icon size uses dropdown)
- `className`: Additional CSS classes
- `showLabels`: Whether to show button labels
- `disabled`: Whether the actions are disabled
- `onPDFGenerated`: Callback when PDF is generated

### 4. PDFPreviewModal

`PDFPreviewModal.tsx` displays PDFs directly in the application with zoom controls.

```tsx
import { PDFPreviewModal } from '@/components/pdf/PDFPreviewModal';

// Example usage
<PDFPreviewModal 
  pdfUrl="https://example.com/path/to/pdf.pdf" 
  isOpen={showModal} 
  onClose={() => setShowModal(false)} 
  title="Invoice PDF"
/>
```

**Props:**
- `pdfUrl`: URL of the PDF to display
- `isOpen`: Whether the modal is open
- `onClose`: Function to call when the modal is closed
- `title`: Title to display in the modal header

### 5. PDFShareModal

`PDFShareModal.tsx` provides options for sharing PDFs via link or email.

```tsx
import { PDFShareModal } from '@/components/pdf/PDFShareModal';

// Example usage
<PDFShareModal 
  pdfUrl="https://example.com/path/to/pdf.pdf" 
  documentType="invoice" 
  document={invoice} 
  isOpen={showShareModal} 
  onClose={() => setShowShareModal(false)} 
/>
```

**Props:**
- `pdfUrl`: URL of the PDF to share
- `documentType`: 'invoice' | 'purchaseOrder' | 'estimate'
- `document`: The document data
- `isOpen`: Whether the modal is open
- `onClose`: Function to call when the modal is closed

### 6. PDFContextProvider

`PDFContextProvider.tsx` provides a context for PDF operations.

```tsx
import { PDFProvider, usePDF } from '@/components/pdf/PDFContextProvider';

// Wrap your application or component
<PDFProvider>
  <YourComponent />
</PDFProvider>

// Use the context in your component
function YourComponent() {
  const { generatePDF, viewPDF, sharePDF } = usePDF();
  
  // Use PDF operations
}
```

**Context Values:**
- `generatePDF`: Function to generate a PDF
- `updatePDFLink`: Function to update a PDF link in the database
- `viewPDF`: Function to view a PDF
- `sharePDF`: Function to share a PDF
- `downloadPDF`: Function to download a PDF
- `isLoading`: Whether a PDF operation is in progress

## Best Practices

1. **Use the correct field for PDF URLs**: Always use `supabase_pdf_url` for storing PDF URLs in the database.
2. **Prefer the generic functions**: Use `generateAndStorePDF` instead of document-specific functions.
3. **Handle errors properly**: Always check for errors and provide user feedback.
4. **Use the hooks in React components**: Prefer the `usePDFGeneration` or `usePDFOperations` hooks in React components.
5. **Cache PDFs when possible**: Avoid regenerating PDFs for unchanged documents.
6. **Follow DRY principles**: Reuse existing PDF generation code rather than duplicating functionality.
7. **Consistent error handling**: Use the standardized error handling system for all PDF operations.
8. **Provide user feedback**: Always show loading states and error messages to users.

## Examples

### Generate and View a PDF

```tsx
import { usePDFGeneration } from '@/hooks/pdf/usePDFGeneration';
import { PDFPreviewModal } from '@/components/pdf/PDFPreviewModal';
import { useState } from 'react';

function ViewPDFExample({ invoiceId }) {
  const { generateInvoicePDF, isGenerating } = usePDFGeneration();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const handleViewPDF = async () => {
    const result = await generateInvoicePDF(invoiceId);
    if (result.success && result.url) {
      setPdfUrl(result.url);
      setShowModal(true);
    }
  };
  
  return (
    <>
      <button onClick={handleViewPDF} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'View PDF'}
      </button>
      
      {showModal && pdfUrl && (
        <PDFPreviewModal
          pdfUrl={pdfUrl}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Invoice PDF"
        />
      )}
    </>
  );
}
```

### Generate Multiple PDFs

```typescript
import { generateAndStorePDF } from '@/lib/pdf-utils';

async function generateMultiplePDFs(invoices) {
  const pdfUrls = [];
  
  for (const invoice of invoices) {
    const pdfUrl = await generateAndStorePDF('invoice', invoice);
    if (pdfUrl) {
      pdfUrls.push({ id: invoice.id, url: pdfUrl });
    }
  }
  
  return pdfUrls;
}
```

### Using the PDFButton Component

```tsx
import { PDFButton } from '@/components/pdf/PDFButton';
import { useToast } from '@/hooks/utils/use-toast';

function InvoiceActions({ invoice }) {
  const { toast } = useToast();
  
  const handlePDFGenerated = (url) => {
    toast({
      title: 'PDF Generated',
      description: 'Invoice PDF has been generated successfully.',
      variant: 'default',
    });
  };
  
  return (
    <div className="flex space-x-2">
      <PDFButton 
        documentType="invoice" 
        document={invoice} 
        action="view" 
        onPDFGenerated={handlePDFGenerated} 
      />
      
      <PDFButton 
        documentType="invoice" 
        document={invoice} 
        action="download" 
        variant="outline" 
        size="sm" 
        showLabel={false} 
      />
      
      <PDFButton 
        documentType="invoice" 
        document={invoice} 
        action="share" 
        variant="ghost" 
        size="sm" 
        showLabel={false} 
      />
    </div>
  );
}
```

## Error Handling

The PDF generation system uses a standardized error handling approach:

```typescript
try {
  const result = await generateInvoicePDF(invoiceId);
  
  if (result.success) {
    // Handle success
    console.log('PDF URL:', result.url);
  } else {
    // Handle specific error types
    switch (result.error?.type) {
      case PDFErrorType.FETCH_ERROR:
        console.error('Failed to fetch invoice data:', result.error.message);
        break;
      case PDFErrorType.GENERATION_ERROR:
        console.error('Failed to generate PDF:', result.error.message);
        break;
      case PDFErrorType.STORAGE_ERROR:
        console.error('Failed to store PDF:', result.error.message);
        break;
      default:
        console.error('Unknown error:', result.error?.message);
    }
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

## Troubleshooting

### Common Issues

1. **PDF not generating**: Check if the document data is complete and valid
2. **PDF not storing**: Verify Supabase storage permissions and bucket configuration
3. **PDF URL not updating**: Check database update logic and field names
4. **PDF not downloading**: Ensure the URL is accessible and CORS is properly configured
5. **PDF rendering issues**: Check the PDF generation logic for the specific document type

### Debugging Tips

1. **Check console logs**: The PDF utilities include detailed logging
2. **Verify document data**: Ensure all required fields are present
3. **Test storage access**: Verify Supabase storage is accessible
4. **Check database permissions**: Ensure the application has permission to update the database
5. **Inspect network requests**: Look for CORS or authentication issues when accessing PDFs
