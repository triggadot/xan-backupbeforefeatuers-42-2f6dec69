# PDF Generation System Documentation

## Overview

The PDF generation system has been refactored to work with the current database schema, specifically utilizing `rowid_` and `glide_row_id` fields instead of foreign keys. The system now follows a modular approach with separate modules for different document types (invoices, estimates, purchase orders, and products).

## Architecture

### Document-Specific Modules

The PDF generation system is organized into document-specific modules:

- `src/lib/pdf/common.ts`: Shared utilities and types for PDF generation
- `src/lib/pdf/invoice-pdf.ts`: Invoice-specific PDF generation logic
- `src/lib/pdf/estimate-pdf.ts`: Estimate-specific PDF generation logic
- `src/lib/pdf/purchase-order-pdf.ts`: Purchase order-specific PDF generation logic
- `src/lib/pdf/product-pdf.ts`: Product-specific PDF generation logic

### PDF Generation Flow

1. UI component calls `usePDFOperations` hook
2. Hook delegates to appropriate document-specific module
3. Module uses detail hook to fetch data with proper relationships
4. Module generates PDF using jsPDF
5. PDF is converted to a blob and a blob URL is created
6. URL is returned to UI for display/download/sharing

## Core Components

### Common Types and Utilities

```typescript
// src/lib/pdf/common.ts

// Error handling types
export enum PDFErrorType {
  FETCH_ERROR = 'FETCH_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR'
}

export interface PDFError {
  type: PDFErrorType;
  message: string;
}

export interface PDFOperationResult {
  success: boolean;
  url?: string;
  error?: PDFError;
}

// Helper functions for creating standardized results
export function createPDFSuccess(url: string): PDFOperationResult {
  return { success: true, url };
}

export function createPDFError(type: PDFErrorType, message: string): PDFOperationResult {
  return { success: false, error: { type, message } };
}
```

### Document-Specific Modules

Each document type has its own module with three main functions:

1. **Data Fetching**: Retrieves document data with all related information
2. **PDF Generation**: Creates a PDF document using jsPDF
3. **Direct Download**: Handles PDF generation and download

Example for invoices:

```typescript
// src/lib/pdf/invoice-pdf.ts

// 1. Data fetching
export async function fetchInvoiceForPDF(invoiceId: string): Promise<InvoiceWithDetails | null> {
  // Fetches invoice data with related information
}

// 2. PDF generation
export function generateInvoicePDF(invoice: InvoiceWithDetails): jsPDF {
  // Creates a PDF document using jsPDF
}

// 3. Generation and download
export async function generateAndStoreInvoicePDF(
  invoiceId: string | any,
  download: boolean = false
): Promise<PDFOperationResult> {
  // Handles the complete workflow including direct download
}
```

### PDF Operations Hook

The `usePDFOperations` hook provides a unified interface for all PDF operations:

```typescript
// src/hooks/pdf/usePDFOperations.ts

export const usePDFOperations = () => {
  // State for tracking operations
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStoring, setIsStoring] = useState(false);

  // Generate PDF based on document type
  const generatePDF = async (
    documentType: DocumentType,
    documentId: string,
    downloadAfterGeneration: boolean = false
  ): Promise<string | null> => {
    // Delegates to the appropriate document-specific module
  };

  // Download PDF from URL
  const downloadPDF = async (url: string, fileName: string): Promise<void> => {
    // Downloads the PDF using file-saver
  };

  return { generatePDF, downloadPDF, isGenerating, isStoring };
};
```

### UI Components

#### PDF Generation Button

```typescript
// src/components/pdf/PDFGenerationButton.tsx

export function PDFGenerationButton({
  documentType,
  documentId,
  download = false,
  showPreview = true,
  onSuccess,
  onError,
  showLabel = true,
  className = '',
  ...props
}: PDFGenerationButtonProps) {
  // Uses the usePDFOperations hook to generate and handle PDFs
}
```

#### Document-Specific PDF Actions

For each document type, there's a dedicated component for PDF actions:

```typescript
// src/components/products/ProductPDFActions.tsx

export function ProductPDFActions({ productId }: ProductPDFActionsProps) {
  // Provides buttons for generating, viewing, downloading, and sharing PDFs
}
```

## Usage Examples

### Basic PDF Generation

```tsx
// Generate and download an invoice PDF
<PDFGenerationButton 
  documentType="invoice" 
  documentId="123" 
  download={true} 
/>

// Generate and preview a product PDF
<PDFGenerationButton 
  documentType="product" 
  documentId="456" 
  showPreview={true} 
/>
```

### Document-Specific PDF Actions

```tsx
// Add PDF actions to a product detail page
<ProductPDFActions productId={product.id} />
```

### Using the Hook Directly

```tsx
import { usePDFOperations } from '@/hooks/pdf/usePDFOperations';

function MyComponent() {
  const { generatePDF, downloadPDF } = usePDFOperations();
  
  const handleGeneratePDF = async () => {
    try {
      const url = await generatePDF('invoice', '123', true);
      console.log('PDF URL:', url);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return <Button onClick={handleGeneratePDF}>Generate PDF</Button>;
}
```

## Error Handling

The PDF generation system uses a standardized error handling approach:

1. Each module returns a `PDFOperationResult` with success status and error details
2. Errors are categorized by type (fetch, generation, storage)
3. Detailed error messages are provided for troubleshooting
4. Console logs are used for debugging

## Troubleshooting

### Common Issues and Solutions

1. **PDF generation fails with "Error fetching document"**
   - Check if the document ID exists in the database
   - Verify that the document ID is passed correctly (string, not object)
   - Ensure the database connection is working

2. **PDF preview doesn't show**
   - Verify that the blob URL is valid
   - Check that the PDF viewer component is properly configured
   - Ensure the blob hasn't been revoked

3. **PDF download fails**
   - Check that the file-saver library is properly imported
   - Verify that the blob is valid
   - Look for errors in the console related to the download process

4. **"[object Object]" errors in document IDs**
   - Make sure to pass string IDs to PDF generation functions
   - If passing objects, ensure they have id or glide_row_id properties
   - Check the console for detailed error messages

## Recent Improvements

1. **Enhanced error handling**:
   - All PDF modules now use `maybeSingle()` instead of `single()` when fetching records
   - This prevents the "JSON object requested, multiple (or no) rows returned" errors

2. **Improved document ID handling**:
   - All PDF generation functions now accept either string IDs or object references
   - Logic to extract the correct ID from objects has been added

3. **Direct download mechanism**:
   - PDF modules now create blob URLs directly instead of using Supabase storage
   - This eliminates dependency on external storage and simplifies the download process
   - Uses file-saver library for reliable downloads across browsers

4. **Column existence checking**:
   - Added schema validation before querying columns that might not exist
   - Prevents errors when database schema differs from expected

## Future Enhancements

1. **Supabase Storage Integration**:
   - In the future, we plan to reimplement Supabase storage for PDFs
   - This will allow for persistent storage and sharing of PDFs
   - The current direct download approach will be maintained as a fallback

2. **PDF Caching**:
   - Implement a caching mechanism to avoid regenerating unchanged PDFs
   - Store blob URLs in memory for quick access

3. **Batch PDF Generation**:
   - Add support for generating multiple PDFs at once
   - Create ZIP archives for downloading multiple PDFs

## Best Practices

1. Always pass string IDs to PDF generation functions when possible
2. Use the document-specific PDF actions components for the best user experience
3. Handle errors gracefully in the UI with informative messages
4. Use the `usePDFOperations` hook for all PDF operations to ensure consistent behavior
5. Remember to revoke blob URLs when they are no longer needed to prevent memory leaks
