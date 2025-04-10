/**
 * Calculate percentage change between two values
 * @param currentValue The current value
 * @param previousValue The previous value to compare against
 * @returns The percentage change, positive for increase, negative for decrease
 */
export function calculatePercentageChange(
  currentValue: number,
  previousValue: number
): number {
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0; // Consider it a 100% increase if previous was zero
  }
  
  return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
}

/**
 * Calculate growth rate between periods
 * @param currentPeriodData Array of values for current period
 * @param previousPeriodData Array of values for previous period
 * @returns The growth rate as a percentage
 */
export function calculateGrowthRate(
  currentPeriodData: number[],
  previousPeriodData: number[]
): number {
  const currentSum = currentPeriodData.reduce((sum, value) => sum + value, 0);
  const previousSum = previousPeriodData.reduce((sum, value) => sum + value, 0);
  
  return calculatePercentageChange(currentSum, previousSum);
}

/**
 * Calculate moving average for a series of data
 * @param data Array of numeric values
 * @param windowSize Size of the moving window
 * @returns Array of moving averages
 */
export function calculateMovingAverage(
  data: number[],
  windowSize: number
): number[] {
  if (windowSize > data.length) {
    return data;
  }
  
  const result: number[] = [];
  
  for (let i = 0; i <= data.length - windowSize; i++) {
    const sum = data.slice(i, i + windowSize).reduce((sum, value) => sum + value, 0);
    result.push(sum / windowSize);
  }
  
  return result;
}

/**
 * Calculate year-over-year (YoY) comparison
 * @param currentYearData Data for the current year
 * @param previousYearData Data for the previous year
 * @returns Object with YoY metrics
 */
export function calculateYearOverYear(
  currentYearData: number[],
  previousYearData: number[]
): { growth: number; difference: number } {
  const currentTotal = currentYearData.reduce((sum, value) => sum + value, 0);
  const previousTotal = previousYearData.reduce((sum, value) => sum + value, 0);
  
  return {
    growth: calculatePercentageChange(currentTotal, previousTotal),
    difference: currentTotal - previousTotal
  };
}

/**
 * Calculate metric trend direction
 * @param recentValues Recent values in chronological order
 * @returns Trend direction: 'up', 'down', or 'stable'
 */
export function calculateTrendDirection(recentValues: number[]): 'up' | 'down' | 'stable' {
  if (recentValues.length < 2) {
    return 'stable';
  }
  
  const firstHalf = recentValues.slice(0, Math.floor(recentValues.length / 2));
  const secondHalf = recentValues.slice(Math.floor(recentValues.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, value) => sum + value, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, value) => sum + value, 0) / secondHalf.length;
  
  const change = calculatePercentageChange(secondAvg, firstAvg);
  
  if (change > 2) {
    return 'up';
  } else if (change < -2) {
    return 'down';
  } else {
    return 'stable';
  }
}

/**
 * Format large numbers for display
 * @param value The number to format
 * @param compact Whether to use compact notation
 * @returns Formatted string representation
 */
export function formatLargeNumber(value: number, compact = true): string {
  return new Intl.NumberFormat('en-US', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: 1
  }).format(value);
}

/**
 * Format currency values
 * @param value The currency amount
 * @param currency The currency code (default: USD)
 * @param compact Whether to use compact notation
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency = 'USD',
  compact = true
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 2
  }).format(value);
} 