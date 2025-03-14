/**
 * Utility functions for localStorage and data persistence
 */

/**
 * Checks if localStorage is available
 * @returns True if localStorage is available
 */
export function isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      const result = localStorage.getItem(testKey) === testKey;
      localStorage.removeItem(testKey);
      return result;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Saves data to localStorage
   * @param key - The key to store data under
   * @param data - The data to store (will be JSON serialized)
   * @returns True if the operation was successful
   */
  export function saveToStorage(key: string, data: any): boolean {
    if (!key) {
      console.error('Storage key is required');
      return false;
    }
    
    try {
      if (!isStorageAvailable()) {
        console.warn('localStorage is not available');
        return false;
      }
      
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
      
      if (error instanceof DOMException && (
        // Firefox
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        // Chrome
        error.name === 'QuotaExceededError' ||
        // Safari
        error.code === 22
      )) {
        console.warn('localStorage quota exceeded');
      }
      
      return false;
    }
  }
  
  /**
   * Loads data from localStorage
   * @param key - The key to retrieve data from
   * @param defaultValue - Default value if key doesn't exist
   * @returns The retrieved data (JSON parsed) or defaultValue
   */
  export function loadFromStorage<T>(key: string, defaultValue: T): T {
    if (!key) {
      console.error('Storage key is required');
      return defaultValue;
    }
    
    try {
      if (!isStorageAvailable()) {
        console.warn('localStorage is not available');
        return defaultValue;
      }
      
      const serialized = localStorage.getItem(key);
      
      if (serialized === null) {
        return defaultValue;
      }
      
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error(`Failed to load data from localStorage key "${key}":`, error);
      return defaultValue;
    }
  }
  
  /**
   * Clears a specific key from localStorage
   * @param key - The key to clear
   * @returns True if the operation was successful
   */
  export function clearStorage(key: string): boolean {
    if (!key) {
      console.error('Storage key is required');
      return false;
    }
    
    try {
      if (!isStorageAvailable()) {
        console.warn('localStorage is not available');
        return false;
      }
      
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to clear localStorage key "${key}":`, error);
      return false;
    }
  }
  
  /**
   * Clears all localStorage items
   * @returns True if the operation was successful
   */
  export function clearAllStorage(): boolean {
    try {
      if (!isStorageAvailable()) {
        console.warn('localStorage is not available');
        return false;
      }
      
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear all localStorage:', error);
      return false;
    }
  }
  
  /**
   * Exports data to a Base64 encoded string
   * @param data - The data to export
   * @returns Base64 encoded string or null if encoding failed
   */
  export function exportToString(data: any): string | null {
    try {
      const jsonString = JSON.stringify(data);
      return btoa(encodeURIComponent(jsonString));
    } catch (error) {
      console.error('Failed to export data to string:', error);
      return null;
    }
  }
  
  /**
   * Imports data from a Base64 encoded string
   * @param str - The Base64 encoded string
   * @returns The parsed data or null if decoding failed
   */
  export function importFromString<T>(str: string): T | null {
    if (!str) {
      console.error('Import string is required');
      return null;
    }
    
    try {
      const jsonString = decodeURIComponent(atob(str));
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('Failed to import data from string:', error);
      return null;
    }
  }
  
  /**
   * Gets the total size of all localStorage data in bytes
   * @returns Total size in bytes
   */
  export function getStorageSize(): number {
    if (!isStorageAvailable()) {
      console.warn('localStorage is not available');
      return 0;
    }
    
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key) {
        const value = localStorage.getItem(key) || '';
        totalSize += key.length + value.length;
      }
    }
    
    return totalSize * 2; // UTF-16 characters use 2 bytes
  }
  
  /**
   * Checks if a key exists in localStorage
   * @param key - The key to check
   * @returns True if the key exists
   */
  export function hasStorageKey(key: string): boolean {
    if (!key || !isStorageAvailable()) {
      return false;
    }
    
    return localStorage.getItem(key) !== null;
  }