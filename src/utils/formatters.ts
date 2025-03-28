
/**
 * Format a number as currency
 */
export const formatCurrency = (amount?: number): string => {
  if (amount === undefined || amount === null) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format a number with commas
 */
export const formatNumber = (num?: number): string => {
  if (num === undefined || num === null) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Format a date as a string
 */
export const formatDate = (date?: Date | string | null): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
