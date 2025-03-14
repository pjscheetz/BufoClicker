/**
 * Main utility module index
 * Consolidates and exports all utility functions from their respective modules
 */

// Re-export all utility modules
export * from './numberUtils';
export * from './timeUtils';
export * from './domUtils';
export * from './storageUtils';
export * from './animationUtils';
export * from './mathUtils';
export * from './validationUtils';

// Log utilities are exported with a namespace
import * as LoggerModule from './logger';
export const Logger = LoggerModule;

/**
 * Creates a unique ID with an optional prefix
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID string
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix || ''}${timestamp}-${random}`;
}

/**
 * Checks if a value is defined (not null or undefined)
 * @param value - The value to check
 * @returns True if the value is defined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Checks if a value is null or undefined
 * @param value - The value to check
 * @returns True if the value is null or undefined
 */
export function isNullOrUndefined(value: any): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Provides a default value if the input is null or undefined
 * @param value - The value to check
 * @param defaultValue - The default value to use
 * @returns The original value or the default if undefined
 */
export function defaultIfNullOrUndefined<T>(value: T | null | undefined, defaultValue: T): T {
  return isNullOrUndefined(value) ? defaultValue : value;
}

/**
 * Deep clones an object or array
 * @param obj - The object to clone
 * @returns A deep clone of the object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  try {
    // Use structured clone API if available (modern browsers)
    if (typeof structuredClone === 'function') {
      return structuredClone(obj);
    }
    
    // Fallback to JSON method (with limitations for circular refs, functions, etc.)
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    console.error('Deep clone failed:', e);
    
    // Last resort: shallow copy
    if (Array.isArray(obj)) {
      return [...obj] as unknown as T;
    }
    
    return { ...obj };
  }
}

/**
 * Type guard to check if value is a plain object
 * @param value - Value to check
 * @returns True if the value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && 
         typeof value === 'object' && 
         !Array.isArray(value) &&
         Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * Safely parses a JSON string
 * @param jsonString - JSON string to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed object or default value
 */
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Safely stringifies an object to JSON
 * @param value - Value to stringify
 * @param defaultValue - Default string if stringification fails
 * @returns JSON string or default value
 */
export function safeJsonStringify(value: unknown, defaultValue: string = '{}'): string {
  try {
    return JSON.stringify(value);
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Creates a promise that resolves after specified milliseconds
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a cancellable promise that resolves after specified milliseconds
 * @param ms - Milliseconds to wait
 * @returns Object with promise and cancel function
 */
export function cancellableDelay(ms: number): { 
  promise: Promise<void>; 
  cancel: () => void;
} {
  let timeoutId: number;
  
  const promise = new Promise<void>((resolve) => {
    timeoutId = window.setTimeout(resolve, ms);
  });
  
  const cancel = () => {
    window.clearTimeout(timeoutId);
  };
  
  return { promise, cancel };
}

/**
 * Attempts to run a function with error handling
 * @param fn - Function to run
 * @param defaultValue - Default value to return on error
 * @returns Function result or default value on error
 */
export function attempt<T, U>(fn: () => T, defaultValue: U): T | U {
  try {
    return fn();
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Gets a random element from an array
 * @param array - Source array
 * @returns Random element or undefined if array is empty
 */
export function getRandomElement<T>(array: T[]): T | undefined {
  if (!Array.isArray(array) || array.length === 0) {
    return undefined;
  }
  
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param array - Array to shuffle
 * @returns New shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  if (!Array.isArray(array)) {
    return [];
  }
  
  const newArray = [...array];
  
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  
  return newArray;
}