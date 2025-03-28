
/**
 * Formats a number as currency
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '$0.00';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
};

/**
 * Formats a date string to a localized format
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Formats a number with commas
 */
export const formatNumber = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';
  
  return new Intl.NumberFormat('en-US').format(numValue);
};

/**
 * Truncates text to a specific length and adds ellipsis
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text || text.length <= maxLength) return text || '';
  
  return `${text.substring(0, maxLength)}...`;
};
