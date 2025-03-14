/**
 * Utility functions for time operations
 */

/**
 * Get current timestamp in milliseconds
 * @returns Current timestamp (milliseconds since epoch)
 */
export function getCurrentTime(): number {
    return Date.now();
  }
  
  /**
   * Calculate elapsed time between two timestamps
   * @param startTime - Start timestamp in milliseconds
   * @param endTime - End timestamp in milliseconds (defaults to current time)
   * @returns Elapsed time in milliseconds
   */
  export function calculateElapsedTime(startTime: number, endTime: number = getCurrentTime()): number {
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
      return 0;
    }
    return Math.max(0, endTime - startTime);
  }
  
  /**
   * Format a timestamp as a human-readable "time ago" string
   * @param timestamp - The timestamp to format
   * @param referenceTime - Reference timestamp (defaults to current time)
   * @returns Formatted string like "5 minutes ago"
   */
  export function formatTimeAgo(timestamp: number, referenceTime: number = getCurrentTime()): string {
    if (!Number.isFinite(timestamp)) return "unknown time ago";
    
    const elapsed = calculateElapsedTime(timestamp, referenceTime);
    
    // Convert to seconds
    const seconds = Math.floor(elapsed / 1000);
    
    if (seconds < 60) {
      return seconds === 1 ? "1 second ago" : `${seconds} seconds ago`;
    }
    
    // Convert to minutes
    const minutes = Math.floor(seconds / 60);
    
    if (minutes < 60) {
      return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
    }
    
    // Convert to hours
    const hours = Math.floor(minutes / 60);
    
    if (hours < 24) {
      return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    }
    
    // Convert to days
    const days = Math.floor(hours / 24);
    
    if (days < 30) {
      return days === 1 ? "1 day ago" : `${days} days ago`;
    }
    
    // Convert to months
    const months = Math.floor(days / 30);
    
    if (months < 12) {
      return months === 1 ? "1 month ago" : `${months} months ago`;
    }
    
    // Convert to years
    const years = Math.floor(months / 12);
    
    return years === 1 ? "1 year ago" : `${years} years ago`;
  }
  
  /**
   * Creates a throttled function that executes at most once per specified delay
   * @param fn - The function to throttle
   * @param delay - Minimum time between executions in milliseconds
   * @returns Throttled function
   */
  export function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let lastCall = 0;
    let timeoutId: number | null = null;
    
    return function(this: any, ...args: Parameters<T>): void {
      const now = getCurrentTime();
      const elapsed = now - lastCall;
      
      // Clear any pending timeouts
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (elapsed >= delay) {
        // Enough time has passed, execute immediately
        lastCall = now;
        fn.apply(this, args);
      } else {
        // Schedule execution after the remaining delay
        timeoutId = window.setTimeout(() => {
          lastCall = getCurrentTime();
          fn.apply(this, args);
          timeoutId = null;
        }, delay - elapsed);
      }
    };
  }
  
  /**
   * Creates a debounced function that executes only after a specified delay
   * without being called again
   * @param fn - The function to debounce
   * @param delay - Delay in milliseconds
   * @returns Debounced function
   */
  export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let timeoutId: number | null = null;
    
    return function(this: any, ...args: Parameters<T>): void {
      // Clear any pending timeout
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      
      // Schedule new timeout
      timeoutId = window.setTimeout(() => {
        fn.apply(this, args);
        timeoutId = null;
      }, delay);
    };
  }
  
  /**
   * Calculate frames per second based on elapsed time
   * @param deltaTimeMs - Time elapsed in milliseconds
   * @returns Calculated FPS
   */
  export function calculateFPS(deltaTimeMs: number): number {
    if (!Number.isFinite(deltaTimeMs) || deltaTimeMs <= 0) {
      return 0;
    }
    
    return Math.round(1000 / deltaTimeMs);
  }
  
  /**
   * Format a timestamp as a date string
   * @param timestamp - The timestamp to format
   * @param includeTime - Whether to include time (defaults to true)
   * @returns Formatted date string
   */
  export function formatTimestamp(timestamp: number, includeTime: boolean = true): string {
    if (!Number.isFinite(timestamp)) {
      return "Invalid date";
    }
    
    try {
      const date = new Date(timestamp);
      
      if (Number.isNaN(date.getTime())) {
        return "Invalid date";
      }
      
      const dateOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };
      
      if (includeTime) {
        dateOptions.hour = '2-digit';
        dateOptions.minute = '2-digit';
        dateOptions.second = '2-digit';
      }
      
      return date.toLocaleString(undefined, dateOptions);
    } catch (error) {
      return "Error formatting date";
    }
  }