/**
 * Game data loader
 * Provides centralized loading of all game data files
 */
import { initializeGenerators, INITIAL_GENERATORS } from '../models/generators';
import { initializeUpgrades, INITIAL_UPGRADES } from '../models/upgrades';
import { initializeAchievements, INITIAL_ACHIEVEMENTS } from '../models/achievements';
import * as Logger from '../utils/logger';

/**
 * Game loading status
 */
export interface GameLoadingStatus {
  generators: boolean;
  upgrades: boolean;
  achievements: boolean;
  isComplete: boolean;
  error?: Error;
}

/**
 * Track loading status of all game data
 */
export const loadingStatus: GameLoadingStatus = {
  generators: false,
  upgrades: false,
  achievements: false,
  isComplete: false
};

/**
 * Check if all game data is loaded
 */
export function isGameDataLoaded(): boolean {
  return loadingStatus.generators && loadingStatus.upgrades && loadingStatus.achievements;
}

/**
 * Load all required game data
 * This should be called before game initialization
 */
export async function loadGameData(): Promise<GameLoadingStatus> {
  try {
    Logger.log('Loading game data...');
    
    // Load generators in parallel
    const loadGenerators = initializeGenerators()
      .then(generators => {
        loadingStatus.generators = true;
        Logger.log(`Loaded ${Object.keys(generators).length} generators`);
        return generators;
      })
      .catch(error => {
        Logger.error('Failed to load generators:', error);
        throw error;
      });
    
    // Load upgrades in parallel
    const loadUpgrades = initializeUpgrades()
      .then(upgrades => {
        loadingStatus.upgrades = true;
        Logger.log(`Loaded ${upgrades.length} upgrades`);
        return upgrades;
      })
      .catch(error => {
        Logger.error('Failed to load upgrades:', error);
        throw error;
      });
      const loadAchievements = initializeAchievements()
      .then(achievements => {
        loadingStatus.achievements = true;
        Logger.log(`Loaded ${achievements.length} upgrades`);
        return achievements;
      })
      .catch(error => {
        Logger.error('Failed to load achievements:', error);
        throw error;
      });
    // Wait for all data to load
    await Promise.all([loadGenerators, loadUpgrades, loadAchievements]);
    
    // Update loading status
    loadingStatus.isComplete = true;
    
    Logger.log('All game data loaded successfully');
    
    return { ...loadingStatus };
  } catch (error) {
    // Update status with error
    loadingStatus.error = error instanceof Error ? error : new Error(String(error));
    Logger.error('Game data loading failed:', error);
    
    return { ...loadingStatus };
  }
}

/**
 * Verify data is loaded correctly
 * This is useful for debugging
 */
export function verifyGameData(): {
  generatorsLoaded: number;
  upgradesLoaded: number;
  isComplete: boolean;
} {
  return {
    generatorsLoaded: Object.keys(INITIAL_GENERATORS).length,
    upgradesLoaded: INITIAL_UPGRADES.length,
    isComplete: loadingStatus.isComplete
  };
}