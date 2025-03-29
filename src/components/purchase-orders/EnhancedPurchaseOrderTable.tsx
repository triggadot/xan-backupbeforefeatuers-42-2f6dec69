"use client";

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn, formatCurrency } from "@/lib/utils";
import { PurchaseOrder } from "@/types/purchaseOrder";
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
  XIcon,
  EyeIcon,
  EditIcon
} from "lucide-react";

interface EnhancedPurchaseOrderTableProps {
  purchaseOrders: PurchaseOrder[];
  isLoading?: boolean;
  onViewPdf?: (purchaseOrder: PurchaseOrder) => void;
  onDownloadPdf?: (purchaseOrder: PurchaseOrder) => void;
}

export function EnhancedPurchaseOrderTable({
  purchaseOrders,
  isLoading = false,
  onViewPdf,
  onDownloadPdf,
}: EnhancedPurchaseOrderTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPO, setExpandedPO] = useState<string | null>(null);
  const navigate = useNavigate();

  const filteredPurchaseOrders = useMemo(() => {
    if (!searchTerm) return purchaseOrders;
    
    return purchaseOrders.filter((po) => {
      const searchString = [
        po.number,
        po.vendorName,
        po.status,
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

  const handleViewDetails = (id: string) => {
    navigate(`/purchase-orders/${id}`);
  };

  const handleEditPurchaseOrder = (id: string) => {
    navigate(`/purchase-orders/edit/${id}`);
  };

  const getStatusBadgeClass = (status: string) => {
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

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "";
    
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return dateObj.toLocaleDateString();
    } catch (error) {
      return "";
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading purchase orders...
                </TableCell>
              </TableRow>
            ) : filteredPurchaseOrders.length === 0 ? (
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
                    <TableCell className="font-medium">{po.number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={po.vendor?.photo || ""} alt={po.vendorName || ""} />
                          <AvatarFallback>
                            {po.vendorName?.substring(0, 2).toUpperCase() || "VN"}
                          </AvatarFallback>
                        </Avatar>
                        <span>{po.vendorName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(po.date)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(po.status)}>
                        {po.status || "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(po.total || 0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(po.balance || 0)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(po.id)}
                          className="h-8 w-8 p-0"
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span className="sr-only">View Details</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPurchaseOrder(po.id)}
                          className="h-8 w-8 p-0"
                        >
                          <EditIcon className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        {po.pdf_link && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onViewPdf?.(po)}
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
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedPO === po.id && po.lineItems && po.lineItems.length > 0 && (
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
                              {po.lineItems.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{item.new_product_name || item.display_name}</div>
                                      {item.vendor_product_name && item.vendor_product_name !== (item.new_product_name || item.display_name) && (
                                        <div className="text-sm text-muted-foreground">
                                          {item.vendor_product_name}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">{item.quantity}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(item.unitPrice || item.unit_price || 0)}</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(item.total || (item.quantity * (item.unitPrice || item.unit_price || 0)))}
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow>
                                <TableCell colSpan={3} className="text-right font-medium">
                                  Total
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(po.total || 0)}
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
    </div>
  );
}
