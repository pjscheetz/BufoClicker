/**
 * Utility for loading and managing game data from JSON files
 */
import * as Logger from './logger';

/**
 * Load JSON data from a file
 * @param filePath Path to the JSON file
 * @returns Promise that resolves with the parsed JSON data
 */
export async function loadJsonData<T>(filePath: string): Promise<T> {
  try {
    Logger.debug(`Attempting to load data from ${filePath}`);
    
    // Add cache-busting parameter to prevent browser caching
    const cacheBuster = `?_=${Date.now()}`;
    //const url = process.env.NODE_ENV === 'development' ? `${filePath}${cacheBuster}` : filePath;
    const url = process.env.NODE_ENV === 'development' ? `${filePath}` : filePath;
    // Set up a timeout to prevent hanging forever on network issues
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout loading ${filePath}`)), 10000);
    });
    
    // Actual fetch request
    const fetchPromise = fetch(url);
    
    // Race the fetch against the timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    
    if (!response.ok) {
      throw new Error(`Failed to load data from ${filePath}: ${response.status} ${response.statusText}`);
    }
    
    // Get the response text
    const text = await response.text();
    Logger.debug(`Received response from ${filePath} (${text.length} bytes)`);
    
      // Try to parse the JSON
      try {
        const data = JSON.parse(text);
        Logger.debug(`Successfully parsed JSON data from ${filePath}`);
        return data as T;
      } catch (error) {
        // Handle the error as unknown type
        const parseError = error as Error;
        Logger.error(`Error parsing JSON from ${filePath}:`, parseError);
        Logger.debug(`First 100 chars of response: ${text.substring(0, 100)}...`);
        throw new Error(`Invalid JSON in ${filePath}: ${parseError.message || 'Unknown parse error'}`);
    }
  } catch (error) {
    Logger.error(`Error loading data from ${filePath}:`, error);
    throw error;
  }
}

/**
 * Load multiple JSON files and return their data as an object
 * @param fileMap Map of keys to file paths
 * @returns Promise that resolves with an object containing all loaded data
 */
export async function loadMultipleJsonData<T>(
  fileMap: Record<string, string>
): Promise<Record<string, T>> {
  const results: Record<string, T> = {};
  const errors: Error[] = [];

  await Promise.all(
    Object.entries(fileMap).map(async ([key, filePath]) => {
      try {
        const data = await loadJsonData<T>(filePath);
        results[key] = data;
      } catch (error) {
        errors.push(error as Error);
      }
    })
  );

  if (errors.length > 0) {
    Logger.warn('Some data files failed to load:', errors);
  }

  return results;
}

/**
 * Check if data needs to be loaded or reloaded
 * @param cacheKey Key for cache validation
 * @param version Current data version
 * @returns True if data should be loaded/reloaded
 */
export function shouldLoadData(cacheKey: string, version: string): boolean {
  try {
    const cachedVersion = localStorage.getItem(`${cacheKey}_version`);
    
    // Load if no cached version or version mismatch
    if (!cachedVersion || cachedVersion !== version) {
      return true;
    }
    
    return false;
  } catch (error) {
    // If there's any error checking the cache, reload to be safe
    return true;
  }
}

/**
 * Update the cache version after loading data
 * @param cacheKey Key for cache validation
 * @param version Current data version
 */
export function updateDataCacheVersion(cacheKey: string, version: string): void {
  try {
    localStorage.setItem(`${cacheKey}_version`, version);
  } catch (error) {
    Logger.warn(`Failed to update data cache version for ${cacheKey}:`, error);
  }
}