import { getGeneratorManager, GeneratorManager } from './generatorManager';
import { getExplorerManager, ExplorerManager } from './explorerManager';
import { getUpgradeManager, UpgradeManager } from './upgradeManager';
import { getAchievementManager, AchievementManager } from './achievementManager';
import { INITIAL_UPGRADES } from '../models/upgrades';
import { INITIAL_GENERATORS } from '../models/generators';
import { INITIAL_ACHIEVEMENTS } from '../models/achievements';
import * as Logger from '../utils/logger';

/**
 * Initialize all game managers
 * This ensures all singleton instances are created and ready
 */
export function initializeManagers(): void {
  Logger.log('Initializing game managers');
  
  // Get instances to initialize them
  const generatorManager = getGeneratorManager();
  const explorerManager = getExplorerManager();
  const upgradeManager = getUpgradeManager();
  const achievementManager = getAchievementManager();
  
  // Log data status
  Logger.debug(`Available generators: ${Object.keys(INITIAL_GENERATORS).length}`);
  Logger.debug(`Available upgrades: ${INITIAL_UPGRADES.length}`);
  Logger.debug(`Available achievements: ${INITIAL_ACHIEVEMENTS.length}`);
  
  // Update the upgrade manager with upgrades loaded from JSON
  if (INITIAL_UPGRADES.length > 0) {
    upgradeManager.setUpgrades(INITIAL_UPGRADES);
    Logger.log(`Initialized upgrade manager with ${INITIAL_UPGRADES.length} upgrades`);
  } else {
    Logger.warn('No upgrades data available during manager initialization');
  }
  
  // Check for generators data
  if (Object.keys(INITIAL_GENERATORS).length > 0) {
    // Recalculate all generators
    generatorManager.recalculateAllGenerators();
    Logger.log(`Initialized generator manager with ${Object.keys(INITIAL_GENERATORS).length} generators`);
  } else {
    Logger.warn('No generators data available during manager initialization');
  }
  
  Logger.log('Game managers initialized successfully');
}

/**
 * Reset all managers
 * Called when resetting game state
 */
export function resetManagers(): void {
  // Reset each manager
  getGeneratorManager().reset();
  getExplorerManager().reset();
  getUpgradeManager().reset();
  getAchievementManager().reset();
}

// Export all managers
export {
  getGeneratorManager,
  GeneratorManager,
  getExplorerManager,
  ExplorerManager,
  getUpgradeManager,
  UpgradeManager,
  getAchievementManager,
  AchievementManager
};