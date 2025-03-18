import { format, formatDistance, formatDistanceToNow, formatRelative, parseISO, isValid } from 'date-fns';

/**
 * Format a date with a standard format for timestamps in the UI
 */
export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy HH:mm:ss');
  } catch (e) {
    return 'Invalid date';
  }
};

/**
 * Format a date as a relative time (e.g., "2 hours ago")
 */
export const formatTimeAgo = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (e) {
    return 'Invalid date';
  }
};

/**
 * Format a date briefly (e.g., "Jan 15")
 */
export const formatDateBrief = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return format(date, 'MMM dd');
  } catch (e) {
    return 'Invalid date';
  }
};

/**
 * Calculate and format the duration between two dates
 */
export const formatDuration = (
  startDateString: string, 
  endDateString: string | null | undefined
): string => {
  if (!endDateString) return 'In progress';
  
  try {
    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);
    return formatDistance(startDate, endDate, { includeSeconds: true });
  } catch (e) {
    return 'Unknown duration';
  }
};

/**
 * Parse ISO string safely
 */
export const parseIsoDate = (dateString: string): Date | null => {
  try {
    const date = parseISO(dateString);
    return isValid(date) ? date : null;
  } catch (e) {
    return null;
  }
};

/**
 * Format date for timestamps in logs and records
 * This is the main function to use for displaying timestamps
 */
export const formatTimestamp = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Never';
  
  try {
    const date = new Date(dateString);
    // First show relative time
    const relativeTime = formatDistanceToNow(date, { addSuffix: true });
    // Then show exact time
    const exactTime = format(date, 'MMM dd, yyyy HH:mm');
    return `${relativeTime} (${exactTime})`;
  } catch (e) {
    return 'Invalid date';
  }
};
