
import { useParams } from 'react-router-dom';
import { usePurchaseOrderDetail } from '@/hooks/purchase-orders';
import PurchaseOrderDetailView from '@/components/new/purchase-orders/purchase-order-detail-view';
import { useToast } from '@/hooks/utils/use-toast';
import { Container } from '@/components/ui/container';
import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/spinner';

const PurchaseOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { purchaseOrder, isLoading, error, fetchPurchaseOrderDetail } = usePurchaseOrderDetail(id || '');

  const handleRefresh = () => {
    fetchPurchaseOrderDetail(id || '');
    toast({
      title: 'Refreshed',
      description: 'Purchase order data has been refreshed.',
    });
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      transition: { duration: 0.3 } 
    }
  };

  if (isLoading) {
    return (
      <Container fluid mobileBottomSpace>
        <motion.div 
          className="flex justify-center items-center min-h-[30vh]" 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <Spinner size="lg" />
        </motion.div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid mobileBottomSpace>
        <motion.div 
          className="bg-destructive/10 p-3 rounded-md text-destructive mt-3"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <p>Error loading purchase order: {error}</p>
        </motion.div>
      </Container>
    );
  }

  if (!purchaseOrder) {
    return (
      <Container fluid mobileBottomSpace>
        <motion.div 
          className="bg-muted p-3 rounded-md text-muted-foreground mt-3"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <p>Purchase order not found</p>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container fluid mobileBottomSpace>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="mobile-spacing"
      >
        {purchaseOrder && (
          <PurchaseOrderDetailView
            purchaseOrder={purchaseOrder}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        )}
      </motion.div>
    </Container>
  );
};

export default PurchaseOrderDetail;
