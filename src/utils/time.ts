/**
 * Centralized time formatting utility
 * Handles global time format preferences across the entire app
 */

export type TimeFormat = 'system' | '12h' | '24h';

export interface FormatTimeOptions {
  format?: TimeFormat;
  locale?: string;
  includeSeconds?: boolean;
}

/**
 * Detects the device's default time format (12h or 24h)
 */
export function detectDeviceTimeFormat(): '12h' | '24h' {
  // Use Intl.DateTimeFormat to detect device preference
  const testDate = new Date();
  testDate.setHours(13, 0, 0, 0); // Set to 1:00 PM
  
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    hour12: undefined, // Let the system decide
  });
  
  const formatted = formatter.format(testDate);
  
  // Check if the formatted time contains AM/PM indicators
  // This works for most locales, including Spanish (a. m. / p. m.)
  return /[ap]\.?\s*m\.?/i.test(formatted) ? '12h' : '24h';
}

/**
 * Formats a time value according to the specified format preference
 * @param input - Time input (Date, string, or number)
 * @param options - Formatting options
 * @returns Formatted time string
 */
export function formatTime(
  input: Date | string | number,
  options: FormatTimeOptions = {}
): string {
  const {
    format = 'system',
    locale = undefined, // Use device locale
    includeSeconds = false,
  } = options;

  let date: Date;

  // Convert input to Date object
  if (input instanceof Date) {
    date = input;
  } else if (typeof input === 'string') {
    // Handle various string formats
    if (input.includes(':')) {
      // Handle "HH:MM" or "HH:MM:SS" format
      const [hours, minutes, seconds] = input.split(':').map(Number);
      date = new Date();
      date.setHours(hours || 0, minutes || 0, seconds || 0, 0);
    } else {
      // Try parsing as ISO string
      date = new Date(input);
    }
  } else if (typeof input === 'number') {
    // Handle timestamp
    date = new Date(input);
  } else {
    throw new Error('Invalid time input');
  }

  // Validate date
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }

  // Determine the actual format to use
  let actualFormat: '12h' | '24h';
  if (format === 'system') {
    actualFormat = detectDeviceTimeFormat();
  } else {
    actualFormat = format;
  }

  // Format the time
  const formatterOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
    hour12: actualFormat === '12h',
  };

  const formatter = new Intl.DateTimeFormat(locale, formatterOptions);
  return formatter.format(date);
}

/**
 * Formats a time range (start - end)
 * @param startTime - Start time
 * @param endTime - End time
 * @param options - Formatting options
 * @returns Formatted time range string
 */
export function formatTimeRange(
  startTime: Date | string | number,
  endTime: Date | string | number,
  options: FormatTimeOptions = {}
): string {
  const start = formatTime(startTime, options);
  const end = formatTime(endTime, options);
  return `${start} - ${end}`;
}

/**
 * Formats both 12h and 24h formats (useful for debugging or special cases)
 * @param input - Time input
 * @param options - Formatting options
 * @returns Object with both formats
 */
export function formatTimeBoth(
  input: Date | string | number,
  options: FormatTimeOptions = {}
): { format12h: string; format24h: string } {
  return {
    format12h: formatTime(input, { ...options, format: '12h' }),
    format24h: formatTime(input, { ...options, format: '24h' }),
  };
}

/**
 * Parses a time string back to a Date object (for internal use)
 * @param timeString - Time string in HH:MM or HH:MM:SS format
 * @returns Date object with today's date and specified time
 */
export function parseTime(timeString: string): Date {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, seconds || 0, 0);
  return date;
}

/**
 * Gets the current time in the specified format
 * @param options - Formatting options
 * @returns Current time formatted string
 */
export function getCurrentTime(options: FormatTimeOptions = {}): string {
  return formatTime(new Date(), options);
}

// Export commonly used time constants
export const TIME_FORMATS = {
  SYSTEM: 'system' as const,
  TWELVE_HOUR: '12h' as const,
  TWENTY_FOUR_HOUR: '24h' as const,
} as const;

// Export format labels for UI
export const TIME_FORMAT_LABELS = {
  system: 'Use device setting',
  '12h': '12-hour (AM/PM)',
  '24h': '24-hour',
} as const;
