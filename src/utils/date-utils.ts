
import { formatDistance, format, parseISO } from 'date-fns';

/**
 * Format a date string to a relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    return formatDistance(date, new Date(), { addSuffix: true });
  } catch (e) {
    return 'Invalid date';
  }
};

/**
 * Format a date string to a readable date/time format
 */
export const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return 'Never';
  
  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  } catch (e) {
    return 'Invalid date';
  }
};

/**
 * Parse ISO string safely
 */
export const parseIsoDate = (dateString: string): Date | null => {
  try {
    return parseISO(dateString);
  } catch (e) {
    return null;
  }
};
