import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  maxDisplayed?: number;
}

export function Pagination({
  totalPages,
  currentPage,
  onPageChange,
  maxDisplayed = 5
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const halfMax = Math.floor(maxDisplayed / 2);
    
    // Case 1: Show all pages if there are few pages
    if (totalPages <= maxDisplayed) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }
    
    // Case 2: Current page is close to the start
    if (currentPage < halfMax) {
      for (let i = 0; i < maxDisplayed - 1; i++) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages - 1);
      return pages;
    }
    
    // Case 3: Current page is close to the end
    if (currentPage >= totalPages - halfMax) {
      pages.push(0);
      pages.push('ellipsis');
      for (let i = totalPages - maxDisplayed + 1; i < totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }
    
    // Case 4: Current page is in the middle
    pages.push(0);
    pages.push('ellipsis');
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
      pages.push(i);
    }
    pages.push('ellipsis');
    pages.push(totalPages - 1);
    return pages;
  };

  const pageNumbers = getPageNumbers();
  
  // Go to previous page
  const prevPage = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };
  
  // Go to next page
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-center space-x-1">
      <Button
        variant="outline"
        size="icon"
        onClick={prevPage}
        disabled={currentPage === 0}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {pageNumbers.map((page, i) => 
        page === 'ellipsis' ? (
          <Button 
            key={`ellipsis-${i}`}
            variant="ghost" 
            size="icon" 
            disabled
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            key={`page-${page}`}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(page as number)}
            aria-label={`Page ${Number(page) + 1}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {Number(page) + 1}
          </Button>
        )
      )}
      
      <Button
        variant="outline"
        size="icon"
        onClick={nextPage}
        disabled={currentPage >= totalPages - 1}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
