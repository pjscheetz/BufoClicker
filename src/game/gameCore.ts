import { getStateManager } from '../core/stateManager';
import { getEventBus } from '../core/eventBus';
import { GameState } from '../core/types';
import { GeneratorManager, getGeneratorManager } from '../managers/generatorManager';
import { UpgradeManager, getUpgradeManager } from '../managers/upgradeManager';
import { ExplorerManager, getExplorerManager } from '../managers/explorerManager';
import { AchievementManager, getAchievementManager } from '../managers/achievementManager'; // Import AchievementManager
import { GeneratorType, GeneratorData } from '../models/generators';
import { AchievementCategory} from '../models/achievements';
import { Upgrade } from '../models/upgrades';
import { ExplorerData, ExplorationResult } from '../models/explorer';
import { saveGame, loadGame } from './gameSave';
import { DEFAULT_GAME_STATE } from './gameState';
import * as Logger from '../utils/logger';
import { 
  GAME_STARTED, 
  GAME_PAUSED, 
  GAME_RESET, 
  GAME_SAVED, 
  GAME_LOADED,
  GENERATOR_PURCHASED,
  GENERATOR_UNLOCKED,
  GENERATOR_PRODUCTION_UPDATED,
  UPGRADE_PURCHASED,
  UPGRADES_AVAILABLE,
  EXPLORATION_STARTED,
  EXPLORATION_COMPLETED,
  EXPLORER_LEVEL_UP,
  EXPLORER_STAT_UPGRADED,
  EXPLORER_STATE_CHANGED,
  ACHIEVEMENT_UNLOCKED // Add ACHIEVEMENT_UNLOCKED event
} from '../core/eventTypes';



/**
 * Interface for Generator events
 */
interface GeneratorEvents {
  onGeneratorPurchased: (generator: GeneratorData, quantity: number, cost: number) => void;
  onGeneratorUnlocked: (generator: GeneratorData) => void;
  onProductionChanged: (totalProduction: number) => void;
  onBoostChanged: (generator: GeneratorData, boostId: string, active: boolean) => void;
}

/**
 * Interface for Explorer events
 */
interface ExplorerEvents {
  onExplorerUpdated: (explorer: ExplorerData) => void;
  onExplorationStarted: (explorer: ExplorerData, area: string) => void;
  onExplorationCompleted: (explorer: ExplorerData, result: ExplorationResult) => void;
  onExplorerLevelUp: (explorer: ExplorerData, newLevel: number) => void;
  onExplorerStateChanged: (explorer: ExplorerData, previousState: string) => void;
  onExplorerStatUpgraded: (explorer: ExplorerData, statName: string, newLevel: number) => void;
  onEnemyEncountered: (explorer: ExplorerData, enemy: any) => void;
  onCombatAction: (combatResult: any) => void;
  onCombatEnded: (explorer: ExplorerData, enemy: any, victory: boolean, rewards: any) => void;
}

/**
 * GameCore class
 * Central controller for the game that coordinates all major components
 * Implemented as a singleton
 */
export class GameCore {
  private static instance: GameCore;
  
  /** Generator manager instance */
  private generatorManager: GeneratorManager;
  /** Upgrade manager instance */
  private upgradeManager: UpgradeManager;
  /** Explorer manager instance */
  private explorerManager: ExplorerManager;
  /** Achievement manager instance */
  private achievementManager: AchievementManager;
  /** Is the game currently running */
  private isRunning: boolean = false;
  /** Auto-save enabled flag */
  private autoSaveEnabled: boolean = true;
  /** Save interval ID */
  private saveIntervalId: number | null = null;
  /** Save rate in milliseconds (1 minute) */
  private readonly SAVE_RATE_MS: number = 60 * 1000;

  // Click tracking
  public clickCount: number = 0;
  private clickMultiplier: number = 1;
  private lastClickTime: number = 0;
  private clickCombo: number = 0;
  private maxCombo: number = 0;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize managers using singleton instances
    this.generatorManager = getGeneratorManager();
    this.upgradeManager = getUpgradeManager();
    this.explorerManager = getExplorerManager();
    this.achievementManager = getAchievementManager(); // Initialize achievement manager

    // Register event handlers
    this.registerManagerEvents();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): GameCore {
    if (!GameCore.instance) {
      GameCore.instance = new GameCore();
    }
    return GameCore.instance;
  }

/**
 * Initialize the game
 * Called when the game first loads
 */
public init(): void {
  Logger.log('Initializing GameCore...');
  
  // Create a flag to track if we loaded a saved game
  let loadedSavedGame = false;
  
  // Try to load saved game
  const loadedSuccessfully = loadGame();
  loadedSavedGame = loadedSuccessfully;
  
  // If no saved game was loaded, use default state
  if (!loadedSuccessfully) {
    // Reset to default state
    this.resetState();
    
    // Ensure firstStartTime is set for new games
    const now = Date.now();
    getStateManager().setState({
      gameSettings: {
        firstStartTime: now
      }
    });
  }
  
  // Sync clickCount between state and game core
  const state = getStateManager().getState();
  this.clickCount = state.resources.clickCount || 0;
  
  // Read auto-save setting from state
  this.autoSaveEnabled = state.gameSettings.autoSave !== false; // Default to true if not set
  
  // Initialize manager components
  this.upgradeManager.initialize();
  
  // Initialize achievement manager with silentLoad=true if we loaded a saved game
  // This prevents notifications for already unlocked achievements
  this.achievementManager.initialize(loadedSavedGame);
  
  // Start the game
  this.start();
  
  // Set up auto-save if enabled
  this.setupAutoSave();
  
  // Check for unlocks immediately after initialization
  this.checkUnlocks();
  
  // Refresh shop displays
  this.getGeneratorManager().recalculateAllGenerators();
  
  // Force another check and refresh after a short delay to make sure UI updates
  setTimeout(() => {
    this.checkUnlocks();
    this.getGeneratorManager().recalculateAllGenerators();
    
    // Only check for achievements if we didn't load a saved game
    // This prevents duplicate notifications after game load
    if (!loadedSavedGame) {
      this.achievementManager.checkAllAchievements();
    }
    
    // Force refresh of UI components
    getEventBus().emit('refreshUI', { force: true });
  }, 100);
}
  /**
   * Start the game
   */
  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Emit event that game has started
    getEventBus().emit(GAME_STARTED);
    
    Logger.log('Game started');
  }

  /**
   * Stop the game
   */
  public stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    // Emit event that game has paused
    getEventBus().emit(GAME_PAUSED);
    
    Logger.log('Game paused');
  }

/**
 * Reset the game state
 */
public resetState(): void {
  // Get current state to preserve the first start time
  const currentState = getStateManager().getState();
  const firstStartTime = currentState.gameSettings?.firstStartTime || Date.now();
  
  // Reset state manager
  getStateManager().resetState();
  
  // Reset all managers
  this.generatorManager.reset();
  this.upgradeManager.reset();
  this.explorerManager.reset();
  this.achievementManager.reset(); // Reset achievement manager
  
  // Reset click tracking
  this.clickCount = 0;
  this.clickMultiplier = 1;
  this.clickCombo = 0;
  this.maxCombo = 0;
  
  // Update the state manager with default state
  getStateManager().setState({
    ...DEFAULT_GAME_STATE,
    gameSettings: {
      ...DEFAULT_GAME_STATE.gameSettings,
      lastTick: Date.now(),
      lastSaved: Date.now(),
      firstStartTime: Date.now() // Preserve the original start time
    }
  });
  
  // Emit reset event
  getEventBus().emit(GAME_RESET);
  
  Logger.log('Game state reset');
}

  /**
   * Register event handlers for managers
   */
  private registerManagerEvents(): void {
    // Register generator events
    this.registerGeneratorEvents();
    
    // Register explorer events
    this.registerExplorerEvents();
  }

  /**
   * Register generator events
   */
  private registerGeneratorEvents(): void {
    // Note: In the actual implementation, ensure GeneratorManager has a registerEvents method
    // or adapt this code to match how your manager handles events
    const generatorEvents: GeneratorEvents = {
      onGeneratorPurchased: (generator: GeneratorData, quantity: number, cost: number) => {
        getEventBus().emit(GENERATOR_PURCHASED, {
          generator,
          quantity,
          cost
        });
      },
      
      onGeneratorUnlocked: (generator: GeneratorData) => {
        getEventBus().emit(GENERATOR_UNLOCKED, {
          generator
        });
      },
      
      onProductionChanged: (totalProduction: number) => {
        getEventBus().emit(GENERATOR_PRODUCTION_UPDATED, {
          totalProduction
        });
      },
      
      onBoostChanged: (generator: GeneratorData, boostId: string, active: boolean) => {
        getEventBus().emit('boostChanged', {
          generator,
          boostId,
          active
        });
      }
    };
    
    // Add event listeners or call appropriate methods on the manager
    // This is a placeholder - implement according to your actual event system
  }

  /**
   * Register explorer events
   */
  private registerExplorerEvents(): void {
    // Note: In the actual implementation, ensure ExplorerManager has a registerEvents method
    // or adapt this code to match how your manager handles events
    const explorerEvents: ExplorerEvents = {
      onExplorerUpdated: (explorer: ExplorerData) => {
        getEventBus().emit('explorerUpdated', {
          explorer
        });
      },
      
      onExplorationStarted: (explorer: ExplorerData, area: string) => {
        getEventBus().emit(EXPLORATION_STARTED, {
          explorer,
          area
        });
      },
      
      onExplorationCompleted: (explorer: ExplorerData, result: ExplorationResult) => {
        // Get current state
        const state = getStateManager().getState();
        
        // Update resources from exploration
        getStateManager().setState({
          resources: {
            bufos: state.resources.bufos + result.bufosGained,
            totalBufos: state.resources.totalBufos + result.bufosGained
          }
        });
        
        getEventBus().emit(EXPLORATION_COMPLETED, {
          explorer,
          result
        });
      },
      
      onExplorerLevelUp: (explorer: ExplorerData, newLevel: number) => {
        getEventBus().emit(EXPLORER_LEVEL_UP, {
          explorer,
          level: newLevel
        });
      },
      
      onExplorerStateChanged: (explorer: ExplorerData, previousState: string) => {
        getEventBus().emit(EXPLORER_STATE_CHANGED, {
          explorer,
          previousState
        });
      },
      
      onExplorerStatUpgraded: (explorer: ExplorerData, statName: string, newLevel: number) => {
        getEventBus().emit(EXPLORER_STAT_UPGRADED, {
          explorer,
          statName,
          level: newLevel
        });
      },
      
      onEnemyEncountered: (explorer: ExplorerData, enemy: any) => {
        getEventBus().emit('enemyEncountered', {
          explorer,
          enemy
        });
      },
      
      onCombatAction: (combatResult: any) => {
        getEventBus().emit('combatAction', combatResult);
      },
      
      onCombatEnded: (explorer: ExplorerData, enemy: any, victory: boolean, rewards: any) => {
        getEventBus().emit('combatEnded', {
          explorer,
          enemy,
          victory,
          rewards
        });
      }
    };
    
    // Add event listeners or call appropriate methods on the manager
    // This is a placeholder - implement according to your actual event system
  }

/**
 * Set up auto-save functionality
 * This will trigger saves at the specified interval, but only if auto-save is enabled
 */
private setupAutoSave(): void {
  // Clear existing interval if there is one
  if (this.saveIntervalId !== null) {
    window.clearInterval(this.saveIntervalId);
    this.saveIntervalId = null;
  }
  
  // Only create the interval if auto-save is enabled
  if (this.autoSaveEnabled) {
    this.saveIntervalId = window.setInterval(() => {
      if (this.isRunning) {
        // Only save if the game is running
        saveGame(true);
      }
    }, this.SAVE_RATE_MS);
  }
}

/**
 * Toggle auto-save on/off
 */
public toggleAutoSave(enabled: boolean): void {
  this.autoSaveEnabled = enabled;
  
  // Update in state
  getStateManager().setState({
    gameSettings: {
      autoSave: enabled
    }
  });
  
  // Reconfigure the auto-save interval
  this.setupAutoSave();
  
  // Emit the event
  getEventBus().emit('autoSaveToggled', { enabled });
}


/**
 * Get the current auto-save state
 */
public isAutoSaveEnabled(): boolean {
  return this.autoSaveEnabled;
}


/**
 * Process a click on the main bufo
 */
public click(): { 
  bufosGained: number; 
  isCombo: boolean;
  comboMultiplier: number;
} {
  const now = Date.now();
  const timeSinceLastClick = now - this.lastClickTime;
  this.lastClickTime = now;
  
  // Update click statistics
  this.clickCount++;
  
  // Track click count in achievement manager
  this.achievementManager.setClickCount(this.clickCount);
  
  // Store click count in game state
  const state = getStateManager().getState();
  getStateManager().setState({
    resources: {
      clickCount: (state.resources.clickCount || 0) + 1
    }
  });
  
  // Handle combo system
  let comboMultiplier = 1;
  let isCombo = false;
  
  if (timeSinceLastClick < 500) {
    this.clickCombo++;
    
    // Cap combo at 10
    if (this.clickCombo > 10) this.clickCombo = 10;
    
    // Apply combo multiplier (starts at 1.0, max 1.5)
    comboMultiplier = 1 + (this.clickCombo * 0.05);
    isCombo = true;
    
    // Track max combo
    if (this.clickCombo > this.maxCombo) {
      this.maxCombo = this.clickCombo;
    }
  } else {
    // Reset combo if too much time passed
    this.clickCombo = 0;
  }
  
  // Calculate bufos gained from this click
  // Use the dedicated clickPower which is already calculated based on clickMultiplier
  const baseClickValue = state.resources.clickPower;
  const totalMultiplier = comboMultiplier; // Only apply combo, clickMultiplier is already in clickPower
  const bufosGained = baseClickValue * totalMultiplier;
  
  // Update state with new bufo count
  getStateManager().setState({
    resources: {
      bufos: state.resources.bufos + bufosGained,
      totalBufos: state.resources.totalBufos + bufosGained
    }
  });
  
  // Check for unlocks
  this.checkUnlocks();
  
  // Check for achievements after click
  this.achievementManager.checkAchievementCategory(AchievementCategory.Clicks);
  
  // Emit click event
  getEventBus().emit('click', { 
    state: getStateManager().getState(),
    clickPower: bufosGained,
    totalClicks: this.clickCount,
    combo: this.clickCombo,
    comboMultiplier,
    isCombo
  });
  
  // Return click info for animations
  return {
    bufosGained,
    isCombo,
    comboMultiplier
  };
}
  /**
   * Check for new unlocks based on current state
   */
  public checkUnlocks(): void {
    const state = getStateManager().getState();
    
    // Check generator unlocks
    const newlyUnlocked = this.generatorManager.checkUnlocks(state.resources.totalBufos);
    
    // Check upgrade unlocks
    // Create a properly typed generatorCounts object that matches Record<GeneratorType, number>
    const generatorCounts = {} as Record<GeneratorType, number>;
    
    // Populate with actual values from state.generators
    Object.entries(state.generators).forEach(([type, generator]) => {
      // Type assertion to GeneratorType is safe here because the keys in state.generators
      // should all be valid GeneratorType values
      generatorCounts[type as GeneratorType] = generator.count;
    });
    
    const availableUpgrades = this.upgradeManager.checkAvailableUpgrades(state, generatorCounts);
    
    if (newlyUnlocked.length > 0 || availableUpgrades.length > 0) {
      getEventBus().emit('unlocksUpdated', { 
        generators: this.generatorManager.getUnlockedGenerators(), // Fixed - use existing method
        newlyUnlocked,
        availableUpgrades
      });
    }
  }
  
  /**
   * Process a game tick
   * @param deltaTimeSeconds Time since last tick in seconds
   */
  public processTick(deltaTimeSeconds: number): void {
    if (!this.isRunning) return;
    
    // Get current state
    const state = getStateManager().getState();
    
    // Process production
    this.processProduction(deltaTimeSeconds);
    
    // Update explorer
    const explorationResult = this.explorerManager.update(deltaTimeSeconds);
    
    // Check for new unlocks
    this.checkUnlocks();
    
    // Periodically check achievements (not every tick to save performance)
    if (Math.random() < 0.1) { // 10% chance each tick
      this.achievementManager.checkAllAchievements();
    }
    
    // Update last tick time
    getStateManager().setState({
      gameSettings: {
        lastTick: Date.now()
      }
    });
    
    // Emit tick event
    getEventBus().emit('tick', { 
      state: getStateManager().getState(),
      generators: this.generatorManager.getUnlockedGenerators(),
      totalProduction: this.generatorManager.calculateTotalProduction(),
      explorer: this.explorerManager.getExplorer()
    });
  }

  /**
   * Process production for a given time period
   */
  private processProduction(deltaTimeSeconds: number): void {
    // Optimization: Skip if time is too small
    if (deltaTimeSeconds < 0.001) return;
    
    // Get current state
    const state = getStateManager().getState();
    
    // Get the total production from all generators
    const totalProduction = this.generatorManager.calculateTotalProduction();
    
    // Calculate resources gained during this period
    const resourcesGained = totalProduction * deltaTimeSeconds;
    
    // Apply production to current resources
    getStateManager().setState({
      resources: {
        bufos: state.resources.bufos + resourcesGained,
        totalBufos: state.resources.totalBufos + resourcesGained
      }
    });
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    // Clean up auto-save interval
    if (this.saveIntervalId !== null) {
      window.clearInterval(this.saveIntervalId);
      this.saveIntervalId = null;
    }
    
    // Save game before destroying
    saveGame();
  }

  // Accessor methods for manager instances
  
  /**
   * Get the generator manager
   */
  public getGeneratorManager(): GeneratorManager {
    return this.generatorManager;
  }
  
  /**
   * Get the upgrade manager
   */
  public getUpgradeManager(): UpgradeManager {
    return this.upgradeManager;
  }
  
  /**
   * Get the explorer manager
   */
  public getExplorerManager(): ExplorerManager {
    return this.explorerManager;
  }
  
  /**
   * Get the achievement manager
   */
  public getAchievementManager(): AchievementManager {
    return this.achievementManager;
  }
}

/**
 * Get the singleton GameCore instance
 */
export function getGameCore(): GameCore {
  return GameCore.getInstance();
}