"use client";

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn, formatCurrency } from "@/lib/utils";
import { PurchaseOrderWithVendor } from "@/types/purchaseOrder";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DownloadIcon, 
  FileTextIcon, 
  SearchIcon, 
  XIcon,
  EyeIcon,
  EditIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FilterIcon,
  PlusIcon,
  SlidersHorizontalIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { generateAndStorePDF, generatePurchaseOrderPDF } from "@/lib/pdf-utils";

interface EnhancedPurchaseOrderTableProps {
  purchaseOrders: PurchaseOrderWithVendor[];
  isLoading?: boolean;
  onViewPdf?: (purchaseOrder: PurchaseOrderWithVendor) => void;
  onDownloadPdf?: (purchaseOrder: PurchaseOrderWithVendor) => void;
  onCreatePurchaseOrder?: () => void;
}

interface ExtendedPurchaseOrder extends PurchaseOrderWithVendor {
  pdfLink?: string; // Legacy field - Internal Glide use only
  pdf_link?: string; // Internal Glide use only
  supabase_pdf_url?: string; // Supabase storage URL for PDFs
  products?: any[];
}

type SortField = 'number' | 'vendorName' | 'date' | 'status' | 'total' | 'balance';
type SortDirection = 'asc' | 'desc';

export function EnhancedPurchaseOrderTable({
  purchaseOrders,
  isLoading = false,
  onViewPdf,
  onDownloadPdf,
  onCreatePurchaseOrder,
}: EnhancedPurchaseOrderTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPO, setExpandedPO] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [vendorFilter, setVendorFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [columnVisibility, setColumnVisibility] = useState({
    number: true,
    vendor: true,
    date: true,
    status: true,
    total: true,
    balance: true,
    actions: true,
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get unique vendors for filtering
  const uniqueVendors = useMemo(() => {
    const vendors = new Set<string>();
    (purchaseOrders as ExtendedPurchaseOrder[]).forEach(po => {
      if (po.vendorName) {
        vendors.add(po.vendorName);
      }
    });
    return Array.from(vendors).sort();
  }, [purchaseOrders]);

  // Get unique statuses for filtering
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    (purchaseOrders as ExtendedPurchaseOrder[]).forEach(po => {
      if (po.status) {
        statuses.add(po.status);
      }
    });
    return Array.from(statuses).sort();
  }, [purchaseOrders]);

  const filteredPurchaseOrders = useMemo(() => {
    if (!purchaseOrders) return [];
    
    let filtered = purchaseOrders as ExtendedPurchaseOrder[];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((po) => {
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
    }
    
    // Apply vendor filter
    if (vendorFilter.length > 0) {
      filtered = filtered.filter(po => 
        po.vendorName && vendorFilter.includes(po.vendorName)
      );
    }
    
    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(po => 
        po.status && statusFilter.includes(po.status)
      );
    }
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'number':
          comparison = (a.number || '').localeCompare(b.number || '');
          break;
        case 'vendorName':
          comparison = (a.vendorName || '').localeCompare(b.vendorName || '');
          break;
        case 'date':
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'total':
          comparison = (a.total || 0) - (b.total || 0);
          break;
        case 'balance':
          comparison = (a.balance || 0) - (b.balance || 0);
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [purchaseOrders, searchTerm, vendorFilter, statusFilter, sortField, sortDirection]);

  const toggleExpandPO = (poId: string) => {
    setExpandedPO(expandedPO === poId ? null : poId);
  };

  const handleViewDetails = (id: string) => {
    navigate(`/purchase-orders/${id}`);
  };

  const handleEditPurchaseOrder = (id: string) => {
    navigate(`/purchase-orders/edit/${id}`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "complete":
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

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="ml-1 h-4 w-4" /> 
      : <ChevronDownIcon className="ml-1 h-4 w-4" />;
  };

  const handleViewPdf = async (purchaseOrder: PurchaseOrderWithVendor) => {
    // Check if we have a direct link
    if (purchaseOrder.supabase_pdf_url || purchaseOrder.pdfLink) {
      const pdfUrl = purchaseOrder.supabase_pdf_url || purchaseOrder.pdfLink;
      window.open(pdfUrl, '_blank');
    } else {
      // If no direct link, we need to generate the PDF
      toast({
        title: 'Generating PDF',
        description: 'The PDF is being generated, please wait...',
      });
      
      try {
        // Generate and store the PDF
        const pdfUrl = await generateAndStorePDF('purchaseOrder', purchaseOrder as any, false);
        
        if (pdfUrl) {
          // Open the PDF in a new tab
          window.open(pdfUrl, '_blank');
          
          toast({
            title: 'PDF Generated',
            description: 'Your purchase order PDF has been generated and opened in a new tab.',
          });
        } else {
          throw new Error('Failed to generate PDF');
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: 'Error',
          description: 'Failed to generate PDF.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleDownloadPdf = async (purchaseOrder: PurchaseOrderWithVendor) => {
    // Check if we have a direct link
    if (purchaseOrder.supabase_pdf_url || purchaseOrder.pdfLink) {
      const pdfUrl = purchaseOrder.supabase_pdf_url || purchaseOrder.pdfLink;
      // Create a temporary anchor element to trigger download
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = `${purchaseOrder.number || 'purchase-order'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // If no direct link, we need to generate the PDF
      toast({
        title: 'Generating PDF',
        description: 'The PDF is being generated for download, please wait...',
      });
      
      try {
        // Generate the PDF
        const doc = generatePurchaseOrderPDF(purchaseOrder as any);
        
        // Save the PDF locally
        doc.save(`${purchaseOrder.number || 'purchase-order'}.pdf`);
        
        // Also store it in Supabase for future use
        generateAndStorePDF('purchaseOrder', purchaseOrder as any, false)
          .then(url => {
            if (url) {
              toast({
                title: 'PDF Stored',
                description: 'Your purchase order PDF has been stored for future use.',
              });
            }
          })
          .catch(error => {
            console.error('Error storing PDF:', error);
          });
        
        toast({
          title: 'PDF Downloaded',
          description: 'Your purchase order PDF has been generated and downloaded.',
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: 'Error',
          description: 'Failed to generate PDF for download.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-64">
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Vendor Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <FilterIcon className="mr-2 h-3 w-3" />
                Vendor
                {vendorFilter.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary w-5 h-5 text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                    {vendorFilter.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0" align="start">
              <div className="p-2">
                <div className="text-sm font-medium mb-2">Filter by vendor</div>
                <div className="space-y-2 max-h-[200px] overflow-auto">
                  {uniqueVendors.map((vendor) => (
                    <div key={vendor} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`vendor-${vendor}`}
                        checked={vendorFilter.includes(vendor)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setVendorFilter([...vendorFilter, vendor]);
                          } else {
                            setVendorFilter(vendorFilter.filter(v => v !== vendor));
                          }
                        }}
                      />
                      <Label htmlFor={`vendor-${vendor}`}>{vendor}</Label>
                    </div>
                  ))}
                </div>
                {vendorFilter.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 w-full"
                    onClick={() => setVendorFilter([])}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Status Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <FilterIcon className="mr-2 h-3 w-3" />
                Status
                {statusFilter.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary w-5 h-5 text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                    {statusFilter.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-0" align="start">
              <div className="p-2">
                <div className="text-sm font-medium mb-2">Filter by status</div>
                <div className="space-y-2">
                  {uniqueStatuses.map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`status-${status}`}
                        checked={statusFilter.includes(status)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setStatusFilter([...statusFilter, status]);
                          } else {
                            setStatusFilter(statusFilter.filter(s => s !== status));
                          }
                        }}
                      />
                      <Label htmlFor={`status-${status}`}>{status}</Label>
                    </div>
                  ))}
                </div>
                {statusFilter.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 w-full"
                    onClick={() => setStatusFilter([])}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <SlidersHorizontalIcon className="mr-2 h-3 w-3" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={columnVisibility.number}
                onCheckedChange={(checked) => 
                  setColumnVisibility({...columnVisibility, number: !!checked})
                }
              >
                PO Number
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.vendor}
                onCheckedChange={(checked) => 
                  setColumnVisibility({...columnVisibility, vendor: !!checked})
                }
              >
                Vendor
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.date}
                onCheckedChange={(checked) => 
                  setColumnVisibility({...columnVisibility, date: !!checked})
                }
              >
                Date
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.status}
                onCheckedChange={(checked) => 
                  setColumnVisibility({...columnVisibility, status: !!checked})
                }
              >
                Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.total}
                onCheckedChange={(checked) => 
                  setColumnVisibility({...columnVisibility, total: !!checked})
                }
              >
                Total
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.balance}
                onCheckedChange={(checked) => 
                  setColumnVisibility({...columnVisibility, balance: !!checked})
                }
              >
                Balance
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={columnVisibility.actions}
                onCheckedChange={(checked) => 
                  setColumnVisibility({...columnVisibility, actions: !!checked})
                }
              >
                Actions
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create Purchase Order Button */}
          <Button 
            size="sm" 
            className="h-8"
            onClick={onCreatePurchaseOrder}
          >
            <PlusIcon className="mr-2 h-3 w-3" />
            New Purchase Order
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columnVisibility.number && (
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('number')}
                >
                  <div className="flex items-center">
                    PO # {renderSortIcon('number')}
                  </div>
                </TableHead>
              )}
              {columnVisibility.vendor && (
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('vendorName')}
                >
                  <div className="flex items-center">
                    Vendor {renderSortIcon('vendorName')}
                  </div>
                </TableHead>
              )}
              {columnVisibility.date && (
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date {renderSortIcon('date')}
                  </div>
                </TableHead>
              )}
              {columnVisibility.status && (
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status {renderSortIcon('status')}
                  </div>
                </TableHead>
              )}
              {columnVisibility.total && (
                <TableHead 
                  className="text-right cursor-pointer"
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center justify-end">
                    Total {renderSortIcon('total')}
                  </div>
                </TableHead>
              )}
              {columnVisibility.balance && (
                <TableHead 
                  className="text-right cursor-pointer"
                  onClick={() => handleSort('balance')}
                >
                  <div className="flex items-center justify-end">
                    Balance {renderSortIcon('balance')}
                  </div>
                </TableHead>
              )}
              {columnVisibility.actions && (
                <TableHead className="text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={Object.values(columnVisibility).filter(Boolean).length} className="h-24 text-center">
                  Loading purchase orders...
                </TableCell>
              </TableRow>
            ) : filteredPurchaseOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Object.values(columnVisibility).filter(Boolean).length} className="h-24 text-center">
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
                    {columnVisibility.number && (
                      <TableCell className="font-medium">{po.number}</TableCell>
                    )}
                    {columnVisibility.vendor && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {po.vendorName?.substring(0, 2).toUpperCase() || "VN"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{po.vendorName}</span>
                        </div>
                      </TableCell>
                    )}
                    {columnVisibility.date && (
                      <TableCell>{formatDate(po.date)}</TableCell>
                    )}
                    {columnVisibility.status && (
                      <TableCell>
                        <Badge className={getStatusBadgeClass(po.status)}>
                          {po.status || "Draft"}
                        </Badge>
                      </TableCell>
                    )}
                    {columnVisibility.total && (
                      <TableCell className="text-right">{formatCurrency(po.total || 0)}</TableCell>
                    )}
                    {columnVisibility.balance && (
                      <TableCell className="text-right">{formatCurrency(po.balance || 0)}</TableCell>
                    )}
                    {columnVisibility.actions && (
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
                          {(po.supabase_pdf_url || po.pdfLink) && (
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
                                onClick={() => handleDownloadPdf(po)}
                                className="h-8 w-8 p-0"
                              >
                                <DownloadIcon className="h-4 w-4" />
                                <span className="sr-only">Download PDF</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                  {expandedPO === po.id && po.products && po.products.length > 0 && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={Object.values(columnVisibility).filter(Boolean).length} className="p-0">
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
                                      <div className="font-medium">{product.new_product_name || product.display_name}</div>
                                      {product.vendor_product_name && (
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
