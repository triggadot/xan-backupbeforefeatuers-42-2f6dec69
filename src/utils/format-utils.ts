
/**
 * Format date string to localized date string
 */
export const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return '-';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '-';
  
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === null || amount === undefined) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Format percentage
 */
export const formatPercent = (value: number | undefined | null, decimals: number = 1): string => {
  if (value === null || value === undefined) return '0%';
  
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format number with thousands separators
 */
export const formatNumber = (value: number | undefined | null): string => {
  if (value === null || value === undefined) return '0';
  
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Format phone number
 */
export const formatPhone = (phone: string | undefined | null): string => {
  if (!phone) return '-';
  
  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  }
  
  return phone;
};

/**
 * Convert a date to YYYY-MM-DD format for inputs
 */
export const formatDateForInput = (date: Date | string | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Format payment status with appropriate styling class
 */
export const formatPaymentStatus = (status: string | undefined | null): { label: string; variant: "default" | "destructive" | "success" | "warning" } => {
  if (!status) return { label: 'Unknown', variant: 'default' };
  
  const normalizedStatus = status.toLowerCase();
  
  switch (normalizedStatus) {
    case 'paid':
      return { label: 'Paid', variant: 'success' };
    case 'partial':
      return { label: 'Partial', variant: 'warning' };
    case 'overdue':
      return { label: 'Overdue', variant: 'destructive' };
    case 'unpaid':
      return { label: 'Unpaid', variant: 'destructive' };
    case 'draft':
      return { label: 'Draft', variant: 'default' };
    case 'sent':
      return { label: 'Sent', variant: 'default' };
    default:
      return { label: status, variant: 'default' };
  }
};
