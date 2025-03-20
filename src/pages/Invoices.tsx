
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useInvoices } from '@/hooks/invoices/useInvoices';
import { InvoiceFilterBar } from '@/components/invoices/list/InvoiceFilters';
import { InvoiceTable } from '@/components/invoices/list/InvoiceTable';
import { InvoiceForm } from '@/components/invoices/form/InvoiceForm';
import { DeleteConfirmDialog } from '@/components/invoices/detail/DeleteConfirmDialog';
import { InvoiceListItem, InvoiceFilters } from '@/types/invoice';

const InvoicesPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceListItem | null>(null);
  
  const { invoices, isLoading, deleteInvoice } = useInvoices(filters);

  const handleCreateSuccess = (invoiceId: string) => {
    setIsCreateDialogOpen(false);
    navigate(`/invoices/${invoiceId}`);
  };

  const handleEditInvoice = (invoice: InvoiceListItem) => {
    navigate(`/invoices/${invoice.id}/edit`);
  };

  const handleDeleteInvoice = (invoice: InvoiceListItem) => {
    setSelectedInvoice(invoice);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedInvoice) return;
    
    await deleteInvoice(selectedInvoice.id);
    setIsDeleteDialogOpen(false);
    setSelectedInvoice(null);
  };

  return (
    <div className="container py-6 max-w-7xl">
      <div className="space-y-6">
        <InvoiceFilterBar 
          filters={filters}
          onFiltersChange={setFilters}
        />
        
        <InvoiceTable 
          data={invoices}
          onEdit={handleEditInvoice}
          onDelete={handleDeleteInvoice}
          onCreateInvoice={() => setIsCreateDialogOpen(true)}
        />
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>
          <InvoiceForm onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice #${selectedInvoice?.invoiceNumber || ''}? This action cannot be undone and will remove all associated line items and payments.`}
      />
    </div>
  );
};

export default InvoicesPage;
