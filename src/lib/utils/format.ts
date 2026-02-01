// Formatting utilities

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', options || {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format a time duration in minutes to hours and minutes
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number, decimals = 0): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format distance in miles
 */
export function formatDistance(miles: number): string {
  return `${formatNumber(miles, 1)} mi`;
}

/**
 * Format speed in mph
 */
export function formatSpeed(mph: number): string {
  return `${formatNumber(mph, 0)} mph`;
}

/**
 * Format fuel in gallons
 */
export function formatFuel(gallons: number): string {
  return `${formatNumber(gallons, 1)} gal`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 0): string {
  return `${formatNumber(value, decimals)}%`;
}
