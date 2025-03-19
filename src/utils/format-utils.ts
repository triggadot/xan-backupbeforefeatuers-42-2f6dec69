
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString();
};

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '--';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // If not 10 digits, return as is
  return phone;
};

export const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '--';
  return `${(value * 100).toFixed(1)}%`;
};
