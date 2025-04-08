# PDF System Documentation

## Overview

The PDF system in the Xan-1 project provides a unified approach to creating, viewing, sharing, and downloading PDFs for invoices, purchase orders, and estimates. The system follows the Feature-Based Architecture pattern and includes reusable components, hooks, and utilities.

## Key Components

### 1. PDF Button Component

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

### 2. PDF Actions Component

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

### 3. PDF Preview Modal

`PDFPreviewModal.tsx` displays PDFs directly in the application with zoom controls.

```tsx
import { PDFPreviewModal } from '@/components/pdf/PDFPreviewModal';

// Example usage
<PDFPreviewModal 
  pdfUrl="https://example.com/path/to/pdf.pdf" 
  documentType="invoice" 
  document={invoice} 
  isOpen={showModal} 
  onClose={() => setShowModal(false)} 
/>
```

**Props:**
- `pdfUrl`: URL of the PDF to display
- `documentType`: 'invoice' | 'purchaseOrder' | 'estimate'
- `document`: The document data
- `isOpen`: Whether the modal is open
- `onClose`: Function to call when the modal is closed

### 4. PDF Share Modal

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

### 5. PDF Context Provider

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

## Custom Hooks

### usePDFOperations

`usePDFOperations.ts` provides PDF operations without requiring the context.

```tsx
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

## Utility Functions

The PDF system uses utility functions from `pdf-utils.ts`:

### PDF Generation Functions

```typescript
/**
 * Generate a PDF for a specific document type
 * @param invoice The invoice data with related account and line items
 * @returns jsPDF document object
 */
generateInvoicePDF(invoice: Invoice): jsPDF

/**
 * Generate a PDF for a purchase order
 * @param purchaseOrder The purchase order data with related account and products
 * @returns jsPDF document object
 */
generatePurchaseOrderPDF(purchaseOrder: PurchaseOrder): jsPDF

/**
 * Generate a PDF for an estimate
 * @param estimate The estimate data with related account and line items
 * @returns jsPDF document object
 */
generateEstimatePDF(estimate: Estimate): jsPDF

/**
 * Generate a filename for a PDF document
 * @param prefix The document type prefix (e.g., 'Invoice', 'PO', 'Estimate')
 * @param id The document ID or UID
 * @param date The document date
 * @returns A formatted filename string
 */
generateFilename(prefix: string, id: string, date: Date | string): string

/**
 * Store a PDF document in Supabase storage
 * @param doc The jsPDF document to store
 * @param entityType The type of entity ('invoice', 'purchase-order', 'estimate')
 * @param entityId The ID of the entity
 * @param fileName Optional custom filename
 * @returns The public URL of the stored PDF or null if storage failed
 */
storePDFInSupabase(
  doc: jsPDF,
  entityType: 'invoice' | 'purchase-order' | 'estimate',
  entityId: string,
  fileName?: string
): Promise<string | null>

/**
 * Upload a PDF to Supabase storage
 * @param doc The jsPDF document to upload
 * @param folderName The folder to store the PDF in (Invoices, PurchaseOrders, or Estimates)
 * @param fileName The name of the file
 * @returns The URL of the uploaded file or null if upload failed
 */
uploadPDFToStorage(
  doc: jsPDF, 
  folderName: 'Invoices' | 'PurchaseOrders' | 'Estimates', 
  fileName: string
): Promise<string | null>

/**
 * Generate, save locally, and upload an invoice PDF to Supabase storage
 * @param invoice The invoice data
 * @param saveLocally Whether to also save the PDF locally
 * @returns The URL of the uploaded file or null if upload failed
 */
generateAndStoreInvoicePDF(invoice: Invoice, saveLocally?: boolean): Promise<string | null>

/**
 * Generate, save locally, and upload a purchase order PDF to Supabase storage
 * @param purchaseOrder The purchase order data
 * @param saveLocally Whether to also save the PDF locally
 * @returns The URL of the uploaded file or null if upload failed
 */
generateAndStorePurchaseOrderPDF(purchaseOrder: PurchaseOrder, saveLocally?: boolean): Promise<string | null>

/**
 * Generate, save locally, and upload an estimate PDF to Supabase storage
 * @param estimate The estimate data
 * @param saveLocally Whether to also save the PDF locally
 * @returns The URL of the uploaded file or null if upload failed
 */
generateAndStoreEstimatePDF(estimate: Estimate, saveLocally?: boolean): Promise<string | null>

/**
 * Update the PDF link in the database after uploading
 * @param table The table to update ('gl_invoices', 'gl_purchase_orders', or 'gl_estimates')
 * @param id The ID of the record to update
 * @param pdfUrl The URL of the uploaded PDF
 * @returns Whether the update was successful
 */
updatePDFLinkInDatabase(
  table: 'gl_invoices' | 'gl_purchase_orders' | 'gl_estimates',
  id: string,
  pdfUrl: string
): Promise<boolean>

/**
 * Complete workflow to generate, store, and update database with PDF link
 * @param type The type of document ('invoice', 'purchaseOrder', 'estimate')
 * @param data The document data
 * @param saveLocally Whether to also save the PDF locally
 * @returns The URL of the uploaded PDF or null if any step failed
 */
generateAndStorePDF(
  type: 'invoice' | 'purchaseOrder' | 'estimate',
  data: Invoice | PurchaseOrder | Estimate,
  saveLocally?: boolean
): Promise<string | null>
```

## Updated usePDFOperations Hook

The `usePDFOperations` hook has been updated to provide a more streamlined API for PDF operations:

```typescript
/**
 * Hook for PDF operations including generation, storage, and downloading
 * 
 * @returns Object containing PDF operation functions and loading states
 */
export const usePDFOperations = () => {
  // States for tracking operations
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStoring, setIsStoring] = useState(false);

  /**
   * Generates a PDF document based on the document type and data
   * @param documentType The type of document (invoice, purchaseOrder, estimate)
   * @param document The document data to generate the PDF from
   * @param downloadAfterGeneration Whether to download the PDF after generation
   * @returns The URL of the generated PDF or null if generation failed
   */
  const generatePDF = async (
    documentType: DocumentType,
    document: any,
    downloadAfterGeneration: boolean = false
  ): Promise<string | null> => {
    // Implementation details...
  };

  /**
   * Downloads a PDF from a URL
   * @param url The URL of the PDF to download
   * @param fileName The name to save the file as
   */
  const downloadPDF = async (url: string, fileName: string): Promise<void> => {
    // Implementation details...
  };

  return {
    generatePDF,
    downloadPDF,
    isGenerating,
    isStoring
  };
};
```

### Example Usage

```typescript
import { usePDFOperations } from '@/hooks/pdf/usePDFOperations';

function YourComponent() {
  const { generatePDF, downloadPDF, isGenerating, isStoring } = usePDFOperations();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  const handleGeneratePDF = async () => {
    try {
      const url = await generatePDF('invoice', invoiceData, false);
      if (url) {
        setPdfUrl(url);
        // Update your component state or database as needed
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };
  
  const handleDownloadPDF = async () => {
    if (!pdfUrl) return;
    
    try {
      await downloadPDF(pdfUrl, 'invoice.pdf');
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };
  
  return (
    <div>
      <button onClick={handleGeneratePDF} disabled={isGenerating || isStoring}>
        {isGenerating ? 'Generating...' : 'Generate PDF'}
      </button>
      {pdfUrl && (
        <button onClick={handleDownloadPDF}>
          Download PDF
        </button>
      )}
    </div>
  );
}
```

## PDFActions Component

The `PDFActions` component provides a unified interface for PDF operations:

```typescript
/**
 * PDFActions component provides buttons for PDF operations
 * 
 * @param documentType - Type of document (invoice, purchaseOrder, estimate)
 * @param document - The document data
 * @param showLabels - Whether to show text labels on buttons
 * @param onPDFGenerated - Callback when PDF is generated
 * @param rest - Other button props
 */
export const PDFActions: React.FC<PDFActionsProps> = ({
  documentType,
  document,
  showLabels = false,
  onPDFGenerated,
  ...rest
}) => {
  // Implementation details...
};
```

### Example Usage

```tsx
import { PDFActions } from '@/components/pdf/PDFActions';

function InvoiceDetailView({ invoice }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(invoice.supabase_pdf_url || null);
  
  return (
    <div className="flex space-x-2">
      <PDFActions 
        documentType="invoice"
        document={invoice}
        variant="outline"
        size="sm"
        showLabels={true}
        onPDFGenerated={(url) => setPdfUrl(url)}
      />
    </div>
  );
}
```

## Database Integration

The PDF system integrates with Supabase for storage and database updates:

1. PDFs are stored in the Supabase storage bucket under the following paths:
   - `documents/Invoices/[filename].pdf`
   - `documents/PurchaseOrders/[filename].pdf`
   - `documents/Estimates/[filename].pdf`

2. PDF URLs are stored in the database in the following fields:
   - `gl_invoices.supabase_pdf_url`
   - `gl_purchase_orders.supabase_pdf_url`
   - `gl_estimates.supabase_pdf_url`

3. The `updatePDFLinkInDatabase` function handles updating the correct field based on the document type.

## Error Handling

The PDF system includes comprehensive error handling:

1. All PDF operations are wrapped in try/catch blocks
2. Errors are logged to the console for debugging
3. User-friendly error messages are displayed using the toast system
4. Loading states are provided to indicate when operations are in progress

## Best Practices

When working with the PDF system, follow these best practices:

1. Always check for existing PDFs before generating new ones
2. Use the `supabase_pdf_url` field to store and retrieve PDF URLs
3. Provide meaningful filenames for better organization
4. Handle loading states to provide feedback to users
5. Implement proper error handling to gracefully handle failures
6. Use the PDFActions component for a consistent user interface

## Troubleshooting

Common issues and solutions:

1. **PDF not generating**: Check console for errors, ensure document data is complete
2. **PDF not storing**: Verify Supabase storage permissions and bucket configuration
3. **PDF URL not updating**: Check database update logic and field names
4. **PDF not downloading**: Ensure the URL is accessible and CORS is properly configured
5. **PDF rendering issues**: Check the PDF generation logic for the specific document type

## Batch PDF Generation

For generating multiple PDFs at once, use the `BatchPDFGenerator` component:

```tsx
import { BatchPDFGenerator } from '@/components/pdf/batch-pdf-generator';

// Example usage
<BatchPDFGenerator 
  documentType="invoice" 
  documents={invoices.map(inv => ({ 
    id: inv.id, 
    name: inv.invoice_uid, 
    date: inv.invoice_order_date 
  }))} 
  onComplete={(results) => console.log('Batch complete:', results)} 
/>
```

## Implementation Examples

### Adding PDF Actions to a Detail Page

```tsx
import { PDFActions } from '@/components/pdf/PDFActions';

function InvoiceDetailPage({ invoice }) {
  return (
    <div>
      <div className="flex justify-between items-center">
        <h1>Invoice {invoice.invoice_uid}</h1>
        <PDFActions 
          documentType="invoice" 
          document={invoice} 
        />
      </div>
      {/* Rest of invoice detail */}
    </div>
  );
}
```

### Adding a PDF Button to a Table Row

```tsx
import { PDFButton } from '@/components/pdf/PDFButton';

function InvoiceRow({ invoice }) {
  return (
    <tr>
      <td>{invoice.invoice_uid}</td>
      <td>{invoice.gl_accounts?.account_name}</td>
      <td>{formatDate(invoice.invoice_order_date)}</td>
      <td>{formatCurrency(invoice.total_amount)}</td>
      <td>
        <PDFButton 
          documentType="invoice" 
          document={invoice} 
          action="view" 
          size="sm" 
          variant="ghost" 
        />
      </td>
    </tr>
  );
}
```

### Programmatically Generating a PDF

```tsx
import { usePDFOperations } from '@/hooks/pdf/usePDFOperations';

function YourComponent({ invoice }) {
  const { generatePDF } = usePDFOperations();
  
  const handleGeneratePDF = async () => {
    const pdfUrl = await generatePDF('invoice', invoice);
    if (pdfUrl) {
      console.log('PDF generated:', pdfUrl);
    }
  };
  
  return (
    <button onClick={handleGeneratePDF}>
      Generate PDF
    </button>
  );
}
