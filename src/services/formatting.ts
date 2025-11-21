import { CHARACTER_LIMIT, ResponseFormat } from "../constants.js";

export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return "N/A";
  return value.toLocaleString('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/A";
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().split('T')[0];
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

export function formatCurrency(value: number | null | undefined, currency: string = "USD"): string {
  if (value === null || value === undefined) return "N/A";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(value);
}

export function formatMarketCap(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/A";
  
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  return formatCurrency(value);
}

export function truncateText(text: string, maxLength: number = CHARACTER_LIMIT): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  const truncated = text.substring(0, maxLength - 100);
  return `${truncated}\n\n... (truncated, exceeded ${maxLength} character limit)`;
}

export function formatResponse<T>(
  data: T,
  format: ResponseFormat,
  markdownFormatter?: (data: T) => string
): { text: string; structured: T } {
  if (format === ResponseFormat.JSON || !markdownFormatter) {
    return {
      text: JSON.stringify(data, null, 2),
      structured: data
    };
  }
  
  return {
    text: markdownFormatter(data),
    structured: data
  };
}
