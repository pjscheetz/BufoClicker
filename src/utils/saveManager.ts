// src/utils/saveManager.ts
import { GameState } from '../core/types';
import * as Logger from './logger';
import { isStorageAvailable, saveToStorage, loadFromStorage, clearStorage } from './storageUtils';

// Storage key for localStorage
const STORAGE_KEY = 'bufo_idle_save';

// Define the save data interface to fix type issues
interface SaveData {
  state: GameState;
  generators: any;
  upgrades: string[];
  explorer: any;
  timestamp: number;
  version: string;
}

/**
 * Interface for the SaveManager
 */
export interface ISaveManager {
  /**
   * Save the game state
   * @param state Current game state
   * @param generators Current generators
   * @param purchasedUpgrades List of purchased upgrade IDs
   * @param explorer Explorer data
   * @returns Whether save was successful
   */
  saveGame(
    state: GameState,
    generators: any,
    purchasedUpgrades: string[],
    explorer: any
  ): boolean;
  
  /**
   * Load saved game data
   * @returns Saved game data or null if no save exists
   */
  loadGame(): {
    state: GameState;
    upgrades: string[];
    explorer: any;
  } | null;
  
  /**
   * Clear saved game data
   * @returns Whether clear was successful
   */
  clearSave(): boolean;
  
  /**
   * Export save data as a string
   * @returns Base64 encoded save string
   */
  exportSave(): string;
  
  /**
   * Import save data from a string
   * @param saveString Base64 encoded save string
   * @returns Whether import was successful
   */
  importSave(saveString: string): boolean;
}

/**
 * Implementation of SaveManager using localStorage
 * This implementation only persists state when explicitly requested through saveGame
 */
class SaveManager implements ISaveManager {
  private static instance: SaveManager;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }
  
  /**
   * Save the game state to localStorage
   * This is the only method that persists data to storage
   */
  public saveGame(
    state: GameState | any,
    generators: any,
    purchasedUpgrades: string[],
    explorer: any
  ): boolean {
    try {
      // Check if storage is available
      if (!isStorageAvailable()) {
        Logger.warn('localStorage is not available, cannot save game');
        return false;
      }
      
      // Create a save data object
      const saveData: SaveData = {
        state: state, // Store as-is, don't need to transform
        generators: generators,
        upgrades: purchasedUpgrades,
        explorer: explorer,
        timestamp: Date.now(),
        version: state.gameSettings?.version || '1.0.0'
      };
      
      // Use our storageUtils to save to localStorage
      const saveResult = saveToStorage(STORAGE_KEY, saveData);
      
      if (saveResult) {
        Logger.log(`Game saved successfully at ${new Date().toLocaleTimeString()}`);
      } else {
        Logger.error('Failed to save game to storage');
      }
      
      return saveResult;
    } catch (error) {
      Logger.error('Failed to save game:', error);
      return false;
    }
  }
  
  /**
   * Load saved game data from localStorage
   */
  public loadGame(): {
    state: GameState;
    upgrades: string[];
    explorer: any;
  } | null {
    try {
      // Check if storage is available
      if (!isStorageAvailable()) {
        Logger.warn('localStorage is not available, cannot load game');
        return null;
      }
      
      // Use our storageUtils to load from localStorage
      // Specify the type to avoid "never" type issues
      const saveData = loadFromStorage<SaveData | null>(STORAGE_KEY, null);
      
      if (!saveData) {
        Logger.log('No saved game found');
        return null;
      }
      
      // Basic validation
      if (!saveData.state) {
        Logger.warn('Invalid save data format');
        return null;
      }
      
      Logger.log(`Game loaded successfully (saved at ${new Date(saveData.timestamp).toLocaleString()})`);
      
      // Return in the format expected by the game code
      return {
        state: saveData.state,
        upgrades: saveData.upgrades || [],
        explorer: saveData.explorer || {}
      };
    } catch (error) {
      Logger.error('Error loading saved game:', error);
      return null;
    }
  }
  
  /**
   * Clear saved game data
   */
  public clearSave(): boolean {
    try {
      // Use our storageUtils to clear from localStorage
      const clearResult = clearStorage(STORAGE_KEY);
      
      if (clearResult) {
        Logger.log('Game save cleared');
      } else {
        Logger.error('Failed to clear save from storage');
      }
      
      return clearResult;
    } catch (error) {
      Logger.error('Failed to clear save:', error);
      return false;
    }
  }
  
  /**
   * Export save data as a string
   */
  public exportSave(): string {
    try {
      // Check if storage is available
      if (!isStorageAvailable()) {
        Logger.warn('localStorage is not available, cannot export save');
        return '';
      }
      
      const saveData = loadFromStorage<SaveData | null>(STORAGE_KEY, null);
      
      if (!saveData) {
        Logger.warn('No save data to export');
        return '';
      }
      
      // Base64 encode the save data for easier sharing
      return btoa(encodeURIComponent(JSON.stringify(saveData)));
    } catch (error) {
      Logger.error('Failed to export save:', error);
      return '';
    }
  }
  
  /**
   * Import save data from a string
   */
  public importSave(saveString: string): boolean {
    try {
      if (!saveString) {
        Logger.error('No save string provided');
        return false;
      }
      
      // Check if storage is available
      if (!isStorageAvailable()) {
        Logger.warn('localStorage is not available, cannot import save');
        return false;
      }
      
      // Decode the base64 save string
      const savedData = decodeURIComponent(atob(saveString));
      
      // Validate that it's valid JSON
      const saveData = JSON.parse(savedData) as SaveData;
      
      if (!saveData || !saveData.state) {
        Logger.error('Invalid save data format');
        return false;
      }
      
      // Store in localStorage using our storageUtils
      const saveResult = saveToStorage(STORAGE_KEY, saveData);
      
      if (saveResult) {
        Logger.log('Save data imported successfully');
      } else {
        Logger.error('Failed to save imported data to storage');
      }
      
      return saveResult;
    } catch (error) {
      Logger.error('Failed to import save:', error);
      return false;
    }
  }
}

/**
 * Get the SaveManager instance
 */
export function getSaveManager(): ISaveManager {
  return SaveManager.getInstance();
}