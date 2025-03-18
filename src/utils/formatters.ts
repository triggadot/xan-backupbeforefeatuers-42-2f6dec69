import { format, parseISO } from 'date-fns';

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: USD)
 * @param locale - The locale to use for formatting (default: en-US)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency = 'USD',
  locale = 'en-US'
): string {
  // Handle null, undefined, and empty string
  if (amount === null || amount === undefined || amount === '') {
    return '$0.00';
  }

  // Convert string to number
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Handle NaN
  if (isNaN(numericAmount)) {
    return '$0.00';
  }

  // Format the currency
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

/**
 * Format a date string or Date object
 * @param date - The date to format
 * @param formatString - The format string (default: 'MMM d, yyyy')
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatString = 'MMM d, yyyy'
): string {
  if (!date) return 'N/A';
  
  try {
    // If date is a string, parse it
    if (typeof date === 'string') {
      // Try to parse as ISO string
      return format(parseISO(date), formatString);
    }
    
    // If date is a Date object
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format a number with commas
 * @param num - The number to format
 * @returns Formatted number string
 */
export function formatNumber(
  num: number | string | null | undefined
): string {
  if (num === null || num === undefined || num === '') {
    return '0';
  }
  
  const numericValue = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(numericValue)) {
    return '0';
  }
  
  return new Intl.NumberFormat().format(numericValue);
}

/**
 * Format a phone number
 * @param phoneNumber - The phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string | null | undefined): string {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
  }
  
  // Return original if it doesn't match expected format
  return phoneNumber;
} 