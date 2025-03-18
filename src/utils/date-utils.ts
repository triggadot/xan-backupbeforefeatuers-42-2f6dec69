
/**
 * Format a date to a readable string format
 * @param date The date to format
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDateTime = (
  date: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string => {
  if (!date) return '—';
  
  try {
    return new Date(date).toLocaleString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '—';
  }
};

/**
 * Format a date to a relative time string (e.g. "5 minutes ago")
 * @param date The date to format
 * @returns Relative time string
 */
export const formatRelativeTime = (date: Date | string | number | null | undefined): string => {
  if (!date) return '—';
  
  try {
    const now = new Date();
    const pastDate = new Date(date);
    const diffMs = now.getTime() - pastDate.getTime();
    
    // Convert to seconds, minutes, hours, days
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);
    
    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHrs < 24) {
      return `${diffHrs} ${diffHrs === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      // Fall back to formatted date for older dates
      return formatDateTime(date, { year: 'numeric', month: 'short', day: 'numeric' });
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '—';
  }
};

/**
 * Format a date to just the date portion
 * @param date The date to format
 * @returns Formatted date string (e.g. "Jan 1, 2023")
 */
export const formatDate = (date: Date | string | number | null | undefined): string => {
  return formatDateTime(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
