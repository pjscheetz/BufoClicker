import { getStateManager } from '../core/stateManager';
import { getEventBus } from '../core/eventBus';
import { getSaveManager } from '../utils/saveManager';
import { getGameCore } from './gameCore';
import * as Logger from '../utils/logger';
import { GAME_SAVED, GAME_LOADED, GAME_RESET } from '../core/eventTypes';
import { GameState } from '../core/types';

/**
 * Save the current game state
 * This is the only place where game state is persisted to storage
 * @param auto Whether this is an auto-save
 * @returns Whether save was successful
 */
export function saveGame(auto: boolean = false): boolean {
  try {
    // Get the state manager and save manager
    const stateManager = getStateManager();
    const saveManager = getSaveManager();
    
    // Get the game core for managers and click count
    const gameCore = getGameCore();
    
    // Update last saved timestamp
    stateManager.setState({
      gameSettings: {
        lastSaved: Date.now()
      },
      // Ensure click count is saved from GameCore's value
      resources: {
        clickCount: gameCore.clickCount
      }
    });
    
    // Get the current state
    const state = stateManager.getState();
    
    // Get generators from generator manager
    const generators = gameCore.getGeneratorManager().getAllGenerators();
    
    // Get purchased upgrades from upgrade manager
    const purchasedUpgrades = gameCore.getUpgradeManager().getPurchasedUpgrades();
    
    // Get explorer data from explorer manager
    const explorer = gameCore.getExplorerManager().getExplorer();
    
    // Persist the game state using the save manager
    // This is the ONLY place where the game state is persisted to storage
    const success = saveManager.saveGame(
      state,
      generators,
      purchasedUpgrades,
      explorer
    );
    
    if (success) {
      // Log success
      Logger.log(`Game saved ${auto ? '(auto)' : '(manual)'}`);
      
      // Emit save event
      getEventBus().emit(GAME_SAVED, {
        timestamp: state.gameSettings?.lastSaved || Date.now(),
        auto
      });
    } else {
      Logger.error('Failed to save game');
      
      // Emit error event
      getEventBus().emit('saveError', {
        message: 'Failed to save game'
      });
    }
    
    return success;
  } catch (error) {
    Logger.error('Error saving game:', error);
    
    // Emit error event
    getEventBus().emit('saveError', {
      message: 'Error saving game',
      error
    });
    
    return false;
  }
}
/**
 * Calculate offline progress since last tick
 * @param lastTickTime Timestamp of last tick
 * @returns Offline progress data
 */
function calculateOfflineProgress(lastTickTime: number): {
  timeAway: number;
  production: number;
  cappedProduction: number;
  isCapped: boolean;
} | null {
  // Get the current time
  const now = Date.now();
  
  // Calculate time away in milliseconds
  const timeAwayMs = now - lastTickTime;
  
  // Only apply if more than a minute has passed
  if (timeAwayMs < 60 * 1000) {
    return null;
  }
  
  // Convert to seconds
  const timeAwaySeconds = timeAwayMs / 1000;
  
  // Cap offline time to prevent excessive gains (12 hours)
  const cappedTimeAwaySeconds = Math.min(timeAwaySeconds, 12 * 60 * 60);
  
  // Get the game core
  const gameCore = getGameCore();
  
  // Calculate production rate
  const productionRate = gameCore.getGeneratorManager().calculateTotalProduction();
  
  // Calculate total production during offline time
  const totalProduction = productionRate * timeAwaySeconds;
  const cappedProduction = productionRate * cappedTimeAwaySeconds;
  
  // Check if production was capped
  const isCapped = timeAwaySeconds > cappedTimeAwaySeconds;
  
  // Apply the capped production to current resources
  if (cappedProduction > 0) {
    // Get the state
    const state = getStateManager().getState();
    
    // Update resources
    getStateManager().setState({
      resources: {
        bufos: state.resources.bufos + cappedProduction,
        totalBufos: state.resources.totalBufos + cappedProduction
      }
    });
  }
  
  return {
    timeAway: timeAwaySeconds,
    production: totalProduction,
    cappedProduction,
    isCapped
  };
}

/**
 * Load saved game data
 * @returns Whether load was successful
 */
export function loadGame(): boolean {
  try {
    // Get the save manager
    const saveManager = getSaveManager();
    
    // Try to load saved game
    const saveData = saveManager.loadGame();
    
    // If no saved game, return false
    if (!saveData) {
      return false;
    }
    
    // Store the last tick time before overwriting
    const lastTickTime = saveData.state?.gameSettings?.lastTick || Date.now();
    
    // Get the state manager
    const stateManager = getStateManager();
    
    // Store the previously unlocked achievements to restore later
    const previouslyUnlockedAchievements = saveData.state.achievements?.unlocked || [];
    
    // Create a properly structured state object for the state manager
    // First ensure gameSettings exists
    const gameSettings = saveData.state.gameSettings || {};
    
    // Make sure the achievement state is properly preserved, but without unlocked achievements
    // We'll add them back silently later to avoid notifications
    const achievementState = {
      unlocked: [], // Start with empty unlocked achievements
      progress: saveData.state.achievements?.progress || {},
      clickCount: saveData.state.achievements?.clickCount || 0,
      customEvents: saveData.state.achievements?.customEvents || {}
    };
    
    // Preserve the first start time or set it if it doesn't exist
    const firstStartTime = gameSettings.firstStartTime || Date.now();
    
    // Preserve the total click count
    const clickCount = saveData.state.resources?.clickCount || saveData.state.achievements?.clickCount || 0;
    
    // Reconstruct the proper GameState structure
    const properState = {
      resources: {
        bufos: saveData.state.resources.bufos || 0,
        totalBufos: saveData.state.resources.totalBufos || 0,
        baseClickPower: saveData.state.resources.baseClickPower || 1,
        clickPower: saveData.state.resources.clickPower || 1,
        // Reset multipliers to 1 to avoid double-applying effects
        clickMultiplier: 1,
        productionMultiplier: 1,
        clickCount: clickCount // Preserve click count
      },
      generators: saveData.state.generators || {},
      explorer: saveData.state.explorer || {},
      upgrades: {
        purchased: saveData.state.upgrades?.purchased || [],
        available: saveData.state.upgrades?.available || []
      },
      achievements: achievementState,
      gameSettings: {
        ...gameSettings,
        lastTick: Date.now(), // Always update lastTick to current time
        lastSaved: gameSettings.lastSaved || Date.now(),
        autoSave: gameSettings.autoSave ?? true,
        version: gameSettings.version || '1.0.0',
        firstStartTime: firstStartTime // Preserve first start time
      }
    };
    
    // Load state into state manager
    const stateLoadSuccess = stateManager.loadState(properState);
    
    if (!stateLoadSuccess) {
      Logger.error('Failed to load state from save data');
      return false;
    }
  
    // Get the game core for managers
    const gameCore = getGameCore();
    
    // Set the click count in game core
    gameCore.clickCount = clickCount;
    
    // Reset and reload generators
    gameCore.getGeneratorManager().reset();
    
    // Remove any old upgrade boosts from generators
    Object.values(properState.generators).forEach(generator => {
      if (generator.boosts && generator.boosts.length > 0) {
        // Clear boosts that came from upgrades
        const nonUpgradeBoosts = generator.boosts.filter(
          boost => !boost.id.startsWith('upgrade_')
        );
        
        // Update generator in state
        stateManager.setState({
          generators: {
            [generator.id]: {
              boosts: nonUpgradeBoosts
            }
          }
        });
      }
    });
    
    // Get the Achievement Manager
    const achievementManager = gameCore.getAchievementManager();
    
    // Set a flag in the achievement manager to prevent notifications
    (achievementManager as any).isRestoringAchievements = true;
    
    // Set the click count in the achievement manager
    achievementManager.setClickCount(clickCount);
    
    // Now silently restore previously unlocked achievements
    if (previouslyUnlockedAchievements.length > 0) {
      // Silently unlock each previously unlocked achievement
      for (const achievementId of previouslyUnlockedAchievements) {
        achievementManager.silentUnlockAchievement(achievementId);
      }
      
      // Make sure to save the state with restored achievements
      achievementManager.saveToState();
    }
    
    // Reset the flag after restoring achievements
    setTimeout(() => {
      (achievementManager as any).isRestoringAchievements = false;
      // Reapply all achievement rewards
      achievementManager.reapplyAllAchievementRewards();
    }, 500);
    
    // Force check unlocks for generators
    gameCore.checkUnlocks();
    
    // Explicitly recalculate all generators
    gameCore.getGeneratorManager().recalculateAllGenerators();
    
    // Initialize upgrade manager which will apply all effects
    gameCore.getUpgradeManager().initialize();
    
    // Calculate and apply offline progress
    const offlineProgress = calculateOfflineProgress(lastTickTime);
    
    // Emit game loaded event
    getEventBus().emit(GAME_LOADED, {
      state: stateManager.getState()
    });
    
    // Emit offline progress event if applicable
    if (offlineProgress) {
      getEventBus().emit('offlineProgress', offlineProgress);
    }
    
    // Force refresh of UI components
    setTimeout(() => {
      gameCore.getGeneratorManager().recalculateAllGenerators();
      gameCore.checkUnlocks();
    }, 100);
    
    Logger.log('Game loaded successfully');
    
    return true;
  } catch (error) {
    Logger.error('Error loading game:', error);
    return false;
  }
}
/**
 * Export the current save as a string
 * @returns Base64 encoded save string
 */
export function exportSave(): string {
  try {
    const saveManager = getSaveManager();
    const saveString = saveManager.exportSave();
    
    Logger.log('Save data exported successfully');
    
    return saveString;
  } catch (error) {
    Logger.error('Error exporting save:', error);
    
    // Emit error event
    getEventBus().emit('exportError', {
      message: 'Error exporting save',
      error
    });
    
    throw error;
  }
}

/**
 * Import a save from a string
 * @param saveString Base64 encoded save string
 * @returns Whether import was successful
 */
export function importSave(saveString: string): boolean {
  try {
    const saveManager = getSaveManager();
    const success = saveManager.importSave(saveString);
    
    if (success) {
      // Reload the game with the new save data
      loadGame();
      
      // Emit import success event
      getEventBus().emit('saveImported');
      
      Logger.log('Save data imported successfully');
      
      return true;
    } else {
      // Emit import error event
      getEventBus().emit('importError', {
        message: 'Invalid save data'
      });
      
      Logger.error('Invalid save data format');
      
      return false;
    }
  } catch (error) {
    Logger.error('Error importing save:', error);
    
    // Emit error event
    getEventBus().emit('importError', {
      message: 'Error importing save',
      error
    });
    
    return false;
  }
}