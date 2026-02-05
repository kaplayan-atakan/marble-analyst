/**
 * Number formatting utilities for the marble tracking system
 */

/**
 * Format number with locale-specific separators
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 2,
  locale: string = 'tr-TR'
): string {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format currency value
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: string = 'USD',
  locale: string = 'tr-TR'
): string {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format percentage
 */
export function formatPercent(
  value: number | null | undefined,
  decimals: number = 1
): string {
  if (value === null || value === undefined) return '-';
  return `%${(value * 100).toFixed(decimals)}`;
}

/**
 * Format date to Turkish locale
 */
export function formatDate(
  dateString: string | null | undefined,
  locale: string = 'tr-TR'
): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(locale);
}

/**
 * Format m² value
 */
export function formatM2(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `${formatNumber(value, 2)} m²`;
}

/**
 * Format m³ value
 */
export function formatM3(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `${formatNumber(value, 3)} m³`;
}

/**
 * Format ton value
 */
export function formatTon(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `${formatNumber(value, 2)} ton`;
}
