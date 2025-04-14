/**
 * Hook for parsing caption text from Telegram messages to extract structured product data.
 */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CaptionData, AnalyzedContent } from '@/types/telegram/caption-data';

/**
 * Regular expression patterns for extracting data from captions.
 */
const PATTERNS = {
  // Product name - typically at the start of the caption or after a specific marker
  PRODUCT_NAME: /^([^\n#:]+)|Product[\s:-]+([^\n]+)/i,
  
  // Product code - typically prefixed with a code identifier
  PRODUCT_CODE: /(?:code|sku|item|#)[\s:-]*([\w-]+)/i,
  
  // Vendor UID - may follow various formats
  VENDOR_UID: /(?:vendor|supplier|from)[\s:-]*([\w-]+)/i,
  
  // Purchase date in various formats
  PURCHASE_DATE: /(?:(?:purchased?|bought|date)[\s:-]*)(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{4}[\/.-]\d{1,2}[\/.-]\d{1,2})/i,
  
  // Quantity with optional units
  QUANTITY: /(?:qty|quantity|amount)[\s:-]*(\d+(?:\.\d+)?)/i,
  
  // Notes section - typically after specific markers or at the end
  NOTES: /(?:notes?|comments?|remarks?)[\s:-]*([^\n#]+)/i,
  
  // Purchase order reference
  PURCHASE_ORDER: /(?:po|order|ref)[\s:-]*([\w-]+)/i,
  
  // Product SKU - may be formatted differently than code
  PRODUCT_SKU: /(?:sku)[\s:-]*([\w-]+)/i,
};

/**
 * Helper to parse date strings into ISO format
 */
const parseDate = (dateStr: string): string | undefined => {
  try {
    // Handle various date formats
    const formats = [      
      // MM/DD/YYYY
      { regex: /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/, format: (m: RegExpMatchArray) => `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` },
      // YYYY/MM/DD
      { regex: /^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})$/, format: (m: RegExpMatchArray) => `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` },
      // DD/MM/YYYY
      { regex: /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/, format: (m: RegExpMatchArray) => `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` },
    ];
    
    for (const { regex, format } of formats) {
      const match = dateStr.match(regex);
      if (match) {
        return format(match);
      }
    }
    
    // Last resort: try standard JS Date parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return undefined;
  } catch (error) {
    console.error('Error parsing date:', error);
    return undefined;
  }
};

/**
 * Hook for parsing and analyzing caption text from Telegram messages.
 */
export function useCaptionParser() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Parse caption text to extract structured data.
   * 
   * @param captionText - The text caption from a Telegram message
   * @returns Structured data extracted from the caption
   */
  const parseCaption = (captionText: string): CaptionData => {
    if (!captionText) {
      return {};
    }
    
    try {
      setIsAnalyzing(true);
      setError(null);
      
      const result: CaptionData = {};
      
      // Extract product name
      const nameMatch = captionText.match(PATTERNS.PRODUCT_NAME);
      if (nameMatch) {
        result.product_name = (nameMatch[1] || nameMatch[2])?.trim();
      }
      
      // Extract product code
      const codeMatch = captionText.match(PATTERNS.PRODUCT_CODE);
      if (codeMatch) {
        result.product_code = codeMatch[1]?.trim();
      }
      
      // Extract vendor UID
      const vendorMatch = captionText.match(PATTERNS.VENDOR_UID);
      if (vendorMatch) {
        result.vendor_uid = vendorMatch[1]?.trim();
      }
      
      // Extract and parse purchase date
      const dateMatch = captionText.match(PATTERNS.PURCHASE_DATE);
      if (dateMatch) {
        const rawDate = dateMatch[1]?.trim();
        if (rawDate) {
          result.purchase_date = parseDate(rawDate);
        }
      }
      
      // Extract quantity
      const qtyMatch = captionText.match(PATTERNS.QUANTITY);
      if (qtyMatch) {
        const qtyStr = qtyMatch[1]?.trim();
        if (qtyStr) {
          result.product_quantity = parseFloat(qtyStr);
        }
      }
      
      // Extract notes
      const notesMatch = captionText.match(PATTERNS.NOTES);
      if (notesMatch) {
        result.notes = notesMatch[1]?.trim();
      }
      
      // Extract purchase order
      const poMatch = captionText.match(PATTERNS.PURCHASE_ORDER);
      if (poMatch) {
        result.purchase_order_uid = poMatch[1]?.trim();
      }
      
      // Extract product SKU
      const skuMatch = captionText.match(PATTERNS.PRODUCT_SKU);
      if (skuMatch) {
        result.product_sku = skuMatch[1]?.trim();
      }
      
      return result;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error parsing caption';
      setError(errMsg);
      console.error('Error parsing caption:', err);
      return {};
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  /**
   * Mutation for analyzing caption text with enhanced metadata.
   */
  const analyzeCaption = useMutation({
    mutationFn: async (captionText: string): Promise<AnalyzedContent> => {
      const captionData = parseCaption(captionText);
      
      // Enhance with metadata for the analyzed content
      const analyzedContent: AnalyzedContent = {
        ...captionData,
        raw_text: captionText,
        parse_version: '1.0.0',
        parsed_at: new Date().toISOString(),
        confidence_score: calculateConfidenceScore(captionData),
        identified_fields: Object.keys(captionData),
      };
      
      return analyzedContent;
    }
  });
  
  /**
   * Calculate confidence score based on the number of fields successfully extracted.
   */
  const calculateConfidenceScore = (data: CaptionData): number => {
    const extractedFields = Object.keys(data).filter(key => 
      data[key] !== undefined && data[key] !== null && data[key] !== ''
    );
    
    // Total possible fields to extract
    const totalPossibleFields = Object.keys(PATTERNS).length;
    
    // Calculate confidence score (0-1)
    return Math.min(1, extractedFields.length / totalPossibleFields);
  };
  
  return {
    parseCaption,
    analyzeCaption,
    isAnalyzing,
    error,
  };
}
