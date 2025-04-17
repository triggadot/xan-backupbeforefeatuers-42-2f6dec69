/**
 * Formatting utility functions
 */

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code, defaults to USD
 * @param maximumFractionDigits - Maximum number of fraction digits to display
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number | undefined | null,
  currency = 'USD',
  maximumFractionDigits = 2
): string => {
  if (amount === undefined || amount === null) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits
  }).format(amount);
};

/**
 * Format a date string
 * @param dateString - The date string to format
 * @param format - The format style, defaults to 'medium'
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string | undefined | null,
  format: 'short' | 'medium' | 'long' = 'medium'
): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'long':
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    case 'medium':
    default:
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
};

/**
 * Format a number with commas
 * @param num - The number to format
 * @param decimals - The number of decimal places
 * @returns Formatted number string
 */
export const formatNumber = (
  num: number | undefined | null,
  decimals = 0
): string => {
  if (num === undefined || num === null) return '0';
  
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  }).format(num);
};

/**
 * Format a percentage
 * @param value - The value to format as percentage
 * @param decimals - The number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercent = (
  value: number | undefined | null,
  decimals = 1
): string => {
  if (value === undefined || value === null) return '0%';
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  }).format(value / 100);
};

/**
 * Format a date in a short format (MM/DD/YYYY)
 * @param dateString A date string or Date object
 * @returns Formatted short date string
 */
export const formatShortDate = (dateString: string | Date): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  });
};
