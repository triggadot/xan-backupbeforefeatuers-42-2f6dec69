"use client";

import { useState, useMemo } from "react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DownloadIcon, 
  FileTextIcon, 
  SearchIcon, 
  XIcon 
} from "lucide-react";
import { StandardPDFButton } from "@/components/pdf/StandardPDFButton";
import { DocumentType } from "@/types/documents/pdf.unified";
import { PDFPreviewModal } from "@/components/pdf/PDFPreviewModal";

interface Product {
  id: string;
  glide_row_id: string;
  vendor_product_name: string | null;
  new_product_name: string | null;
  total_qty_purchased: number | null;
  cost: number | null;
  display_name: string;
}

interface Account {
  id: string;
  glide_row_id: string;
  account_name: string | null;
  client_type: string | null;
  accounts_uid: string;
  photo: string | null;
}

interface PurchaseOrder {
  id: string;
  glide_row_id: string;
  po_date: string | null;
  rowid_accounts: string | null;
  purchase_order_uid: string | null;
  pdf_link: string | null;
  total_amount: number | null;
  total_paid: number | null;
  balance: number | null;
  payment_status: string | null;
  product_count: number | null;
  account?: Account;
  products?: Product[];
}

interface PurchaseOrderTableProps {
  purchaseOrders: PurchaseOrder[];
  onViewPdf?: (purchaseOrder: PurchaseOrder) => void;
  onDownloadPdf?: (purchaseOrder: PurchaseOrder) => void;
}

export function PurchaseOrderTable({
  purchaseOrders,
  onViewPdf,
  onDownloadPdf,
}: PurchaseOrderTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPO, setExpandedPO] = useState<string | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const filteredPurchaseOrders = useMemo(() => {
    if (!searchTerm) return purchaseOrders;
    
    return purchaseOrders.filter((po) => {
      const searchString = [
        po.purchase_order_uid,
        po.account?.account_name,
        po.payment_status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      
      return searchString.includes(searchTerm.toLowerCase());
    });
  }, [purchaseOrders, searchTerm]);

  const toggleExpandPO = (poId: string) => {
    setExpandedPO(expandedPO === poId ? null : poId);
  };

  const getStatusBadgeClass = (status: string | null) => {
    if (!status) return "";
    
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "partial":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "unpaid":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "draft":
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const handleViewPdf = (po: PurchaseOrder) => {
    if (po.pdf_link) {
      setPreviewPdfUrl(po.pdf_link);
      setShowPdfPreview(true);
    } else if (onViewPdf) {
      onViewPdf(po);
    }
  };

  const handlePdfSuccess = (poId: string, url: string) => {
    const updatedPO = purchaseOrders.find(po => po.id === poId);
    if (updatedPO) {
      updatedPO.pdf_link = url;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Purchase Orders</h2>
        <div className="relative w-64">
          <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search purchase orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-8"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">PO #</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPurchaseOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No purchase orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPurchaseOrders.map((po) => (
                <>
                  <TableRow 
                    key={po.id} 
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      expandedPO === po.id && "bg-muted/50"
                    )}
                    onClick={() => toggleExpandPO(po.id)}
                  >
                    <TableCell className="font-medium">{po.purchase_order_uid}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={po.account?.photo || ""} alt={po.account?.account_name || ""} />
                          <AvatarFallback>
                            {po.account?.account_name?.substring(0, 2).toUpperCase() || "VN"}
                          </AvatarFallback>
                        </Avatar>
                        <span>{po.account?.account_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(po.po_date as string)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(po.payment_status)}>
                        {po.payment_status || "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(po.total_amount || 0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(po.balance || 0)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        {po.pdf_link ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPdf(po)}
                              className="h-8 w-8 p-0"
                            >
                              <FileTextIcon className="h-4 w-4" />
                              <span className="sr-only">View PDF</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDownloadPdf?.(po)}
                              className="h-8 w-8 p-0"
                            >
                              <DownloadIcon className="h-4 w-4" />
                              <span className="sr-only">Download PDF</span>
                            </Button>
                          </>
                        ) : (
                          <StandardPDFButton
                            documentType={DocumentType.PURCHASE_ORDER}
                            documentId={po.id}
                            action="download"
                            onPDFGenerated={(url) => handlePdfSuccess(po.id, url)}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            showLabel={false}
                          >
                            <FileTextIcon className="h-4 w-4" />
                            <span className="sr-only">Generate PDF</span>
                          </StandardPDFButton>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedPO === po.id && po.products && po.products.length > 0 && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={7} className="p-0">
                        <div className="px-4 py-2">
                          <h4 className="mb-2 font-medium">Products</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {po.products.map((product) => (
                                <TableRow key={product.id}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{product.new_product_name}</div>
                                      {product.vendor_product_name && product.vendor_product_name !== product.new_product_name && (
                                        <div className="text-sm text-muted-foreground">
                                          {product.vendor_product_name}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">{product.total_qty_purchased}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(product.cost || 0)}</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency((product.total_qty_purchased || 0) * (product.cost || 0))}
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow>
                                <TableCell colSpan={3} className="text-right font-medium">
                                  Total
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(po.total_amount || 0)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {showPdfPreview && previewPdfUrl && (
        <PDFPreviewModal
          pdfUrl={previewPdfUrl}
          isOpen={showPdfPreview}
          onClose={() => setShowPdfPreview(false)}
          title="Purchase Order PDF"
        />
      )}
    </div>
  );
}
