/**
 * Format as e.g., "Wed, Nov 25, 2026, 09:05 AM".
 */
const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Formats date string into user's local time zone.
 */
export const formatDate = (date: Date): string => dateTimeFormat.format(date);
