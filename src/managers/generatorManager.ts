import { getStateManager } from '../core/stateManager';
import { getEventBus } from '../core/eventBus';
import { GameState } from '../core/types';
import * as Logger from '../utils/logger';
import {
  GeneratorType,
  GeneratorData,
  recalculateGenerator,
  unlockGenerator,
  calculateTotalProduction,
  canAffordGenerator,
  calculateBulkCost,
  calculateMaxAffordable,
  ProductionBoost,
  applyBoostToGenerator,
  toggleBoost
} from '../models/generators';
import {
  GENERATOR_PURCHASED,
  GENERATOR_UNLOCKED,
  GENERATOR_PRODUCTION_UPDATED
} from '../core/eventTypes';

/**
 * Interface for generator contribution to production
 */
export interface GeneratorContribution {
  /** Generator ID */
  id: GeneratorType;
  /** Generator name */
  name: string;
  /** Production amount */
  production: number;
  /** Percentage of total production */
  percentage: number;
  /** Count of generators owned */
  count: number;
}

/**
 * Generator Manager class to handle all generator-related operations
 * Uses the central state manager for state and event bus for events
 */
export class GeneratorManager {
  private static instance: GeneratorManager;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): GeneratorManager {
    if (!GeneratorManager.instance) {
      GeneratorManager.instance = new GeneratorManager();
    }
    return GeneratorManager.instance;
  }
  
  /**
   * Recalculate a specific generator's derived values
   * 
   * @param generatorType The type of generator to recalculate
   * @returns The updated generator
   */
  public recalculateGenerator(generatorType: GeneratorType): GeneratorData {
    const state = getStateManager().getState();
    const generator = state.generators[generatorType];
    
    if (!generator) return generator;
    
    // Get global multiplier from state
    const globalMultiplier = state.resources.productionMultiplier;
    
    // Calculate boosts from state (would need to be added to state model)
    // For now, using empty arrays as placeholders
    const globalBoosts: ProductionBoost[] = [];
    const specificBoosts: ProductionBoost[] = [];
    
    // Combine boosts for this generator
    const combinedBoosts = [...globalBoosts, ...specificBoosts];
    
    // Update the generator with recalculated values
    const updatedGenerator = recalculateGenerator(
      generator,
      globalMultiplier,
      combinedBoosts
    );
    
    // Update the state with the recalculated generator
    getStateManager().setState({
      generators: {
        [generatorType]: updatedGenerator
      }
    });
    
    return updatedGenerator;
  }
  
  /**
   * Recalculate all generators' derived values
   */
  public recalculateAllGenerators(): void {
    const state = getStateManager().getState();
    
    // Start batch updates to reduce notifications
    getStateManager().startBatch();
    
    // Recalculate each generator
    Object.keys(state.generators).forEach(type => {
      this.recalculateGenerator(type as GeneratorType);
    });
    
    // End batch updates
    getStateManager().endBatch();
    
    // Emit production updated event
    getEventBus().emit(GENERATOR_PRODUCTION_UPDATED, {
      totalProduction: this.calculateTotalProduction()
    });
  }
  
  // Update the checkUnlocks method in src/managers/generatorManager.ts

/**
 * Check and update unlock status for all generators
 * 
 * @param totalBufos The total number of bufos earned
 * @returns Array of newly unlocked generators
 */
public checkUnlocks(totalBufos: number): GeneratorData[] {
  const state = getStateManager().getState();
  const newlyUnlocked: GeneratorData[] = [];
  
  // Create a count map of owned generators
  const ownedGenerators = Object.entries(state.generators).reduce((acc, [type, data]) => {
    acc[type as GeneratorType] = data.count;
    return acc;
  }, {} as Record<GeneratorType, number>);
  
  // Placeholder for achievement and special condition tracking
  // In a real implementation, these would come from state
  const unlockedAchievements: Record<string, boolean> = {};
  const specialUnlockConditions: Record<string, boolean> = {};
  
  // Start batch updates
  getStateManager().startBatch();
  
  // Check each generator
  Object.entries(state.generators).forEach(([type, generator]) => {
    // Get up-to-date generator data from state to ensure we're working with current data
    const currentGenerator = state.generators[type as GeneratorType];
    
    // Apply unlock logic
    const updatedGenerator = unlockGenerator(
      currentGenerator,
      totalBufos,
      ownedGenerators,
      unlockedAchievements,
      specialUnlockConditions
    );
    
    // Check if the unlock status changed
    if (updatedGenerator.unlocked && !currentGenerator.unlocked) {
      // Generator was just unlocked
      getStateManager().setState({
        generators: {
          [type]: updatedGenerator
        }
      });
      
      newlyUnlocked.push(updatedGenerator);
      
      // Emit unlock event
      getEventBus().emit(GENERATOR_UNLOCKED, {
        generator: updatedGenerator
      });
      
      Logger.debug(`Generator ${type} was unlocked`);
    } else if (updatedGenerator.unlocked !== currentGenerator.unlocked) {
      // Update unlock status if changed (handles both unlock and lock cases)
      getStateManager().setState({
        generators: {
          [type]: {
            unlocked: updatedGenerator.unlocked
          }
        }
      });
      
      Logger.debug(`Generator ${type} unlock status updated to ${updatedGenerator.unlocked}`);
    }
  });
  
  // End batch updates
  getStateManager().endBatch();
  
  // Recalculate all generators after unlocks
  this.recalculateAllGenerators();
  
  // Force UI updates
  if (newlyUnlocked.length > 0) {
    getEventBus().emit('refreshUI', { force: true });
  }
  
  return newlyUnlocked;
}

  
  /**
   * Purchase a quantity of a generator
   * 
   * @param generatorType The type of generator to purchase
   * @param quantity The number to purchase
   * @param availableBufos The current bufo count
   * @returns Object containing success flag, cost, and updated generator
   */
  public purchaseGenerator(
    generatorType: GeneratorType,
    quantity: number,
    availableBufos: number
  ): { 
    success: boolean; 
    cost: number; 
    generator: GeneratorData;
    productionIncrease: number;
  } {
    const state = getStateManager().getState();
    const generator = state.generators[generatorType];
    
    // Check if generator exists, is unlocked and enabled
    if (!generator || !generator.unlocked || !generator.enabled) {
      return { 
        success: false, 
        cost: 0, 
        generator,
        productionIncrease: 0
      };
    }
    
    // Handle "Max" quantity (represented by -1)
    if (quantity === -1) {
      quantity = calculateMaxAffordable(generator, availableBufos);
      
      // If can't afford any, return early
      if (quantity <= 0) {
        return { 
          success: false, 
          cost: 0, 
          generator,
          productionIncrease: 0
        };
      }
    }
    
    // Check if can afford the specified quantity
    if (!canAffordGenerator(generator, availableBufos, quantity)) {
      return { 
        success: false, 
        cost: 0, 
        generator,
        productionIncrease: 0 
      };
    }
    
    // Calculate cost
    const cost = calculateBulkCost(generator, quantity);
    
    // Store original production for calculating the increase
    const originalProduction = generator.totalProduction;
    
    // Update generator count in state
    const updatedGenerator = {
      ...generator,
      count: generator.count + quantity
    };
    
    // Update state with new generator count
    getStateManager().setState({
      generators: {
        [generatorType]: updatedGenerator
      }
    });
    
    // Recalculate derived values
    const finalGenerator = this.recalculateGenerator(generatorType);
    
    // Calculate production increase (for animations and feedback)
    const productionIncrease = finalGenerator.totalProduction - originalProduction;
    
    // Calculate new total production
    const totalProduction = this.calculateTotalProduction();
    
    // Emit events
    getEventBus().emit(GENERATOR_PURCHASED, {
      generator: finalGenerator,
      quantity,
      cost
    });
    
    getEventBus().emit(GENERATOR_PRODUCTION_UPDATED, {
      totalProduction
    });
    
    return { 
      success: true, 
      cost, 
      generator: finalGenerator,
      productionIncrease
    };
  }
  
  /**
   * Calculate how many of a generator the player can afford
   * 
   * @param generatorType The type of generator to check
   * @param availableBufos The current bufo count
   * @returns The maximum number that can be afforded
   */
  public getMaxAffordable(
    generatorType: GeneratorType,
    availableBufos: number
  ): number {
    const state = getStateManager().getState();
    const generator = state.generators[generatorType];
    
    if (!generator || !generator.unlocked || !generator.enabled) {
      return 0;
    }
    
    return calculateMaxAffordable(generator, availableBufos);
  }
  
  /**
   * Calculate the total production per second across all generators
   * 
   * @returns The total production rate
   */
  public calculateTotalProduction(): number {
    const state = getStateManager().getState();
    return calculateTotalProduction(state.generators);
  }
  
  /**
   * Calculate production for a specific time interval
   * 
   * @param seconds The number of seconds to calculate production for
   * @param multiplier Optional additional multiplier to apply
   * @returns Total production for the time period
   */
  public calculateProductionForTime(seconds: number, multiplier: number = 1): number {
    const baseProduction = this.calculateTotalProduction();
    return baseProduction * seconds * multiplier;
  }
  
  /**
   * Get production statistics
   * 
   * @returns Production statistics object
   */
  public getProductionStats(): {
    totalPerSecond: number;
    totalPerMinute: number;
    totalPerHour: number;
    generatorContributions: GeneratorContribution[];
    activeBonusMultiplier: number;
  } {
    const state = getStateManager().getState();
    const totalProduction = this.calculateTotalProduction();
    
    // Calculate generator contributions
    const generatorContributions = Object.values(state.generators)
      .filter(g => g.count > 0 && g.totalProduction > 0)
      .map(g => ({
        id: g.id,
        name: g.name,
        production: g.totalProduction,
        percentage: totalProduction > 0 ? (g.totalProduction / totalProduction * 100) : 0,
        count: g.count
      }));
    
    return {
      totalPerSecond: totalProduction,
      totalPerMinute: totalProduction * 60,
      totalPerHour: totalProduction * 3600,
      generatorContributions,
      activeBonusMultiplier: state.resources.productionMultiplier
    };
  }
  
  /**
   * Apply a boost to a generator
   * 
   * @param generatorType The type of generator to boost
   * @param boostId Unique identifier for the boost
   * @param multiplier The production multiplier value
   * @param source Source of the boost
   * @param active Whether the boost is active
   */
  public applyBoostToGenerator(
    generatorType: GeneratorType,
    boostId: string,
    multiplier: number,
    source: string,
    active: boolean = true
  ): void {
    const state = getStateManager().getState();
    const generator = state.generators[generatorType];
    
    if (!generator) return;
    
    // Apply the boost to the generator
    const updatedGenerator = applyBoostToGenerator(
      generator,
      boostId,
      multiplier,
      source,
      active
    );
    
    // Update the generator in state
    getStateManager().setState({
      generators: {
        [generatorType]: updatedGenerator
      }
    });
    
    // Recalculate derived values
    this.recalculateGenerator(generatorType);
    
    // Emit production updated event
    getEventBus().emit(GENERATOR_PRODUCTION_UPDATED, {
      totalProduction: this.calculateTotalProduction()
    });
    
    // Emit boost changed event (custom event not defined in eventTypes)
    getEventBus().emit('BOOST_CHANGED', {
      generator: updatedGenerator,
      boostId,
      active
    });
  }
  
  /**
   * Toggle a specific generator boost on or off
   * 
   * @param generatorType The type of generator
   * @param boostId The ID of the boost to toggle
   * @param active Whether the boost should be active
   */
  public toggleGeneratorBoost(
    generatorType: GeneratorType,
    boostId: string,
    active: boolean
  ): void {
    const state = getStateManager().getState();
    const generator = state.generators[generatorType];
    
    if (!generator) return;
    
    // Toggle the boost on the generator
    const updatedGenerator = toggleBoost(generator, boostId, active);
    
    // Update the generator in state
    getStateManager().setState({
      generators: {
        [generatorType]: updatedGenerator
      }
    });
    
    // Recalculate derived values
    this.recalculateGenerator(generatorType);
    
    // Emit production updated event
    getEventBus().emit(GENERATOR_PRODUCTION_UPDATED, {
      totalProduction: this.calculateTotalProduction()
    });
    
    // Emit boost changed event (custom event not defined in eventTypes)
    getEventBus().emit('BOOST_CHANGED', {
      generator: updatedGenerator,
      boostId,
      active
    });
  }
  public getAllGenerators(): GeneratorData[] {
    const state = getStateManager().getState();
    return Object.values(state.generators);
  }
  /**
   * Get all unlocked generators
   * 
   * @returns Array of unlocked generators
   */
  public getUnlockedGenerators(): GeneratorData[] {
    const state = getStateManager().getState();
    return Object.values(state.generators).filter(g => g.unlocked);
  }
  
  /**
   * Reset the generator manager
   * Clears any local state not stored in the state manager
   */
  public reset(): void {
    // Recalculate all generators to ensure they're in sync with state
    this.recalculateAllGenerators();
  }
}

/**
 * Helper function to get GeneratorManager instance
 */
export function getGeneratorManager(): GeneratorManager {
  return GeneratorManager.getInstance();
}