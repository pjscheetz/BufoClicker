/**
 * Math utility functions for common operations
 */

/**
 * Generates a random integer between min and max (inclusive)
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random integer
 */
export function randomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    // The maximum is inclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  /**
   * Generates a random float between min and max (inclusive)
   * @param min - Minimum value
   * @param max - Maximum value
   * @param decimals - Number of decimal places (default: 2)
   * @returns Random float
   */
  export function randomFloat(min: number, max: number, decimals: number = 2): number {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return 0;
    }
    
    const random = Math.random() * (max - min) + min;
    const factor = Math.pow(10, decimals);
    return Math.round(random * factor) / factor;
  }
  
  /**
   * Maps a value from one range to another
   * @param value - The value to map
   * @param fromMin - Source range minimum
   * @param fromMax - Source range maximum
   * @param toMin - Target range minimum
   * @param toMax - Target range maximum
   * @param clamp - Whether to clamp the result to the target range (default: true)
   * @returns Mapped value
   */
  export function mapRange(
    value: number,
    fromMin: number,
    fromMax: number,
    toMin: number,
    toMax: number,
    clamp: boolean = true
  ): number {
    if (!Number.isFinite(value) || !Number.isFinite(fromMin) || !Number.isFinite(fromMax) ||
        !Number.isFinite(toMin) || !Number.isFinite(toMax) || fromMax === fromMin) {
      return toMin;
    }
    
    const result = ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin;
    
    if (clamp) {
      if (toMin < toMax) {
        return Math.max(toMin, Math.min(toMax, result));
      } else {
        return Math.max(toMax, Math.min(toMin, result));
      }
    }
    
    return result;
  }
  
  /**
   * Checks if a value is within a range (inclusive)
   * @param value - The value to check
   * @param min - Range minimum
   * @param max - Range maximum
   * @returns True if value is within range
   */
  export function inRange(value: number, min: number, max: number): boolean {
    if (!Number.isFinite(value)) return false;
    
    // Swap if min > max
    if (min > max) {
      [min, max] = [max, min];
    }
    
    return value >= min && value <= max;
  }
  
  /**
   * Calculates the linear interpolation between two values
   * @param start - Start value
   * @param end - End value
   * @param t - Interpolation factor (0-1)
   * @returns Interpolated value
   */
  export function lerp(start: number, end: number, t: number): number {
    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(t)) {
      return start;
    }
    
    // Clamp t to 0-1 range
    t = Math.max(0, Math.min(1, t));
    
    return start * (1 - t) + end * t;
  }
  
  /**
   * Calculates the inverse linear interpolation
   * Returns where a value falls between start and end as a 0-1 factor
   * @param start - Start value
   * @param end - End value
   * @param value - Value to find
   * @returns Normalized position (0-1)
   */
  export function inverseLerp(start: number, end: number, value: number): number {
    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(value)) {
      return 0;
    }
    
    if (start === end) return 0;
    
    const result = (value - start) / (end - start);
    return Math.max(0, Math.min(1, result));
  }
  
  /**
   * Calculates the distance between two points
   * @param x1 - First point x coordinate
   * @param y1 - First point y coordinate
   * @param x2 - Second point x coordinate
   * @param y2 - Second point y coordinate
   * @returns Distance between points
   */
  export function distance(x1: number, y1: number, x2: number, y2: number): number {
    if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) {
      return 0;
    }
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Calculates the angle between two points in radians
   * @param x1 - First point x coordinate
   * @param y1 - First point y coordinate
   * @param x2 - Second point x coordinate
   * @param y2 - Second point y coordinate
   * @returns Angle in radians
   */
  export function angle(x1: number, y1: number, x2: number, y2: number): number {
    if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) {
      return 0;
    }
    
    return Math.atan2(y2 - y1, x2 - x1);
  }
  
  /**
   * Converts radians to degrees
   * @param radians - Angle in radians
   * @returns Angle in degrees
   */
  export function toDegrees(radians: number): number {
    if (!Number.isFinite(radians)) return 0;
    return radians * (180 / Math.PI);
  }
  
  /**
   * Converts degrees to radians
   * @param degrees - Angle in degrees
   * @returns Angle in radians
   */
  export function toRadians(degrees: number): number {
    if (!Number.isFinite(degrees)) return 0;
    return degrees * (Math.PI / 180);
  }
  
  /**
   * Gets a vector position from an angle and distance
   * @param x - Origin x coordinate
   * @param y - Origin y coordinate
   * @param angle - Angle in radians
   * @param distance - Distance from origin
   * @returns [x, y] coordinates
   */
  export function pointFromAngle(x: number, y: number, angle: number, distance: number): [number, number] {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(angle) || !Number.isFinite(distance)) {
      return [x, y];
    }
    
    return [
      x + Math.cos(angle) * distance,
      y + Math.sin(angle) * distance
    ];
  }
  
  /**
   * Smoothly interpolates between two values with easing
   * @param start - Start value
   * @param end - End value
   * @param t - Progress (0-1)
   * @param smoothness - Smoothness factor (higher = smoother, default: 2)
   * @returns Smoothly interpolated value
   */
  export function smoothLerp(start: number, end: number, t: number, smoothness: number = 2): number {
    if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(t)) {
      return start;
    }
    
    // Clamp t to 0-1 range
    t = Math.max(0, Math.min(1, t));
    
    // Apply smoothstep function
    for (let i = 0; i < smoothness; i++) {
      t = t * t * (3 - 2 * t);
    }
    
    return start * (1 - t) + end * t;
  }
  
  /**
   * Generates a weighted random index based on weights array
   * @param weights - Array of weights
   * @returns Selected index
   */
  export function weightedRandom(weights: number[]): number {
    if (!Array.isArray(weights) || weights.length === 0) {
      return -1;
    }
    
    // Calculate sum of all weights
    let sum = 0;
    for (const weight of weights) {
      sum += Math.max(0, weight);
    }
    
    if (sum <= 0) {
      return -1;
    }
    
    // Pick a random value within the sum range
    const random = Math.random() * sum;
    
    // Find the index that contains this value
    let partialSum = 0;
    for (let i = 0; i < weights.length; i++) {
      partialSum += Math.max(0, weights[i]);
      if (random < partialSum) {
        return i;
      }
    }
    
    // Fallback (should rarely happen due to floating-point precision)
    return weights.length - 1;
  }
  
  /**
   * Calculates the factorial of a number
   * @param n - Number to calculate factorial of
   * @returns Factorial result or 1 for invalid inputs
   */
  export function factorial(n: number): number {
    if (!Number.isInteger(n) || n < 0) {
      return 1;
    }
    
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    
    return result;
  }
  
  /**
   * Calculates probability based on chance percentage
   * @param chance - Probability percentage (0-100)
   * @returns True if random chance succeeds
   */
  export function chance(chance: number): boolean {
    if (!Number.isFinite(chance)) return false;
    
    // Clamp chance between 0-100
    chance = Math.max(0, Math.min(100, chance));
    
    return Math.random() * 100 < chance;
  }
  
  /**
   * Generates normally distributed (Gaussian) random numbers
   * Uses Box-Muller transform
   * @param mean - Mean of the distribution (default: 0)
   * @param stdDev - Standard deviation (default: 1)
   * @returns Random number following normal distribution
   */
  export function randomNormal(mean: number = 0, stdDev: number = 1): number {
    if (!Number.isFinite(mean) || !Number.isFinite(stdDev)) {
      return 0;
    }
    
    // Box-Muller transform
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    
    // Apply mean and standard deviation
    return z * stdDev + mean;
  }