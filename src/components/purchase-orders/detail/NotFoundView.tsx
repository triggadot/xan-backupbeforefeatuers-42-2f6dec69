
import { Button } from '@/components/ui/button';

interface NotFoundViewProps {
  onBack: () => void;
}

export function NotFoundView({ onBack }: NotFoundViewProps) {
  return (
    <div className="container py-6 max-w-5xl text-center">
      <h2 className="text-2xl font-bold mb-4">Purchase Order Not Found</h2>
      <p className="text-muted-foreground mb-6">The purchase order you're looking for doesn't exist or has been deleted.</p>
      <Button 
        onClick={onBack}
        className="text-primary hover:underline"
      >
        Return to Purchase Order List
      </Button>
    </div>
  );
}
