import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useProductApprovalQueue, useApproveProduct, useRejectProduct, useBatchApprovalOperations, useCreateProductFromQueue } from '@/hooks/telegram/useProductApprovalQueue';
import { DraggableApprovalQueue } from '../components/DraggableApprovalQueue';
import { BatchApprovalPanel } from '../components/BatchApprovalPanel';
import { ProductCreationForm } from '../components/ProductCreationForm';
import { ProductDetailView } from '../components/ProductDetailView';
import { ApprovalStatus, NewProductData, ProductMatch } from '@/types/telegram/product-matching';
import { LucideIcon, Search, Filter, RefreshCw } from 'lucide-react';

export const ProductMatchingDashboard: React.FC = () => {
  // State for filtering and pagination
  const [status, setStatus] = useState<ApprovalStatus>('pending');
  const [search, setSearch] = useState('');
  const [limit] = useState(30);
  const [offset, setOffset] = useState(0);
  
  // State for detail views and selection
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [detailItem, setDetailItem] = useState<{ id: string } | null>(null);
  const [createProductItem, setCreateProductItem] = useState<{ id: string } | null>(null);
  
  // Simulated potential matches (in a real app, this would come from the backend)
  const [potentialMatches, setPotentialMatches] = useState<Record<string, ProductMatch[]>>({});
  
  // Query hooks
  const { data, isLoading, isError, error, refetch } = useProductApprovalQueue({
    status,
    limit,
    offset,
    search: search || undefined,
  });
  
  // Mutation hooks
  const approveProduct = useApproveProduct();
  const rejectProduct = useRejectProduct();
  const batchOperations = useBatchApprovalOperations();
  const createProduct = useCreateProductFromQueue();
  
  // Find the detailed item from the queue
  const detailedQueueItem = data?.items.find(item => item.id === detailItem?.id) || null;
  const createProductQueueItem = data?.items.find(item => item.id === createProductItem?.id) || null;
  
  // Paginated items
  const items = data?.items || [];
  const totalItems = data?.total_count || 0;
  
  // Handler for item selection
  const handleSelectItem = (id: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    }
  };
  
  // Handler for select all
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedItems(items.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };
  
  // Handler for approve
  const handleApprove = (id: string, productId: string) => {
    approveProduct.mutate({ queueId: id, productId }, {
      onSuccess: () => {
        setDetailItem(null);
        setSelectedItems(prev => prev.filter(itemId => itemId !== id));
      }
    });
  };
  
  // Handler for reject
  const handleReject = (id: string, reason?: string) => {
    rejectProduct.mutate({ queueId: id, reason }, {
      onSuccess: () => {
        setDetailItem(null);
        setSelectedItems(prev => prev.filter(itemId => itemId !== id));
      }
    });
  };
  
  // Handler for batch approve
  const handleBatchApprove = (ids: string[], productId: string) => {
    batchOperations.mutate({ queueIds: ids, action: 'approve', productId }, {
      onSuccess: () => {
        setSelectedItems([]);
      }
    });
  };
  
  // Handler for batch reject
  const handleBatchReject = (ids: string[], reason?: string) => {
    batchOperations.mutate({ queueIds: ids, action: 'reject', reason }, {
      onSuccess: () => {
        setSelectedItems([]);
      }
    });
  };
  
  // Handler for creating a new product
  const handleCreateProduct = (queueId: string, productData: NewProductData) => {
    createProduct.mutate({ queueId, productData }, {
      onSuccess: () => {
        setCreateProductItem(null);
        setSelectedItems(prev => prev.filter(itemId => itemId !== queueId));
      }
    });
  };

  // Clear selection when status changes
  React.useEffect(() => {
    setSelectedItems([]);
    setOffset(0);
  }, [status]);

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Matching</h1>
          <p className="text-muted-foreground mt-1">
            Match Telegram media with products or create new ones
          </p>
        </div>
        
        <Button 
          onClick={() => refetch()} 
          variant="outline"
          className="gap-1"
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Filters */}
        <Card className="w-full md:w-64">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="search" className="text-sm font-medium">
                  Search
                </label>
                <div className="relative mt-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Product or vendor name"
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">
                  Status
                </label>
                <Tabs defaultValue={status} className="mt-1" onValueChange={(value) => setStatus(value as ApprovalStatus)}>
                  <TabsList className="grid grid-cols-2 h-auto">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                  </TabsList>
                  <TabsList className="grid grid-cols-2 h-auto mt-1">
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    <TabsTrigger value="auto_matched">Auto</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Bulk Selection
                  </label>
                  <Button 
                    variant="ghost" 
                    className="h-8 px-2" 
                    onClick={() => setSelectedItems([])}
                    disabled={selectedItems.length === 0}
                  >
                    Clear
                  </Button>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Checkbox 
                    id="selectAll" 
                    checked={selectedItems.length > 0 && selectedItems.length === items.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <label
                    htmlFor="selectAll"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select All Items ({items.length})
                  </label>
                </div>
              </div>
              
              {/* Batch operations panel */}
              {selectedItems.length > 0 && (
                <BatchApprovalPanel 
                  selectedItems={selectedItems}
                  items={items}
                  onApproveAll={handleBatchApprove}
                  onRejectAll={handleBatchReject}
                  isProcessing={batchOperations.isLoading}
                />
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex-1">
          {/* Main Content */}
          {isLoading ? (
            <div className="flex items-center justify-center h-80">
              <Spinner size="lg" />
            </div>
          ) : isError ? (
            <Card className="w-full p-6 text-center">
              <p className="text-destructive">Error loading items: {(error as Error)?.message || 'Unknown error'}</p>
              <Button onClick={() => refetch()} className="mt-4">
                Try Again
              </Button>
            </Card>
          ) : (
            <>
              <div className="bg-background p-1 rounded-md">
                <Tabs defaultValue="grid" className="w-full">
                  <div className="flex justify-between items-center mb-4">
                    <TabsList>
                      <TabsTrigger value="grid">Grid View</TabsTrigger>
                      <TabsTrigger value="drag">Drag & Drop</TabsTrigger>
                    </TabsList>
                    
                    <div className="text-sm text-muted-foreground">
                      Showing {items.length} of {totalItems} items
                    </div>
                  </div>
                  
                  <TabsContent value="grid" className="mt-0">
                    {items.length === 0 ? (
                      <Card className="w-full p-6 text-center">
                        <p className="text-muted-foreground">No items found for the selected filters</p>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {items.map((item) => (
                          <Card 
                            key={item.id} 
                            className={`group overflow-hidden transition-all duration-200 ${selectedItems.includes(item.id) ? 'ring-2 ring-primary' : ''}`}
                          >
                            <CardHeader className="p-3 pb-0 flex flex-row items-start gap-2">
                              <div className="flex items-center">
                                <Checkbox 
                                  checked={selectedItems.includes(item.id)} 
                                  onCheckedChange={(checked) => handleSelectItem(item.id, Boolean(checked))}
                                  className="data-[state=checked]:bg-primary" 
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium truncate">
                                  {item.suggested_product_name || 'Unnamed Product'}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </CardHeader>

                            <div 
                              className="p-3 cursor-pointer"
                              onClick={() => setDetailItem({ id: item.id })}
                            >
                              {item.message_details?.public_url && (
                                <div className="relative aspect-square w-full mb-2 rounded-md overflow-hidden bg-muted">
                                  <img 
                                    src={item.message_details.public_url} 
                                    alt={item.suggested_product_name || 'Product image'}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}

                              <div className="space-y-1 text-sm">
                                {item.suggested_vendor_uid && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Vendor:</span>
                                    <span className="font-medium truncate max-w-[60%] text-right">{item.suggested_vendor_uid}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <CardContent className="p-3 pt-0 flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => setCreateProductItem({ id: item.id })}
                              >
                                Create
                              </Button>
                              {item.best_match_product_id && (
                                <Button 
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleApprove(item.id, item.best_match_product_id!)}
                                  disabled={approveProduct.isLoading}
                                >
                                  Approve
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="drag" className="mt-0">
                    <DraggableApprovalQueue 
                      items={items}
                      potentialMatches={potentialMatches}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onCreateProduct={handleCreateProduct}
                      isProcessing={approveProduct.isLoading || rejectProduct.isLoading}
                    />
                  </TabsContent>
                </Tabs>
                
                {/* Pagination */}
                {totalItems > limit && (
                  <div className="flex justify-between items-center mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                      disabled={offset === 0}
                    >
                      Previous
                    </Button>
                    
                    <span className="text-sm text-muted-foreground">
                      {offset + 1}-{Math.min(offset + limit, totalItems)} of {totalItems}
                    </span>
                    
                    <Button
                      variant="outline"
                      onClick={() => setOffset(offset + limit)}
                      disabled={offset + limit >= totalItems}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Detail View Dialog */}
      {detailedQueueItem && (
        <ProductDetailView 
          item={detailedQueueItem}
          isOpen={!!detailedQueueItem}
          onClose={() => setDetailItem(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          isProcessing={approveProduct.isLoading || rejectProduct.isLoading}
          potentialMatches={potentialMatches[detailedQueueItem.id] || []}
        />
      )}
      
      {/* Create Product Dialog */}
      {createProductQueueItem && (
        <ProductCreationForm
          queueItem={createProductQueueItem}
          isOpen={!!createProductQueueItem}
          onClose={() => setCreateProductItem(null)}
          onSubmit={handleCreateProduct}
          isSubmitting={createProduct.isLoading}
        />
      )}
    </div>
  );
};
