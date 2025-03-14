// src/managers/achievementManager.ts
import { getStateManager } from '../core/stateManager';
import { getEventBus } from '../core/eventBus';
import { getGameCore } from '../game/gameCore';
import * as Logger from '../utils/logger';
import { 
  Achievement, 
  AchievementCategory, 
  RequirementType, 
  RewardType,
  INITIAL_ACHIEVEMENTS,
  checkAchievementRequirement
} from '../models/achievements';
import { GeneratorType } from '../models/generators';

/**
 * New event types for achievements
 */
export const ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED';
export const ACHIEVEMENTS_UPDATED = 'ACHIEVEMENTS_UPDATED';

/**
 * AchievementManager handles tracking progress towards achievements
 * and unlocking them when requirements are met
 */
export class AchievementManager {
  private static instance: AchievementManager;
  
  /** All available achievements */
  private achievements: Achievement[] = [];
  
  /** Currently unlocked achievement IDs */
  private unlockedAchievements: Set<string> = new Set();
  
  /** Achievement progress tracking */
  private achievementProgress: Record<string, number> = {};
  
  /** Tracks custom events that have been triggered */
  private customEvents: Record<string, boolean> = {};
  
  /** Tracks if console has been opened */
  private consoleOpened: boolean = false;
  
  /** Click counter */
  private clickCount: number = 0;
  
  /** Original console.log function */
  private originalConsoleLog: any = null;
  
  /** Flag to prevent recursive console logs */
  private isProcessingConsoleLog: boolean = false;

  /**
  * Flag to prevent achievement notifications during state restore
  * @private
  */
  private isRestoringAchievements: boolean = false;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.achievements = [...INITIAL_ACHIEVEMENTS];
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): AchievementManager {
    if (!AchievementManager.instance) {
      AchievementManager.instance = new AchievementManager();
    }
    return AchievementManager.instance;
  }
  
/**
 * Initialize achievements and event listeners
 * @param silentLoad If true, don't trigger notifications for already unlocked achievements
 */
public initialize(silentLoad: boolean = false): void {
  Logger.log('Initializing Achievement Manager');
  
  // Register event listeners
  this.registerEventListeners();
  
  // Load unlocked achievements from state
  this.loadFromState();
  
  // Only check for new achievements if we're not doing a silent load
  if (!silentLoad) {
    // Check for any achievements that should be unlocked immediately
    this.checkAllAchievements();
  } else {
    // If silent load, set restoring flag to prevent notifications
    this.isRestoringAchievements = true;
    
    // Reset after a short delay
    setTimeout(() => {
      this.isRestoringAchievements = false;
    }, 1000);
  }
  
  Logger.log(`Achievement Manager initialized with ${this.achievements.length} achievements`);
}
  /**
   * Register event listeners for tracking achievement progress
   */
  private registerEventListeners(): void {
    const eventBus = getEventBus();
    
    // Track clicks
    eventBus.on('click', (data: any) => {
      this.clickCount++;
      this.checkAchievementCategory(AchievementCategory.Clicks);
    });
    
    // Track generator purchases
    eventBus.on('GENERATOR_PURCHASED', (data: any) => {
      this.checkAchievementCategory(AchievementCategory.Generators);
    });
    
    // Track production changes
    eventBus.on('GENERATOR_PRODUCTION_UPDATED', (data: any) => {
      this.checkAchievementCategory(AchievementCategory.Production);
    });
    
    // Track upgrades
    eventBus.on('UPGRADE_PURCHASED', (data: any) => {
      this.checkAchievementCategory(AchievementCategory.Special);
    });
    
    // Track game ticks for periodic checking
    eventBus.on('GAME_TICK', () => {
      // Periodically check all achievements (every few ticks)
      if (Math.random() < 0.1) { // ~10% chance each tick to check achievements
        this.checkAllAchievements();
      }
    });
    
    // Check for console opens (for the debug achievement)
    this.setupConsoleDetection();
  }
  
  /**
   * Setup detection for console opening
   */
private setupConsoleDetection(): void {

  window.addEventListener('keydown', (event) => {
    // Detect F12 or Ctrl+Shift+I
    if (event.key === 'F12' || (event.ctrlKey && event.shiftKey && event.key === 'I')) {
      this.consoleOpened = true;
      this.checkConsoleAchievement();
    }
  });
}
  
  /**
   * Check console-related achievements
   */
  private checkConsoleAchievement(): void {
    if (!this.consoleOpened) return;
    
    // Find console-related achievements
    const consoleAchievements = this.achievements.filter(a => 
      a.requirement.type === RequirementType.ConsoleOpened
    );
    
    for (const achievement of consoleAchievements) {
      this.unlockAchievement(achievement.id);
    }
    
    // Only show the greeting the first time and avoid recursive calls
    if (this.isProcessingConsoleLog === false && this.originalConsoleLog) {
      this.isProcessingConsoleLog = true;
      // Add a special greeting for console openers using the original console.log
      this.originalConsoleLog('%c🐸 Hello Debugger! You found a secret! 🐸', 'font-size: 20px; color: #4CAF50;');
      this.isProcessingConsoleLog = false;
    }
  }
  
/**
 * Load unlocked achievements from state
 */
private loadFromState(): void {
  const state = getStateManager().getState();
  
  // For now, we'll add an achievements array to the save state
  // In a future PR, we'll update the state interface to include achievements
  const achievementsState = (state as any).achievements;
  
  if (achievementsState?.unlocked) {
    // Convert to Set for faster lookups
    this.unlockedAchievements = new Set(achievementsState.unlocked);
    Logger.log(`Loaded ${this.unlockedAchievements.size} unlocked achievements`);
  }
  
  // Load click count if available
  if (achievementsState?.clickCount) {
    this.clickCount = achievementsState.clickCount;
  }
  
  // Load custom events if available
  if (achievementsState?.customEvents) {
    this.customEvents = {...achievementsState.customEvents};
  }
}
/**
 * Save current achievements state
 */
public saveToState(): void {
  const state = getStateManager().getState();
  
  getStateManager().setState({
    // Cast to any since we haven't updated the interface yet
    achievements: {
      unlocked: Array.from(this.unlockedAchievements),
      progress: {...this.achievementProgress},
      clickCount: this.clickCount,
      customEvents: {...this.customEvents}
      // We intentionally don't save consoleOpened state since it's detection-based
    }
  } as any);
}

/**
 * Check all achievements to see if any new ones should be unlocked
 */
public checkAllAchievements(): void {
  // Skip checking if we're currently restoring achievements
  if (this.isRestoringAchievements) {
    return;
  }
  
  // Get current state info needed for checks
  const state = getStateManager().getState();
  const generatorManager = getGameCore().getGeneratorManager();
  const totalProduction = generatorManager.calculateTotalProduction();
  
  // Calculate total generators owned
  let totalGenerators = 0;
  const generatorCounts: Record<GeneratorType, number> = {} as Record<GeneratorType, number>;
  
  Object.entries(state.generators).forEach(([type, generator]) => {
    const genType = type as GeneratorType;
    generatorCounts[genType] = generator.count;
    totalGenerators += generator.count;
  });
  
  // Create game state object for achievement checks
  const gameState = {
    totalBufos: state.resources.totalBufos,
    bufosPerSecond: totalProduction,
    totalGenerators,
    generatorCounts,
    clickCount: this.clickCount,
    consoleOpened: this.consoleOpened,
    upgradesPurchased: state.upgrades.purchased.length,
    explorationsCompleted: state.explorer.explorationsCompleted,
    customEvents: this.customEvents
  };
  
  // Check each achievement
  for (const achievement of this.achievements) {
    // Skip already unlocked achievements
    if (this.unlockedAchievements.has(achievement.id)) continue;
    
    // Check if requirements are met
    if (checkAchievementRequirement(achievement, gameState)) {
      this.unlockAchievement(achievement.id);
    }
  }
}
  /**
   * Check achievements for a specific category
   */
  public checkAchievementCategory(category: AchievementCategory): void {
    // Find achievements in the category that aren't unlocked yet
    const achievementsToCheck = this.achievements.filter(a => 
      a.category === category && !this.unlockedAchievements.has(a.id)
    );
    
    if (achievementsToCheck.length === 0) return;
    
    // Do a full check of all these achievements
    this.checkAllAchievements();
  }
  
/**
 * Unlock an achievement by ID
 */
public unlockAchievement(achievementId: string): boolean {
  // Skip if already unlocked
  if (this.unlockedAchievements.has(achievementId)) {
    return false;
  }
  
  // Find the achievement
  const achievement = this.achievements.find(a => a.id === achievementId);
  
  if (!achievement) {
    Logger.warn(`Tried to unlock non-existent achievement: ${achievementId}`);
    return false;
  }
  
  // Mark as unlocked
  this.unlockedAchievements.add(achievementId);
  
  // Apply rewards if any
  this.applyAchievementReward(achievement);
  
  // Log the unlock
  Logger.log(`Achievement unlocked: ${achievement.name}`);
  
  // Emit event only if we're not restoring achievements
  if (!this.isRestoringAchievements) {
    getEventBus().emit(ACHIEVEMENT_UNLOCKED, {
      achievement,
      timestamp: Date.now()
    });
  }
  
  // Save state
  this.saveToState();
  
  return true;
}

/**
 * Reapply all rewards from unlocked achievements
 * Call this after loading a game
 */
public reapplyAllAchievementRewards(): void {
  // Get all unlocked achievements
  const unlockedAchievements = this.getUnlockedAchievements();
  
  // Reapply each achievement's reward
  for (const achievement of unlockedAchievements) {
    if (achievement.reward) {
      this.applyAchievementReward(achievement);
    }
  }
}
/**
 * Silently unlock an achievement by ID (no notification or event emission)
 * Used for loading previously unlocked achievements without re-notifying
 * @param achievementId Achievement ID to unlock
 * @returns Whether the achievement was newly unlocked
 */
public silentUnlockAchievement(achievementId: string): boolean {
  // Set the restoring flag to prevent notifications
  const oldRestoringState = this.isRestoringAchievements;
  this.isRestoringAchievements = true;
  
  // Use the regular unlock method but with event suppression
  const result = this.unlockAchievement(achievementId);
  
  // Restore the previous flag state
  this.isRestoringAchievements = oldRestoringState;
  
  return result;
}

  /**
   * Apply the reward from an achievement
   */
  private applyAchievementReward(achievement: Achievement): void {
    if (!achievement.reward) return;
    
    const reward = achievement.reward;
    const gameCore = getGameCore();
    const state = getStateManager().getState();
    
    switch (reward.type) {
      case RewardType.ProductionBoost: {
        // Apply production multiplier
        getStateManager().setState({
          resources: {
            productionMultiplier: state.resources.productionMultiplier * reward.value
          }
        });
        
        // Recalculate all generators
        gameCore.getGeneratorManager().recalculateAllGenerators();
        break;
      }
      
      case RewardType.ClickBoost: {
        // Apply click multiplier
        getStateManager().setState({
          resources: {
            clickMultiplier: state.resources.clickMultiplier * reward.value
          }
        });
        break;
      }
      
      case RewardType.GeneratorBoost: {
        if (!reward.target) break;
        
        // Boost specific generator
        const generatorManager = gameCore.getGeneratorManager();
        generatorManager.applyBoostToGenerator(
          reward.target as GeneratorType,
          `achievement_${achievement.id}`,
          reward.value,
          `Achievement: ${achievement.name}`,
          true
        );
        break;
      }
      
      case RewardType.BufoBonus: {
        // Give one-time bufo bonus
        const bonus = reward.value;
        
        getStateManager().setState({
          resources: {
            bufos: state.resources.bufos + bonus,
            totalBufos: state.resources.totalBufos + bonus
          }
        });
        break;
      }
      
      // Other reward types require additional implementation
    }
  }
  
  /**
   * Get all achievements
   */
  public getAllAchievements(): Achievement[] {
    return [...this.achievements];
  }
  
  /**
   * Get unlocked achievements
   */
  public getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => this.unlockedAchievements.has(a.id));
  }
  
  /**
   * Get locked achievements that should be visible
   */
  public getVisibleLockedAchievements(): Achievement[] {
    return this.achievements.filter(a => 
      !this.unlockedAchievements.has(a.id) && !a.secret
    );
  }
  
  /**
   * Get achievement progress
   * @param achievementId Achievement to check
   * @returns Progress value between 0-1
   */
  public getAchievementProgress(achievementId: string): number {
    return this.achievementProgress[achievementId] || 0;
  }
  
  /**
   * Check if an achievement is unlocked
   */
  public isAchievementUnlocked(achievementId: string): boolean {
    return this.unlockedAchievements.has(achievementId);
  }
  
  /**
   * Get total number of achievements
   */
  public getTotalAchievementCount(): number {
    return this.achievements.length;
  }
  
  /**
   * Get number of unlocked achievements
   */
  public getUnlockedCount(): number {
    return this.unlockedAchievements.size;
  }
  
  /**
   * Get click count for click achievements
   */
  public getClickCount(): number {
    return this.clickCount;
  }
  
  /**
   * Manually set click count (for loading saves)
   */
  public setClickCount(count: number): void {
    this.clickCount = count;
    this.checkAchievementCategory(AchievementCategory.Clicks);
  }
  
  /**
   * Register a custom event occurred
   */
  public triggerCustomEvent(eventName: string): void {
    this.customEvents[eventName] = true;
    this.checkAllAchievements();
  }
    /**
   * Get the current custom events
   */
  public getCustomEvents(): Record<string, boolean> {
    return { ...this.customEvents };
  }

  /**
   * Get details for a specific achievement
   * @param achievementId Achievement ID to get details for
   * @returns Achievement object or undefined if not found
   */
  public getAchievementDetails(achievementId: string): Achievement | undefined {
    return this.achievements.find(a => a.id === achievementId);
  }

  /**
   * Get all custom event states
   */
  public getAllCustomEvents(): Record<string, boolean> {
    return { ...this.customEvents };
  }

  /**
   * Check if a custom event has occurred
   * @param eventName Name of the event to check
   * @returns Whether the event has occurred
   */
  public hasCustomEventOccurred(eventName: string): boolean {
    return this.customEvents[eventName] === true;
  }
  /**
   * Reset achievement manager state
   */
  public reset(): void {
    this.unlockedAchievements.clear();
    this.achievementProgress = {};
    this.customEvents = {};
    this.clickCount = 0;
    // Don't reset consoleOpened since it's a detection mechanism
    this.saveToState();
  }
}

/**
 * Get the AchievementManager instance
 */
export function getAchievementManager(): AchievementManager {
  return AchievementManager.getInstance();
}