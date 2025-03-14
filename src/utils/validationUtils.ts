/**
 * Utilities for validating data structures and values
 */

/**
 * Checks if a value is a valid number
 * @param value - The value to validate
 * @returns True if the value is a finite number
 */
export function isValidNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }
  
  /**
   * Checks if a value is a valid integer
   * @param value - The value to validate
   * @returns True if the value is an integer
   */
  export function isValidInteger(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value);
  }
  
  /**
   * Checks if a value is a valid positive number
   * @param value - The value to validate
   * @returns True if the value is a positive number
   */
  export function isPositiveNumber(value: unknown): value is number {
    return isValidNumber(value) && value > 0;
  }
  
  /**
   * Checks if a value is a valid non-negative number
   * @param value - The value to validate
   * @returns True if the value is zero or positive
   */
  export function isNonNegativeNumber(value: unknown): value is number {
    return isValidNumber(value) && value >= 0;
  }
  
  /**
   * Checks if a value is within a numeric range
   * @param value - The value to validate
   * @param min - Minimum allowed value
   * @param max - Maximum allowed value
   * @returns True if the value is within range
   */
  export function isInRange(value: unknown, min: number, max: number): value is number {
    return isValidNumber(value) && value >= min && value <= max;
  }
  
  /**
   * Checks if a value is a non-empty string
   * @param value - The value to validate
   * @returns True if the value is a non-empty string
   */
  export function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }
  
  /**
   * Checks if a value is a valid array
   * @param value - The value to validate
   * @returns True if the value is an array
   */
  export function isValidArray<T>(value: unknown): value is Array<T> {
    return Array.isArray(value);
  }
  
  /**
   * Checks if a value is a non-empty array
   * @param value - The value to validate
   * @returns True if the value is a non-empty array
   */
  export function isNonEmptyArray<T>(value: unknown): value is Array<T> {
    return Array.isArray(value) && value.length > 0;
  }
  
  /**
   * Checks if a value is a valid date
   * @param value - The value to validate
   * @returns True if the value is a valid date
   */
  export function isValidDate(value: unknown): value is Date {
    return value instanceof Date && !isNaN(value.getTime());
  }
  
  /**
   * Checks if a value is a valid object (not null, not array)
   * @param value - The value to validate
   * @returns True if the value is a valid object
   */
  export function isValidObject(value: unknown): value is object {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
  
  /**
   * Checks if a value has all required properties
   * @param value - The object to validate
   * @param requiredProps - Array of required property names
   * @returns True if the object has all required properties
   */
  export function hasRequiredProperties<T extends object>(
    value: T, 
    requiredProps: string[]
  ): boolean {
    if (!isValidObject(value)) return false;
    
    return requiredProps.every(prop => 
      Object.prototype.hasOwnProperty.call(value, prop) && 
      value[prop as keyof T] !== undefined
    );
  }
  
  /**
   * Validates an object against a schema of property validators
   * @param obj - The object to validate
   * @param schema - Object with property names and validator functions
   * @returns Object with validation results
   */
  export function validateObject<T extends object>(
    obj: T,
    schema: Record<keyof T, (value: any) => boolean>
  ): { 
    isValid: boolean;
    invalidProps: string[];
  } {
    if (!isValidObject(obj)) {
      return { isValid: false, invalidProps: ['[not an object]'] };
    }
    
    const invalidProps: string[] = [];
    
    for (const prop in schema) {
      if (Object.prototype.hasOwnProperty.call(schema, prop)) {
        const validator = schema[prop];
        
        // Check if property exists
        if (!Object.prototype.hasOwnProperty.call(obj, prop)) {
          invalidProps.push(String(prop));
          continue;
        }
        
        // Validate property
        if (!validator(obj[prop])) {
          invalidProps.push(String(prop));
        }
      }
    }
    
    return {
      isValid: invalidProps.length === 0,
      invalidProps
    };
  }
  
  /**
   * Checks if a string is a valid email format
   * @param value - String to validate
   * @returns True if string is valid email format
   */
  export function isValidEmail(value: string): boolean {
    if (!isNonEmptyString(value)) return false;
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }
  
  /**
   * Checks if a string is a valid URL format
   * @param value - String to validate
   * @returns True if string is valid URL format
   */
  export function isValidUrl(value: string): boolean {
    if (!isNonEmptyString(value)) return false;
    
    try {
      // Use URL constructor for validation
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Creates a validation result object
   * @param isValid - Whether validation passed
   * @param errors - Optional array of error messages
   * @returns Validation result object
   */
  export function createValidationResult(
    isValid: boolean, 
    errors: string[] = []
  ): { isValid: boolean; errors: string[] } {
    return {
      isValid,
      errors: isValid ? [] : errors
    };
  }
  
  /**
   * Validates a value is one of the allowed values
   * @param value - Value to check
   * @param allowedValues - Array of allowed values
   * @returns True if value is in allowed values
   */
  export function isOneOf<T>(value: T, allowedValues: T[]): boolean {
    return allowedValues.includes(value);
  }
  
  /**
   * Validates a save data object
   * This is a more specific function for game save validation
   * @param saveData - The save data to validate
   * @returns Validation result with errors if invalid
   */
  export function validateSaveData(saveData: unknown): { 
    isValid: boolean; 
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Must be an object
    if (!isValidObject(saveData)) {
      return createValidationResult(false, ['Save data must be an object']);
    }
    
    // Check save data structure
    const requiredProps = ['state', 'version'];
    
    if (!hasRequiredProperties(saveData, requiredProps)) {
      errors.push('Save data missing required properties');
    }
    
    // Additional type-specific checks
    const typedSaveData = saveData as Record<string, unknown>;
    
    if (typedSaveData.state && !isValidObject(typedSaveData.state)) {
      errors.push('Invalid state property');
    }
    
    if (typedSaveData.version && !isNonEmptyString(typedSaveData.version)) {
      errors.push('Invalid version property');
    }
    
    // Check for valid state structure if it exists
    if (isValidObject(typedSaveData.state)) {
      const state = typedSaveData.state as Record<string, unknown>;
      
      // Basic state property validation
      if (state.resources && !isValidObject(state.resources)) {
        errors.push('Invalid resources property');
      }
      
      if (state.gameSettings && !isValidObject(state.gameSettings)) {
        errors.push('Invalid gameSettings property');
      }
    }
    
    return createValidationResult(errors.length === 0, errors);
  }