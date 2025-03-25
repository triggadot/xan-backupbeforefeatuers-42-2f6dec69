import { Card } from '@/components/ui/card';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

interface VendorDetailsCardProps {
  purchaseOrder: PurchaseOrder;
}

export function VendorDetailsCard({ purchaseOrder }: VendorDetailsCardProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Vendor Details</h3>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <p className="font-medium">{purchaseOrder.vendorName || 'Unknown Vendor'}</p>
        </div>
        
        {purchaseOrder.vendor && (
          <>
            {purchaseOrder.vendor.email_of_who_added && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{purchaseOrder.vendor.email_of_who_added}</p>
              </div>
            )}
            
            {purchaseOrder.vendor.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{purchaseOrder.vendor.phone}</p>
              </div>
            )}
            
            {purchaseOrder.vendor.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">{purchaseOrder.vendor.address}</p>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
