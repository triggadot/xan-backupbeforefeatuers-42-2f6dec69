
import { Card } from '@/components/ui/card';
import { PurchaseOrder } from '@/types/purchaseOrder';

interface VendorDetailsCardProps {
  purchaseOrder: PurchaseOrder;
}

export function VendorDetailsCard({ purchaseOrder }: VendorDetailsCardProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium mb-4">Vendor Details</h3>
      <p className="font-medium">{purchaseOrder.vendorName}</p>
      {purchaseOrder.vendor && (
        <>
          {/* Add vendor details if available */}
        </>
      )}
    </Card>
  );
}
