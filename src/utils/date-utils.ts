
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

/**
 * Format a date to a brief display format, mainly for charts
 * @param date The date to format
 * @returns Formatted date string (e.g. "01/15")
 */
export const formatDateBrief = (date: Date | string | number | null | undefined): string => {
  if (!date) return '—';
  
  try {
    const dateObj = new Date(date);
    return `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error formatting brief date:', error);
    return '—';
  }
};

/**
 * Format a timestamp to a readable string
 * @param timestamp The timestamp to format
 * @returns Formatted timestamp string
 */
export const formatTimestamp = (timestamp: string | Date | null | undefined): string => {
  if (!timestamp) return 'Never';
  
  try {
    return formatDateTime(timestamp, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Invalid date';
  }
};

/**
 * Format a time as "X ago" for recent times
 * @param time The time to format
 * @returns Formatted time ago string
 */
export const formatTimeAgo = (time: string | Date | null | undefined): string => {
  return formatRelativeTime(time);
};

/**
 * Calculate and format the duration between two timestamps
 * @param startTime Start timestamp
 * @param endTime End timestamp
 * @returns Formatted duration string
 */
export const formatDuration = (
  startTime: string | Date | null | undefined,
  endTime: string | Date | null | undefined
): string => {
  if (!startTime || !endTime) return '—';
  
  try {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    
    if (isNaN(start) || isNaN(end) || end < start) {
      return '—';
    }
    
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  } catch (error) {
    console.error('Error calculating duration:', error);
    return '—';
  }
};
