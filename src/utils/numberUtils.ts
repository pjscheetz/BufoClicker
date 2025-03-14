/**
 * Utility functions for number operations and formatting
 */

/**
 * Rounds a number to the specified number of decimal places
 * @param value - The number to round
 * @param decimals - Number of decimal places (defaults to 2)
 * @returns The rounded number
 */
export function roundTo(value: number, decimals: number = 2): number {
    if (!Number.isFinite(value)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
  
  /**
   * Clamps a value between minimum and maximum bounds
   * @param value - The value to clamp
   * @param min - Minimum allowed value
   * @param max - Maximum allowed value
   * @returns The clamped value
   */
  export function clamp(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }
  
  /**
   * Calculates cost with exponential growth
   * Useful for calculating increasing costs of generators or upgrades
   * @param baseCost - The initial cost
   * @param multiplier - The growth multiplier
   * @param owned - Number of items already owned
   * @returns The calculated cost
   */
  export function calculateExponentialCost(baseCost: number, multiplier: number, owned: number): number {
    if (owned < 0) owned = 0;
    return baseCost * Math.pow(multiplier, owned);
  }
  
/**
 * Formats a number with shortened suffixes (K, M, B, T, etc.)
 * @param value - The number to format
 * @param decimals - Number of decimal places (defaults to 1)
 * @returns Formatted string
 */
export function formatNumber(value: number, decimals: number = 1): string {
  if (!Number.isFinite(value)) return "0";
  if (value === 0) return "0";
  
  const absValue = Math.abs(value);
  
  if (absValue < 1000) {
    return roundTo(value, decimals).toLocaleString();
  }
  
  const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  const exponent = Math.min(Math.floor(Math.log10(absValue) / 3), suffixes.length - 1);
  const scaled = value / Math.pow(10, exponent * 3);
  
  return `${roundTo(scaled, decimals)}${suffixes[exponent]}`;
}

/**
 * Formats a number with shortened suffixes but always shows 3 significant digits
 * Used for primary resource display
 * @param value - The number to format
 * @returns Formatted string with 3 significant digits
 */
/**
 * Formats a number with shortened suffixes but always shows exactly 3 decimal places for numbers >= 1000
 * Used for primary resource display
 * @param value - The number to format
 * @returns Formatted string with exactly 3 decimal places for larger numbers
 */
export function formatNumberWithPrecision(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value === 0) return "0";
  
  const absValue = Math.abs(value);
  
  if (absValue < 1000) {
    return Math.floor(value).toLocaleString();
  }
  
  const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  const exponent = Math.min(Math.floor(Math.log10(absValue) / 3), suffixes.length - 1);
  const scaled = value / Math.pow(10, exponent * 3);
  
  // Always use exactly 3 decimal places with toFixed to force showing trailing zeros
  const formattedNumber = roundTo(scaled, 3).toFixed(3);
  
  return `${formattedNumber}`;
}
/**
 * Returns the full word for a number suffix
 * @param value - The number to get the full word for
 * @returns The full word representation of the number magnitude
 */
export function getNumberFullName(value: number): string {
  if (!Number.isFinite(value)) return "";
  if (value === 0) return "";
  
  const absValue = Math.abs(value);
  
  if (absValue < 1000) {
    return "";
  }
  
  const fullNames = [
    "", 
    "Thousand", 
    "Million", 
    "Billion", 
    "Trillion", 
    "Quadrillion", 
    "Quintillion", 
    "Sextillion", 
    "Septillion", 
    "Octillion", 
    "Nonillion", 
    "Decillion"
  ];
  
  const exponent = Math.min(Math.floor(Math.log10(absValue) / 3), fullNames.length - 1);
  
  return fullNames[exponent];
}
  /**
   * Formats a duration in seconds to a human-readable string
   * @param seconds - Number of seconds
   * @returns Formatted string like "5h 30m 10s"
   */
  export function formatDuration(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return "0s";
    
    if (seconds < 60) {
      return `${Math.floor(seconds)}s`;
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    let result = '';
    
    if (hours > 0) {
      result += `${hours}h `;
    }
    
    if (minutes > 0 || hours > 0) {
      result += `${minutes}m `;
    }
    
    result += `${remainingSeconds}s`;
    
    return result;
  }
  
  /**
   * Returns the percentage of a value relative to a total
   * @param value - The current value
   * @param total - The maximum value
   * @param decimals - Number of decimal places (defaults to 0)
   * @returns The percentage value
   */
  export function calculatePercentage(value: number, total: number, decimals: number = 0): number {
    if (!Number.isFinite(value) || !Number.isFinite(total) || total === 0) {
      return 0;
    }
    
    return roundTo((value / total) * 100, decimals);
  }
  
  /**
   * Formats a number as a percentage string
   * @param value - The value to format as percentage
   * @param decimals - Number of decimal places (defaults to 0)
   * @returns Formatted percentage string with % symbol
   */
  export function formatPercentage(value: number, decimals: number = 0): string {
    if (!Number.isFinite(value)) return "0%";
    return `${roundTo(value, decimals)}%`;
  }
  
  /**
   * Calculates the sum of an array of numbers
   * @param values - Array of numbers to sum
   * @returns The sum of all values
   */
  export function sum(values: number[]): number {
    if (!Array.isArray(values) || values.length === 0) {
      return 0;
    }
    
    return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
  }
  
  /**
   * Calculate the average of an array of numbers
   * @param values - Array of numbers
   * @returns The average value or 0 if empty array
   */
  export function average(values: number[]): number {
    if (!Array.isArray(values) || values.length === 0) {
      return 0;
    }
    
    return sum(values) / values.length;
  }