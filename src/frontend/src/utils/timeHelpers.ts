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
 * Convert milliseconds to nanoseconds
 */
export function convertToNanoseconds(milliseconds: number): bigint {
  return BigInt(milliseconds) * BigInt(1_000_000);
}

/**
 * Convert nanoseconds to milliseconds
 */
export function convertFromNanoseconds(nanoseconds: bigint): string {
  const ms = Number(nanoseconds / BigInt(1_000_000));
  const date = new Date(ms);
  return dateToDateTimeLocal(date);
}

/**
 * Get current datetime in IST as datetime-local format
 */
export function getCurrentISTDatetimeLocal(): string {
  return dateToDateTimeLocal(new Date());
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
export function validateTimeRange(startTime: string, endTime: string): { valid: boolean; error?: string } {
  if (!startTime || !endTime) {
    return { valid: false, error: 'Start and end times are required' };
  }
  const start = dateTimeLocalToDate(startTime);
  const end = dateTimeLocalToDate(endTime);
  if (end <= start) {
    return { valid: false, error: 'End time must be after start time' };
  }
  return { valid: true };
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

/**
 * Format elapsed seconds to HH:MM:SS format with zero-padding
 * 
 * @param seconds - Total elapsed seconds
 * @returns Formatted time string (e.g., "01:23:45")
 */
export function formatElapsedTime(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}
