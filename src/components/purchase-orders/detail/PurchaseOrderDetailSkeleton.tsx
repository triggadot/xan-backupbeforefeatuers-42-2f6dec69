
import { Skeleton } from '@/components/ui/skeleton';

export function PurchaseOrderDetailSkeleton() {
  return (
    <div className="container py-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Skeleton className="h-[400px] mb-6" />
      <Skeleton className="h-[200px]" />
    </div>
  );
}
