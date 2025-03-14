import { getStateManager } from '../core/stateManager';
import { getEventBus } from '../core/eventBus';
import { GameState } from '../core/types';
import { 
  Upgrade, 
  INITIAL_UPGRADES, 
  UpgradeCategory, 
  UnlockConditionType, 
  UpgradeEffectType,
  meetsUnlockConditions
} from '../models/upgrades';
import { GeneratorType } from '../models/generators';
import {
  UPGRADE_PURCHASED,
  UPGRADES_AVAILABLE,
  GENERATOR_PRODUCTION_UPDATED
} from '../core/eventTypes';
import * as Logger from '../utils/logger';
import { getGeneratorManager } from './generatorManager';

/**
 * Upgrade Manager class to handle upgrade-related operations
 * Uses the central state manager for state and event bus for events
 */
export class UpgradeManager {
  private static instance: UpgradeManager;
  
  /** All possible upgrades */
  private allUpgrades: Upgrade[];
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor(initialUpgrades: Upgrade[] = INITIAL_UPGRADES) {
    this.allUpgrades = initialUpgrades;
    
    // Log how many upgrades were loaded
    Logger.debug(`UpgradeManager initialized with ${initialUpgrades.length} upgrades`);
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): UpgradeManager {
    if (!UpgradeManager.instance) {
      UpgradeManager.instance = new UpgradeManager();
    }
    return UpgradeManager.instance;
  }
  
  /**
   * Initialize the upgrade manager - apply any purchased upgrades
   * Should be called once during game initialization
   */
  public initialize(): void {
    const purchasedUpgrades = this.getPurchasedUpgrades();
    Logger.debug(`Initializing UpgradeManager with ${purchasedUpgrades.length} purchased upgrades`);
    
    // Apply effects for all previously purchased upgrades
    for (const upgradeId of purchasedUpgrades) {
      const upgrade = this.findUpgradeById(upgradeId);
      if (upgrade) {
        this.applyUpgradeEffects(upgrade);
      }
    }
    
    // Finally, make sure all generators are recalculated
    const generatorManager = getGeneratorManager();
    generatorManager.recalculateAllGenerators();
  }
  
  /**
   * Check and update available upgrades based on game state
   * @param state Game state
   * @param generatorCounts Map of generator counts
   * @returns Array of available upgrades
   */
  public checkAvailableUpgrades(
    state: GameState, 
    generatorCounts: Record<GeneratorType, number>
  ): Upgrade[] {
    const availableUpgrades: Upgrade[] = [];
    const purchasedUpgrades = this.getPurchasedUpgrades();
    
    for (const upgrade of this.allUpgrades) {
      // Skip if already purchased
      if (purchasedUpgrades.includes(upgrade.id)) continue;
      
      // Check if upgrade meets all unlock conditions
      if (meetsUnlockConditions(upgrade, state.resources.totalBufos, generatorCounts)) {
        availableUpgrades.push(upgrade);
      }
    }
    
    // Update available upgrades in state
    getStateManager().setState({
      upgrades: {
        available: availableUpgrades.map(u => u.id)
      }
    });
    
    // Emit upgrades available event if there are any
    if (availableUpgrades.length > 0) {
      getEventBus().emit(UPGRADES_AVAILABLE, {
        upgrades: availableUpgrades
      });
    }
    
    return availableUpgrades;
  }
  
  /**
   * Purchase an upgrade
   * @param upgradeId ID of the upgrade to purchase
   * @param currentBufos Current bufo count
   * @returns Object with success flag, cost, and effects
   */
  public purchaseUpgrade(
    upgradeId: string, 
    currentBufos: number
  ): { 
    success: boolean; 
    cost: number; 
    effects?: UpgradeEffectType[];
    upgrade?: Upgrade;
  } {
    const upgrade = this.findUpgradeById(upgradeId);
    
    if (!upgrade) {
      return { success: false, cost: 0 };
    }
    
    // Check if already purchased
    if (this.isUpgradePurchased(upgradeId)) {
      return { success: false, cost: upgrade.cost };
    }
    
    // Check if can afford
    if (currentBufos < upgrade.cost) {
      return { success: false, cost: upgrade.cost };
    }
    
    // Get state
    const state = getStateManager().getState();
    
    // Update purchased upgrades in state
    getStateManager().setState({
      upgrades: {
        purchased: [...state.upgrades.purchased, upgradeId],
        // Remove from available
        available: state.upgrades.available.filter(id => id !== upgradeId)
      }
    });
    
    // Apply upgrade effects
    this.applyUpgradeEffects(upgrade);
    
    // Emit purchase event
    getEventBus().emit(UPGRADE_PURCHASED, {
      upgrade,
      cost: upgrade.cost,
      effects: upgrade.effects.map(effect => effect.type)
    });
    
    return {
      success: true,
      cost: upgrade.cost,
      effects: upgrade.effects.map(effect => effect.type),
      upgrade
    };
  }
  
  /**
   * Apply the effects of an upgrade
   * @param upgrade The upgrade to apply
   * @returns True if all effects were applied successfully
   */
  public applyUpgradeEffects(upgrade: Upgrade): boolean {
    try {
      Logger.debug(`Applying effects for upgrade ${upgrade.id}`);
      
      // Process each effect in the upgrade
      for (const effect of upgrade.effects) {
        this.applySingleEffect(effect, upgrade.id, upgrade.name);
      }
      
      // Recalculate all generators after applying effects
      const generatorManager = getGeneratorManager();
      generatorManager.recalculateAllGenerators();
      
      // Emit production updated event to update UI
      const totalProduction = generatorManager.calculateTotalProduction();
      getEventBus().emit(GENERATOR_PRODUCTION_UPDATED, {
        totalProduction,
        source: 'upgrade',
        upgradeId: upgrade.id
      });
      
      return true;
    } catch (error) {
      Logger.error(`Error applying upgrade effects for ${upgrade.id}:`, error);
      return false;
    }
  }
  
  /**
 * Apply a single upgrade effect
 */
private applySingleEffect(
  effect: { type: UpgradeEffectType; target?: string; multiplier: number },
  upgradeId: string,
  upgradeName: string
): void {
  const state = getStateManager().getState();
  const generatorManager = getGeneratorManager();
  const boostId = `upgrade_${upgradeId}`;
  
  switch (effect.type) {
    case 'clickMultiplier': {
      // Get current click multiplier
      const currentClickMultiplier = state.resources.clickMultiplier;
      
      // Calculate new click multiplier
      const newClickMultiplier = currentClickMultiplier * effect.multiplier;
      
      // Update the clickMultiplier in state
      getStateManager().setState({
        resources: {
          clickMultiplier: newClickMultiplier
        }
      });
      
      // Log the update
      Logger.debug(
        `Applied click multiplier from ${upgradeId}: ${currentClickMultiplier} -> ${newClickMultiplier}, ` +
        `base click power = ${state.resources.baseClickPower}, ` + 
        `result = ${state.resources.baseClickPower * newClickMultiplier}`
      );
      break;
    }
    
    case 'generatorProduction': {
      if (!effect.target) {
        Logger.warn(`Missing target in generatorProduction effect for ${upgradeId}`);
        break;
      }
      
      if (effect.target in state.generators) {
        // Apply boost to specific generator
        const targetGenerator = effect.target as GeneratorType;
        
        generatorManager.applyBoostToGenerator(
          targetGenerator,
          boostId,
          effect.multiplier,
          upgradeName,
          true
        );
        
        //Logger.debug(`Applied ${effect.multiplier}x boost to ${targetGenerator} from upgrade ${upgradeId}`);
      } else {
        Logger.warn(`Target generator "${effect.target}" not found for upgrade ${upgradeId}`);
      }
      break;
    }
    
    case 'globalMultiplier': {
      // Apply global production multiplier (only affects generators)
      const currentMultiplier = state.resources.productionMultiplier;
      const newMultiplier = currentMultiplier * effect.multiplier;
      
      // Update global multiplier in state
      getStateManager().setState({
        resources: {
          productionMultiplier: newMultiplier
        }
      });
      
      //Logger.debug(`Applied global multiplier from ${upgradeId}: ${currentMultiplier} -> ${newMultiplier}`);
      break;
    }
    
    case 'unlockSpecial': {
      // Handle special unlocks
      if (!effect.target) {
        Logger.warn(`Missing target in unlockSpecial effect for ${upgradeId}`);
        break;
      }
      
      // Implement special unlock logic here
      //Logger.debug(`Applied special unlock ${effect.target} from upgrade ${upgradeId}`);
      break;
    }
    
    default:
      Logger.warn(`Unknown upgrade effect type: ${(effect as any).type}`);
  }
}
  
  /**
   * Calculate the total multiplier for a generator based on all purchased upgrades
   * @param generatorType Type of generator to calculate for
   * @returns The combined multiplier from all applicable upgrades
   */
  public calculateTotalMultiplierForGenerator(generatorType: GeneratorType): number {
    const purchasedUpgradeIds = this.getPurchasedUpgrades();
    let multiplier = 1.0;
    
    // Get all purchased upgrades
    const purchasedUpgrades = purchasedUpgradeIds
      .map(id => this.findUpgradeById(id))
      .filter(upgrade => upgrade !== undefined) as Upgrade[];
    
    // Apply effects from each upgrade
    for (const upgrade of purchasedUpgrades) {
      for (const effect of upgrade.effects) {
        // Apply generator-specific effects
        if (effect.type === 'generatorProduction' && effect.target === generatorType) {
          multiplier *= effect.multiplier;
        }
        
        // Apply global effects
        if (effect.type === 'globalMultiplier') {
          multiplier *= effect.multiplier;
        }
      }
    }
    
    return multiplier;
  }
  
  /**
   * Calculate the total click multiplier from all purchased upgrades
   * @returns The combined click multiplier
   */
  public calculateTotalClickMultiplier(): number {
    const purchasedUpgradeIds = this.getPurchasedUpgrades();
    let multiplier = 1.0;
    
    // Get all purchased upgrades
    const purchasedUpgrades = purchasedUpgradeIds
      .map(id => this.findUpgradeById(id))
      .filter(upgrade => upgrade !== undefined) as Upgrade[];
    
    // Apply click multiplier effects
    for (const upgrade of purchasedUpgrades) {
      for (const effect of upgrade.effects) {
        if (effect.type === 'clickMultiplier') {
          multiplier *= effect.multiplier;
        }
      }
    }
    
    return multiplier;
  }
  
  /**
   * Reapply all upgrade effects from purchased upgrades
   * Useful when resetting state or after loading a save
   */
  public reapplyAllUpgrades(): void {
    Logger.debug('Reapplying all upgrade effects');
    
    // Get current state
    const state = getStateManager().getState();
    
    // Reset production multiplier to 1.0 before reapplying
    getStateManager().setState({
      resources: {
        productionMultiplier: 1.0
      }
    });
    
    // Get generator manager
    const generatorManager = getGeneratorManager();
    
    // Clear all boost effects from generators
    Object.values(state.generators).forEach(generator => {
      const updatedGenerator = {...generator, boosts: []};
      getStateManager().setState({
        generators: {
          [generator.id]: updatedGenerator
        }
      });
    });
    
    // Apply all purchased upgrades
    const purchasedUpgradeIds = this.getPurchasedUpgrades();
    purchasedUpgradeIds.forEach(upgradeId => {
      const upgrade = this.findUpgradeById(upgradeId);
      if (upgrade) {
        this.applyUpgradeEffects(upgrade);
      }
    });
    
    // Recalculate generators
    generatorManager.recalculateAllGenerators();
    
    Logger.debug(`Reapplied ${purchasedUpgradeIds.length} upgrades`);
  }
  
  /**
   * Get the effects of a specific upgrade
   * @param upgradeId ID of the upgrade
   * @returns Array of effect types or null if upgrade not found
   */
  public getUpgradeEffects(upgradeId: string): UpgradeEffectType[] | null {
    const upgrade = this.findUpgradeById(upgradeId);
    return upgrade ? upgrade.effects.map(effect => effect.type) : null;
  }
  
  /**
   * Find an upgrade by ID
   * @param upgradeId ID of the upgrade to find
   * @returns Upgrade object or undefined if not found
   */
  public findUpgradeById(upgradeId: string): Upgrade | undefined {
    return this.allUpgrades.find(u => u.id === upgradeId);
  }
  
  /**
   * Get all available upgrades
   * @returns Array of available upgrades
   */
  public getAvailableUpgrades(): Upgrade[] {
    const state = getStateManager().getState();
    const availableIds = state.upgrades.available;
    
    return this.allUpgrades.filter(u => availableIds.includes(u.id));
  }
  
  /**
   * Get purchased upgrades
   * @returns Array of purchased upgrade IDs
   */
  public getPurchasedUpgrades(): string[] {
    return getStateManager().getState().upgrades.purchased;
  }
  
  /**
   * Check if an upgrade is purchased
   * @param upgradeId ID of the upgrade
   * @returns True if the upgrade is purchased
   */
  public isUpgradePurchased(upgradeId: string): boolean {
    return this.getPurchasedUpgrades().includes(upgradeId);
  }
  
  /**
   * Set all upgrades data (used during initialization)
   * @param upgrades Array of upgrades to set
   */
  public setUpgrades(upgrades: Upgrade[]): void {
    if (Array.isArray(upgrades) && upgrades.length > 0) {
      this.allUpgrades = upgrades;
      Logger.log(`Updated upgrade manager with ${upgrades.length} upgrades`);
    }
  }
  
  /**
   * Get all upgrades
   * @returns Array of all upgrades
   */
  public getAllUpgrades(): Upgrade[] {
    return [...this.allUpgrades];
  }
  
  /**
   * Reset the upgrade manager
   */
  public reset(): void {
    // Nothing to reset in the manager itself since state is in StateManager
  }
}

/**
 * Helper function to get UpgradeManager instance
 */
export function getUpgradeManager(): UpgradeManager {
  return UpgradeManager.getInstance();
}