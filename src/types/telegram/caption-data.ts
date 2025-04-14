/**
 * Types for structured data extracted from message captions.
 */

/**
 * Interface for structured data extracted from captions.
 * This represents the product metadata parsed from media message captions.
 */
export interface CaptionData {
  product_name?: string;
  product_code?: string;
  product_sku?: string;
  vendor_uid?: string;
  purchase_date?: string; // ISO date string format
  product_quantity?: number;
  notes?: string;
  purchase_order_uid?: string;
  // Additional fields can be extended based on parsing needs
  [key: string]: unknown;
}

/**
 * Interface for content analyzed by the caption parser.
 * Used in both media messages and text messages.
 */
export interface AnalyzedContent extends CaptionData {
  raw_text?: string;          // Original text that was analyzed
  parse_version?: string;     // Version of the parser used
  parsed_at?: string;         // ISO timestamp of when parsing occurred
  confidence_score?: number;  // Confidence level in the parsing (0-1)
  identified_fields?: string[]; // List of fields that were successfully identified
}

/**
 * Interface for storing the edit history of analyzed content.
 */
export interface ContentEditHistory {
  previous_content: AnalyzedContent;
  edited_at: string; // ISO timestamp
  edit_source?: string; // Source of the edit (user, system, etc.)
}
