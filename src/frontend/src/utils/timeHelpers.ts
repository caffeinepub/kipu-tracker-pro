/**
 * Utility functions for time handling in IST timezone
 */

/**
 * Convert a Date object to datetime-local input format (YYYY-MM-DDTHH:mm)
 */
export function dateToDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert datetime-local input format to Date object
 */
export function dateTimeLocalToDate(dateTimeLocal: string): Date {
  return new Date(dateTimeLocal);
}

/**
 * Convert nanosecond timestamp to datetime-local format
 */
export function nanoToDateTimeLocal(nano: bigint): string {
  const ms = Number(nano / BigInt(1_000_000));
  const date = new Date(ms);
  return dateToDateTimeLocal(date);
}

/**
 * Convert datetime-local format to nanosecond timestamp
 */
export function dateTimeLocalToNano(dateTimeLocal: string): bigint {
  const date = dateTimeLocalToDate(dateTimeLocal);
  return BigInt(date.getTime()) * BigInt(1_000_000);
}

/**
 * Format nanosecond timestamp to IST display format
 */
export function formatISTTime(nano: bigint): string {
  const ms = Number(nano / BigInt(1_000_000));
  const date = new Date(ms);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Validate that end time is after start time
 */
export function validateTimeRange(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false;
  const start = dateTimeLocalToDate(startTime);
  const end = dateTimeLocalToDate(endTime);
  return end > start;
}

/**
 * Check if two time ranges overlap
 */
export function checkTimeOverlap(
  start1: bigint,
  end1: bigint,
  start2: bigint,
  end2: bigint
): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Format duration in minutes to human-readable format
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}
