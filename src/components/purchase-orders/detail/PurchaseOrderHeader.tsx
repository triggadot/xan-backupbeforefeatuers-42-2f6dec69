
import { ArrowLeft, Calendar, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '../../invoices/shared/StatusBadge';
import { PurchaseOrder } from '@/types/purchaseOrder';

interface PurchaseOrderHeaderProps {
  purchaseOrder: PurchaseOrder;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const PurchaseOrderHeader = ({ purchaseOrder, onBack, onEdit, onDelete }: PurchaseOrderHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">PO #{purchaseOrder.number}</h1>
            <StatusBadge status={purchaseOrder.status} />
          </div>
          <div className="text-sm text-muted-foreground flex items-center mt-1">
            <Calendar className="h-3 w-3 mr-1" />
            Created on {new Date(purchaseOrder.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Purchase Order
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Purchase Order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
