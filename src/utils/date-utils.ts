
export function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return 'Never';
  
  try {
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Format date as localized string
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Error';
  }
}

export function calculateDuration(startTime: string, endTime: string | null): string {
  if (!endTime) return 'In progress';
  
  try {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    
    if (isNaN(durationMs)) {
      return 'Invalid duration';
    }
    
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    } else if (durationMs < 60000) {
      return `${Math.floor(durationMs / 1000)}s`;
    } else {
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  } catch (error) {
    console.error('Error calculating duration:', error);
    return 'Error';
  }
}

// Add new functions needed by other components
export function formatDateTime(timestamp: string | null): string {
  if (!timestamp) return 'Never';
  return formatTimestamp(timestamp);
}

export function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return 'Never';
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Convert to seconds
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) {
      return diffSec <= 1 ? 'just now' : `${diffSec} seconds ago`;
    }
    
    // Convert to minutes
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    }
    
    // Convert to hours
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) {
      return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
    }
    
    // Convert to days
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) {
      return diffDay === 1 ? 'yesterday' : `${diffDay} days ago`;
    }
    
    // For older dates, just return the formatted date
    return formatTimestamp(timestamp);
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Error';
  }
}

export function formatTimeAgo(timestamp: string | null): string {
  return formatRelativeTime(timestamp);
}

export function formatDateBrief(timestamp: string | null): string {
  if (!timestamp) return 'Never';
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting brief date:', error);
    return 'Error';
  }
}
