
import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Edit, FileText, PlusCircle, Trash2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Estimate, EstimateLine, CustomerCredit } from '@/types/estimate';
import { formatCurrency, formatDate } from '@/utils/format-utils';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EstimateLineForm from './EstimateLineForm';
import CustomerCreditForm from './CustomerCreditForm';
import EstimateDialog from './EstimateDialog';

interface EstimateDetailProps {
  estimate: Estimate;
  onBack: () => void;
  onRefresh: () => void;
  onUpdate: (id: string, data: Partial<Estimate>) => Promise<Estimate | null>;
  onDelete: (id: string) => Promise<boolean>;
  onAddLine: (estimateGlideId: string, data: Partial<EstimateLine>) => Promise<EstimateLine | null>;
  onUpdateLine: (lineId: string, data: Partial<EstimateLine>) => Promise<EstimateLine | null>;
  onDeleteLine: (lineId: string) => Promise<boolean>;
  onAddCredit: (estimateGlideId: string, data: Partial<CustomerCredit>) => Promise<CustomerCredit | null>;
  onUpdateCredit: (creditId: string, data: Partial<CustomerCredit>) => Promise<CustomerCredit | null>;
  onDeleteCredit: (creditId: string) => Promise<boolean>;
  onConvertToInvoice: (id: string) => Promise<any>;
}

const EstimateDetail: React.FC<EstimateDetailProps> = ({
  estimate,
  onBack,
  onRefresh,
  onUpdate,
  onDelete,
  onAddLine,
  onUpdateLine,
  onDeleteLine,
  onAddCredit,
  onUpdateCredit,
  onDeleteCredit,
  onConvertToInvoice
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddLineOpen, setIsAddLineOpen] = useState(false);
  const [currentLine, setCurrentLine] = useState<EstimateLine | null>(null);
  const [isAddCreditOpen, setIsAddCreditOpen] = useState(false);
  const [currentCredit, setCurrentCredit] = useState<CustomerCredit | null>(null);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'converted':
        return 'success';
      case 'pending':
        return 'warning';
      case 'draft':
      default:
        return 'secondary';
    }
  };

  const formatDateString = (dateString?: string) => {
    if (!dateString) return 'No date';
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const handleEditEstimate = async (data: Partial<Estimate>) => {
    const updated = await onUpdate(estimate.id, data);
    if (updated) {
      onRefresh();
    }
    setIsEditDialogOpen(false);
  };

  const handleDeleteEstimate = async () => {
    const success = await onDelete(estimate.id);
    if (success) {
      onBack();
    }
    setIsDeleteDialogOpen(false);
  };

  const handleAddEditLine = async (data: Partial<EstimateLine>) => {
    if (currentLine) {
      await onUpdateLine(currentLine.id, data);
    } else {
      await onAddLine(estimate.glide_row_id, data);
    }
    setCurrentLine(null);
    setIsAddLineOpen(false);
    onRefresh();
  };

  const handleDeleteLine = async (lineId: string) => {
    if (confirm('Are you sure you want to delete this line item?')) {
      await onDeleteLine(lineId);
      onRefresh();
    }
  };

  const handleAddEditCredit = async (data: Partial<CustomerCredit>) => {
    if (currentCredit) {
      await onUpdateCredit(currentCredit.id, data);
    } else {
      await onAddCredit(estimate.glide_row_id, data);
    }
    setCurrentCredit(null);
    setIsAddCreditOpen(false);
    onRefresh();
  };

  const handleDeleteCredit = async (creditId: string) => {
    if (confirm('Are you sure you want to delete this credit?')) {
      await onDeleteCredit(creditId);
      onRefresh();
    }
  };

  const handleConvertToInvoice = async () => {
    await onConvertToInvoice(estimate.id);
    setIsConvertDialogOpen(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Estimates
        </Button>
        
        <div className="flex gap-2">
          {estimate.status !== 'converted' && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </>
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <div>
              <CardTitle className="text-2xl">
                Estimate #{estimate.glide_row_id?.substring(4)}
              </CardTitle>
              <CardDescription>
                Created on {formatDateString(estimate.created_at)}
              </CardDescription>
            </div>
            <Badge variant={getStatusBadge(estimate.status)} className="h-fit">
              {estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
              <div className="flex items-start">
                <User className="h-4 w-4 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">{estimate.accountName || 'No customer assigned'}</p>
                  {estimate.account && estimate.account.email_of_who_added && (
                    <p className="text-sm text-muted-foreground">{estimate.account.email_of_who_added}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Estimate Details</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Date:</span>
                  <span className="text-sm font-medium">{formatDateString(estimate.estimate_date)}</span>
                </div>
                {estimate.is_a_sample && (
                  <div className="flex justify-between">
                    <span className="text-sm">Sample:</span>
                    <span className="text-sm font-medium">Yes</span>
                  </div>
                )}
                {estimate.rowid_invoices && (
                  <div className="flex justify-between">
                    <span className="text-sm">Invoice:</span>
                    <span className="text-sm font-medium">{estimate.rowid_invoices}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-xl font-semibold">{formatCurrency(estimate.total_amount)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Credits Applied</p>
              <p className="text-xl font-semibold">{formatCurrency(estimate.total_credits)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="text-xl font-semibold">{formatCurrency(estimate.balance)}</p>
            </div>
          </div>
          
          <Tabs defaultValue="items" className="w-full">
            <TabsList>
              <TabsTrigger value="items">Line Items</TabsTrigger>
              <TabsTrigger value="credits">Credits</TabsTrigger>
            </TabsList>
            
            <TabsContent value="items" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Items</h3>
                {estimate.status !== 'converted' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setCurrentLine(null);
                      setIsAddLineOpen(true);
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                )}
              </div>
              
              {(!estimate.estimateLines || estimate.estimateLines.length === 0) ? (
                <div className="text-center py-4 text-muted-foreground">
                  No items added to this estimate.
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-2 text-left font-medium">Item</th>
                        <th className="px-4 py-2 text-right font-medium">Qty</th>
                        <th className="px-4 py-2 text-right font-medium">Price</th>
                        <th className="px-4 py-2 text-right font-medium">Total</th>
                        {estimate.status !== 'converted' && (
                          <th className="px-4 py-2 text-right font-medium">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {estimate.estimateLines.map((line) => (
                        <tr key={line.id} className="border-b">
                          <td className="px-4 py-2">
                            <div>
                              <p className="font-medium">{line.sale_product_name}</p>
                              {line.productDetails && (
                                <div className="flex items-center gap-2 mt-1">
                                  {line.productDetails.product_image1 && (
                                    <img 
                                      src={line.productDetails.product_image1} 
                                      alt={line.productDetails.name} 
                                      className="h-8 w-8 rounded object-cover"
                                    />
                                  )}
                                  <div className="text-xs text-muted-foreground">
                                    {line.productDetails.category && (
                                      <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-xs mr-1">
                                        {line.productDetails.category}
                                      </span>
                                    )}
                                    {line.productDetails.vendor_product_name && 
                                      line.productDetails.vendor_product_name !== line.sale_product_name && (
                                      <span>Original: {line.productDetails.vendor_product_name}</span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {line.product_sale_note && (
                                <p className="text-xs text-muted-foreground mt-1">{line.product_sale_note}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right">{line.qty_sold}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(line.selling_price)}</td>
                          <td className="px-4 py-2 text-right font-medium">{formatCurrency(line.line_total)}</td>
                          {estimate.status !== 'converted' && (
                            <td className="px-4 py-2 text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setCurrentLine(line);
                                    setIsAddLineOpen(true);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteLine(line.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="credits" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Credits</h3>
                {estimate.status !== 'converted' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setCurrentCredit(null);
                      setIsAddCreditOpen(true);
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" /> Add Credit
                  </Button>
                )}
              </div>
              
              {(!estimate.credits || estimate.credits.length === 0) ? (
                <div className="text-center py-4 text-muted-foreground">
                  No credits applied to this estimate.
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-2 text-left font-medium">Date</th>
                        <th className="px-4 py-2 text-left font-medium">Type</th>
                        <th className="px-4 py-2 text-left font-medium">Note</th>
                        <th className="px-4 py-2 text-right font-medium">Amount</th>
                        {estimate.status !== 'converted' && (
                          <th className="px-4 py-2 text-right font-medium">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {estimate.credits.map((credit) => (
                        <tr key={credit.id} className="border-b">
                          <td className="px-4 py-2">
                            {credit.date_of_payment ? formatDateString(credit.date_of_payment) : 'No date'}
                          </td>
                          <td className="px-4 py-2">
                            <Badge variant="secondary">
                              {credit.payment_type || 'Credit'}
                            </Badge>
                          </td>
                          <td className="px-4 py-2">{credit.payment_note || '-'}</td>
                          <td className="px-4 py-2 text-right font-medium">{formatCurrency(credit.payment_amount)}</td>
                          {estimate.status !== 'converted' && (
                            <td className="px-4 py-2 text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setCurrentCredit(credit);
                                    setIsAddCreditOpen(true);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteCredit(credit.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Last updated: {formatDate(estimate.updated_at)}
          </div>
          
          {estimate.status !== 'converted' && (
            <Button 
              disabled={estimate.estimateLines?.length === 0}
              onClick={() => setIsConvertDialogOpen(true)}
            >
              <FileText className="h-4 w-4 mr-1" /> Convert to Invoice
            </Button>
          )}
          
          {estimate.status === 'converted' && estimate.rowid_invoices && (
            <div className="flex items-center text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4 mr-1" /> 
              Converted to Invoice #{estimate.rowid_invoices.substring(4)}
            </div>
          )}
        </CardFooter>
      </Card>
      
      <EstimateDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleEditEstimate}
        estimate={estimate}
        title="Edit Estimate"
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the estimate and all associated line items and credits.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEstimate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={isAddLineOpen} onOpenChange={setIsAddLineOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentLine ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>
          <EstimateLineForm
            estimateLine={currentLine || undefined}
            onSubmit={handleAddEditLine}
            onCancel={() => {
              setCurrentLine(null);
              setIsAddLineOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAddCreditOpen} onOpenChange={setIsAddCreditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentCredit ? 'Edit Credit' : 'Add Credit'}</DialogTitle>
          </DialogHeader>
          <CustomerCreditForm
            credit={currentCredit || undefined}
            onSubmit={handleAddEditCredit}
            onCancel={() => {
              setCurrentCredit(null);
              setIsAddCreditOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new invoice with all the line items from this estimate.
              The estimate will be marked as converted and can no longer be edited.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvertToInvoice}>
              Convert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EstimateDetail;
