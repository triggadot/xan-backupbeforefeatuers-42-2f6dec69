
import { Button } from '@/components/ui/button';
import { FileX } from 'lucide-react';

interface NotFoundViewProps {
  onBack: () => void;
}

export function NotFoundView({ onBack }: NotFoundViewProps) {
  return (
    <div className="container py-12 max-w-5xl text-center">
      <div className="mb-6 flex justify-center">
        <FileX className="h-24 w-24 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-4">Purchase Order Not Found</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        The purchase order you're looking for doesn't exist or has been deleted. 
        Please return to the purchase orders list to find the correct order.
      </p>
      <Button 
        onClick={onBack}
        size="lg"
      >
        Return to Purchase Order List
      </Button>
    </div>
  );
}
