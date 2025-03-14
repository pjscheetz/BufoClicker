import { getStateManager } from '../core/stateManager';
import { getEventBus } from '../core/eventBus';
import {
  ExplorerData,
  ExplorerState,
  ExplorationResult,
  updateExplorer,
  startExploration,
  upgradeExplorerStat,
  calculatePowerRating,
  calculateDPS,
  calculateSurvivalTime
} from '../models/explorer';

import {
  Enemy,
  generateEnemy,
  calculateEnemyRewards
} from '../models/enemies';

import {
  CombatState,
  CombatStatus,
  CombatActionType,
  initializeCombat,
  executeCombatAction,
  simulateCombat
} from '../models/combat';

import {
  EXPLORATION_STARTED,
  EXPLORATION_COMPLETED,
  EXPLORER_LEVEL_UP,
  EXPLORER_STAT_UPGRADED,
  EXPLORER_STATE_CHANGED
} from '../core/eventTypes';

/**
 * Explorer Manager class to handle all explorer-related operations
 * Uses the central state manager for state and event bus for events
 */
export class ExplorerManager {
  private static instance: ExplorerManager;
  
  /** List of available areas */
  private availableAreas: string[] = ['Pond', 'Creek', 'Swamp', 'River', 'Lake', 'Forest', 'Mountains', 'Dungeon'];
  /** Current combat state */
  private currentCombat: CombatState | null = null;
  /** Current enemy */
  private currentEnemy: Enemy | null = null;
  /** Last update timestamp */
  private lastUpdateTime: number = Date.now();
  /** Encounter probability per update */
  private encounterChance: number = 0.05; // 5% chance per update
  /** Exploration distance (increases during exploration) */
  private explorationDistance: number = 0;
  /** Max exploration distance per area */
  private maxExplorationDistance: number = 10;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ExplorerManager {
    if (!ExplorerManager.instance) {
      ExplorerManager.instance = new ExplorerManager();
    }
    return ExplorerManager.instance;
  }
  
  /**
   * Get current explorer data from state
   */
  private getExplorerFromState(): ExplorerData {
    return getStateManager().getState().explorer;
  }
  
  /**
   * Update explorer in state
   */
  private updateExplorerInState(updates: Partial<ExplorerData>): void {
    getStateManager().setState({
      explorer: updates
    });
  }
  
  /**
   * Get current explorer data
   */
  public getExplorer(): ExplorerData {
    return this.getExplorerFromState();
  }
  
  /**
   * Get current enemy (if in combat)
   */
  public getCurrentEnemy(): Enemy | null {
    return this.currentEnemy ? { ...this.currentEnemy } : null;
  }
  
  /**
   * Get current combat state (if in combat)
   */
  public getCurrentCombat(): CombatState | null {
    return this.currentCombat ? { ...this.currentCombat } : null;
  }
  
  /**
   * Update explorer during game tick
   * 
   * @param deltaTimeSeconds Time since last update in seconds
   */
  public update(deltaTimeSeconds: number): ExplorationResult | null {
    const currentTime = Date.now();
    const explorer = this.getExplorerFromState();
    
    // Skip if no time has passed
    if (deltaTimeSeconds <= 0) return null;
    
    // Handle combat state if in combat
    if (explorer.state === ExplorerState.Fighting && this.currentCombat) {
      // Implement combat AI or auto-resolve here
      return null;
    }
    
    // Only proceed with exploration updates if exploring
    if (explorer.state !== ExplorerState.Exploring) {
      // Update explorer
      const previousState = explorer.state;
      const updateResult = updateExplorer(explorer, deltaTimeSeconds);
      
      // Update the explorer data in state
      this.updateExplorerInState(updateResult.explorer);
      this.lastUpdateTime = currentTime;
      
      // Check for state change
      if (previousState !== updateResult.explorer.state) {
        getEventBus().emit(EXPLORER_STATE_CHANGED, {
          explorer: updateResult.explorer,
          previousState
        });
      }
      
      // Emit explorer updated event (custom event not in eventTypes)
      getEventBus().emit('EXPLORER_UPDATED', {
        explorer: updateResult.explorer
      });
      
      // Check if exploration completed
      if (updateResult.result) {
        getEventBus().emit(EXPLORATION_COMPLETED, {
          explorer: updateResult.explorer,
          result: updateResult.result
        });
        return updateResult.result;
      }
      
      return null;
    }
    
    // Exploration specific updates
    
    // Increment exploration distance
    this.explorationDistance += deltaTimeSeconds * 0.2; // 1 unit per 5 seconds
    
    // Check for enemy encounters
    if (Math.random() < this.encounterChance * deltaTimeSeconds) {
      this.generateEncounter();
      return null;
    }
    
    // Check if exploration is complete based on distance
    if (this.explorationDistance >= this.maxExplorationDistance) {
      // Calculate exploration time in seconds
      const explorationDuration = (currentTime - explorer.stateStartTime) / 1000;
      
      // Create exploration result
      const areaLevel = this.getAreaLevel(explorer.currentArea);
      const effectiveness = this.calculateAreaEffectiveness(explorer, areaLevel);
      
      // Calculate rewards
      const baseBuffos = areaLevel * 50 * effectiveness * (explorationDuration / 60);
      const luckModifier = 1 + (explorer.luck.value * explorer.luck.multiplier / 100);
      const bufosGained = Math.floor(baseBuffos * luckModifier);
      
      const baseExperience = areaLevel * 10 * (explorationDuration / 60);
      const experienceGained = Math.floor(baseExperience);
      
      const result: ExplorationResult = {
        survived: true,
        duration: explorationDuration,
        bufosGained,
        experienceGained,
        itemsFound: [] // No items for basic exploration
      };
      
      // Apply result to explorer
      this.completeExploration(result);
      
      // Reset exploration distance
      this.explorationDistance = 0;
      
      return result;
    }
    
    // Update explorer progress (based on distance)
    this.updateExplorerInState({
      explorationProgress: (this.explorationDistance / this.maxExplorationDistance) * 100
    });
    
    // Emit explorer updated event (custom event not in eventTypes)
    getEventBus().emit('EXPLORER_UPDATED', {
      explorer: this.getExplorerFromState()
    });
    
    return null;
  }
  
  /**
   * Start an exploration
   * 
   * @param area Area to explore
   */
  public startExploration(area: string): boolean {
    const explorer = this.getExplorerFromState();
    
    // Verify area exists
    if (!this.availableAreas.includes(area)) {
      return false;
    }
    
    // Check if explorer can start exploration
    if (explorer.state !== ExplorerState.Idle && explorer.state !== ExplorerState.Resting) {
      return false;
    }
    
    // Reset exploration distance
    this.explorationDistance = 0;
    
    // Start exploration
    const previousState = explorer.state;
    const updatedExplorer = startExploration(explorer, area);
    
    // Update explorer in state
    this.updateExplorerInState(updatedExplorer);
    
    // Check if state actually changed (exploration started)
    if (previousState !== updatedExplorer.state) {
      // Emit events
      getEventBus().emit(EXPLORER_STATE_CHANGED, {
        explorer: updatedExplorer,
        previousState
      });
      
      getEventBus().emit(EXPLORATION_STARTED, {
        explorer: updatedExplorer,
        area
      });
      
      getEventBus().emit('EXPLORER_UPDATED', {
        explorer: updatedExplorer
      });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Generate an enemy encounter during exploration
   */
  private generateEncounter(): void {
    const explorer = this.getExplorerFromState();
    
    // Can't encounter enemies if not exploring
    if (explorer.state !== ExplorerState.Exploring) return;
    
    // Generate an enemy based on current area and exploration distance
    const areaLevel = this.getAreaLevel(explorer.currentArea);
    const distanceMultiplier = this.explorationDistance / this.maxExplorationDistance;
    
    // Generate enemy
    try {
      const enemy = generateEnemy(
        explorer.currentArea,
        distanceMultiplier,
        areaLevel
      );
      
      // Store current enemy
      this.currentEnemy = enemy;
      
      // Change state to fighting
      const previousState = explorer.state;
      const updatedExplorer = {
        ...explorer,
        state: ExplorerState.Fighting
      };
      
      // Update explorer in state
      this.updateExplorerInState(updatedExplorer);
      
      // Initialize combat
      this.currentCombat = initializeCombat(updatedExplorer, enemy);
      
      // Emit events
      getEventBus().emit(EXPLORER_STATE_CHANGED, {
        explorer: updatedExplorer,
        previousState
      });
      
      getEventBus().emit('ENEMY_ENCOUNTERED', {
        explorer: updatedExplorer,
        enemy
      });
      
      getEventBus().emit('EXPLORER_UPDATED', {
        explorer: updatedExplorer
      });
    } catch (error) {
      console.error("Failed to generate enemy:", error);
    }
  }
  
  /**
   * Perform a combat action
   * 
   * @param action The action to take
   */
  public performCombatAction(action: CombatActionType): boolean {
    const explorer = this.getExplorerFromState();
    
    if (!this.currentCombat || !this.currentEnemy || explorer.state !== ExplorerState.Fighting) {
      return false;
    }
    
    // Execute the combat action
    const result = executeCombatAction(this.currentCombat, action);
    
    // Update current combat state
    this.currentCombat = result.newState;
    
    // Update explorer health in state
    this.updateExplorerInState({
      health: this.currentCombat.explorer.health
    });
    
    // Emit combat action event
    getEventBus().emit('COMBAT_ACTION', result);
    
    // Check if combat has ended
    if (this.currentCombat.status !== CombatStatus.InProgress) {
      // Handle victory
      if (this.currentCombat.status === CombatStatus.Victory) {
        // Apply rewards
        if (result.rewards) {
          // Update explorer in state with rewards
          this.updateExplorerInState({
            experience: explorer.experience + result.rewards.experience,
            lifetimeBufosFromExploring: explorer.lifetimeBufosFromExploring + result.rewards.bufos
          });
          
          // Check for level up
          this.checkForLevelUp();
        }
        
        // Emit combat ended event
        getEventBus().emit('COMBAT_ENDED', {
          explorer: this.getExplorerFromState(),
          enemy: this.currentEnemy,
          victory: true,
          rewards: result.rewards
        });
      } else {
        // Handle defeat or fleeing
        getEventBus().emit('COMBAT_ENDED', {
          explorer: this.getExplorerFromState(),
          enemy: this.currentEnemy,
          victory: false
        });
      }
      
      // Return to exploration or resting state based on health
      const updatedExplorer = this.getExplorerFromState();
      const previousState = updatedExplorer.state;
      let newState = ExplorerState.Exploring;
      
      if (updatedExplorer.health < updatedExplorer.maxHealth * 0.2) {
        // Too injured to continue exploring
        newState = ExplorerState.Injured;
      } else if (updatedExplorer.health < updatedExplorer.maxHealth * 0.5) {
        // Wounded but able to rest
        newState = ExplorerState.Resting;
      }
      
      // Update explorer state in state manager
      this.updateExplorerInState({
        state: newState,
        stateStartTime: Date.now()
      });
      
      // Clear combat and enemy
      this.currentCombat = null;
      this.currentEnemy = null;
      
      // Emit state change event
      getEventBus().emit(EXPLORER_STATE_CHANGED, {
        explorer: this.getExplorerFromState(),
        previousState
      });
      
      // Emit explorer updated event
      getEventBus().emit('EXPLORER_UPDATED', {
        explorer: this.getExplorerFromState()
      });
    }
    
    return true;
  }
  
  /**
   * Auto-resolve the current combat encounter
   * Used for quickly resolving combats without player input
   */
  public autoResolveCombat(): boolean {
    const explorer = this.getExplorerFromState();
    
    if (!this.currentCombat || !this.currentEnemy || explorer.state !== ExplorerState.Fighting) {
      return false;
    }
    
    // Simulate the combat
    const result = simulateCombat(explorer, this.currentEnemy);
    
    // Update explorer health in state
    this.updateExplorerInState({
      health: result.explorerRemainingHealth
    });
    
    // Apply rewards if victorious
    if (result.victory) {
      this.updateExplorerInState({
        experience: explorer.experience + result.experienceGained,
        lifetimeBufosFromExploring: explorer.lifetimeBufosFromExploring + result.bufosGained
      });
      
      // Check for level up
      this.checkForLevelUp();
      
      // Emit combat ended event
      getEventBus().emit('COMBAT_ENDED', {
        explorer: this.getExplorerFromState(),
        enemy: this.currentEnemy,
        victory: true,
        rewards: {
          bufos: result.bufosGained,
          experience: result.experienceGained,
          drops: result.itemsFound
        }
      });
    } else {
      // Emit combat ended event for defeat
      getEventBus().emit('COMBAT_ENDED', {
        explorer: this.getExplorerFromState(),
        enemy: this.currentEnemy,
        victory: false
      });
    }
    
    // Return to exploration or resting state based on health
    const updatedExplorer = this.getExplorerFromState();
    const previousState = updatedExplorer.state;
    let newState = ExplorerState.Exploring;
    
    if (updatedExplorer.health < updatedExplorer.maxHealth * 0.2) {
      // Too injured to continue exploring
      newState = ExplorerState.Injured;
    } else if (updatedExplorer.health < updatedExplorer.maxHealth * 0.5) {
      // Wounded but able to rest
      newState = ExplorerState.Resting;
    }
    
    // Update explorer state in state manager
    this.updateExplorerInState({
      state: newState,
      stateStartTime: Date.now()
    });
    
    // Clear combat and enemy
    this.currentCombat = null;
    this.currentEnemy = null;
    
    // Emit state change event
    getEventBus().emit(EXPLORER_STATE_CHANGED, {
      explorer: this.getExplorerFromState(),
      previousState
    });
    
    // Emit explorer updated event
    getEventBus().emit('EXPLORER_UPDATED', {
      explorer: this.getExplorerFromState()
    });
    
    return true;
  }
  
  /**
   * Calculate area effectiveness based on explorer stats and area difficulty
   * @param explorer The explorer data
   * @param areaLevel The level of the current area
   * @returns Effectiveness value between 0 and 1
   */
  private calculateAreaEffectiveness(explorer: ExplorerData, areaLevel: number): number {
    return Math.min(1, explorer.level / areaLevel);
  }
  
  /**
   * Complete an exploration
   * @param result The result of the exploration
   */
  private completeExploration(result: ExplorationResult): void {
    const explorer = this.getExplorerFromState();
    
    // Calculate health loss based on duration
    let healthLoss = explorer.maxHealth * 0.05; // Base 5% health loss from fatigue
    
    // Calculate new health (can't go below 1)
    const newHealth = Math.max(1, explorer.health - healthLoss);
    
    // Determine new state based on health
    let newState = ExplorerState.Resting;
    if (newHealth < explorer.maxHealth * 0.2) {
      newState = ExplorerState.Injured;
    }
    
    // Get the previous state for event emission
    const previousState = explorer.state;
    
    // Update explorer in state manager
    this.updateExplorerInState({
      health: newHealth,
      state: newState,
      stateStartTime: Date.now(),
      experience: explorer.experience + result.experienceGained,
      explorationsCompleted: explorer.explorationsCompleted + 1,
      lifetimeBufosFromExploring: explorer.lifetimeBufosFromExploring + result.bufosGained,
      explorationProgress: 0
    });
    
    // Check for level up
    this.checkForLevelUp();
    
    // Emit state change event if state changed
    if (previousState !== newState) {
      getEventBus().emit(EXPLORER_STATE_CHANGED, {
        explorer: this.getExplorerFromState(),
        previousState
      });
    }
    
    // Emit exploration completed event
    getEventBus().emit(EXPLORATION_COMPLETED, {
      explorer: this.getExplorerFromState(),
      result
    });
  }
  
  /**
   * Check for level up and apply if experience is sufficient
   */
  private checkForLevelUp(): void {
    let explorer = this.getExplorerFromState();
    let leveledUp = false;
    
    while (explorer.experience >= explorer.experienceToNextLevel) {
      leveledUp = true;
      
      // Calculate new level stats
      const newLevel = explorer.level + 1;
      const newExperience = explorer.experience - explorer.experienceToNextLevel;
      const healthIncrease = 20 + (explorer.defense.level * 5);
      const newMaxHealth = explorer.maxHealth + healthIncrease;
      const newExpToNextLevel = Math.ceil(100 * Math.pow(1.5, newLevel - 1));
      
      // Update explorer in state
      this.updateExplorerInState({
        level: newLevel,
        experience: newExperience,
        maxHealth: newMaxHealth,
        experienceToNextLevel: newExpToNextLevel
      });
      
      // Get updated explorer for next iteration
      explorer = this.getExplorerFromState();
      
      // Emit level up event
      getEventBus().emit(EXPLORER_LEVEL_UP, {
        explorer,
        newLevel
      });
    }
    
    // Emit explorer updated event if there was a level up
    if (leveledUp) {
      getEventBus().emit('EXPLORER_UPDATED', {
        explorer: this.getExplorerFromState()
      });
    }
  }
  
  /**
   * Get the level of an area
   * @param area The area name
   * @returns The level of the area
   */
  private getAreaLevel(area: string): number {
    const areaLevels: Record<string, number> = {
      'Pond': 1,
      'Creek': 2,
      'Swamp': 3,
      'River': 4,
      'Lake': 5,
      'Forest': 6,
      'Mountains': 8,
      'Dungeon': 10
    };
    
    return areaLevels[area] || 1;
  }

  /**
   * Upgrade an explorer stat
   * 
   * @param statName The stat to upgrade
   * @param availableBufos The current bufo count
   * @returns Object with success flag and cost
   */
  public upgradeExplorerStat(
    statName: 'attack' | 'defense' | 'speed' | 'luck', 
    availableBufos: number
  ): { 
    success: boolean;
    cost: number;
  } {
    const explorer = this.getExplorerFromState();
    
    // Upgrade the stat
    const result = upgradeExplorerStat(explorer, statName, availableBufos);
    
    if (result.success) {
      // Store previous level for event checking
      const previousLevel = explorer.level;
      
      // Update explorer in state
      this.updateExplorerInState(result.explorer);
      
      // Get updated explorer
      const updatedExplorer = this.getExplorerFromState();
      
      // Emit stat upgraded event
      getEventBus().emit(EXPLORER_STAT_UPGRADED, {
        explorer: updatedExplorer,
        statName,
        newLevel: updatedExplorer[statName].level
      });
      
      // Emit explorer updated event
      getEventBus().emit('EXPLORER_UPDATED', {
        explorer: updatedExplorer
      });
      
      // Check if level changed
      if (previousLevel !== updatedExplorer.level) {
        getEventBus().emit(EXPLORER_LEVEL_UP, {
          explorer: updatedExplorer,
          newLevel: updatedExplorer.level
        });
      }
    }
    
    return {
      success: result.success,
      cost: result.cost
    };
  }
  
  /**
   * Get explorer derived stats
   * @returns Object with derived stats
   */
  public getExplorerStats(): {
    powerRating: number;
    dps: number;
    survivalTime: number;
    healthPercent: number;
  } {
    const explorer = this.getExplorerFromState();
    
    return {
      powerRating: calculatePowerRating(explorer),
      dps: calculateDPS(explorer),
      survivalTime: calculateSurvivalTime(explorer),
      healthPercent: (explorer.health / explorer.maxHealth) * 100
    };
  }

  /**
   * Get all available areas
   * @returns Array of available area names
   */
  public getAvailableAreas(): string[] {
    return [...this.availableAreas];
  }

  /**
   * Reset explorer state and related data
   */
  public reset(): void {
    // Reset combat state
    this.currentCombat = null;
    this.currentEnemy = null;
    this.explorationDistance = 0;
    
    // Emit explorer updated event
    getEventBus().emit('EXPLORER_UPDATED', {
      explorer: this.getExplorerFromState()
    });
  }
}

/**
 * Helper function to get ExplorerManager instance
 */
export function getExplorerManager(): ExplorerManager {
  return ExplorerManager.getInstance();
}