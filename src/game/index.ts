import { getGameCore } from './gameCore';
import { getGameLoop } from './gameLoop';
import { saveGame, loadGame, exportSave, importSave } from './gameSave';
import { DEFAULT_GAME_STATE, updateState, calculateDerivedState, validateState } from './gameState';
import { getStateManager } from '../core/stateManager';
import { getEventBus } from '../core/eventBus';
import { ExplorerData } from '../models/explorer';
import { GeneratorType } from '../models/generators';
import { Upgrade } from '../models/upgrades';
type EventCallback = (data: unknown) => void;
/**
 * Game API
 * Provides a clean interface for interacting with the game
 */
export class Game {
  /**
   * Initialize the game
   */
  public static init(): void {
    // Initialize game core
    getGameCore().init();
    
    // Start game loop
    getGameLoop().start();
  }
  
  /**
   * Start the game
   */
  public static start(): void {
    getGameCore().start();
    getGameLoop().start();
  }
  
  /**
   * Stop the game
   */
  public static stop(): void {
    getGameCore().stop();
    getGameLoop().stop();
  }
  
  /**
   * Reset the game
   */
  public static reset(): boolean {
    // Confirm reset with user
    if (!confirm('Are you sure you want to reset your game? All progress will be lost!')) {
      return false;
    }
    
    // Reset game state
    getGameCore().resetState();
    
    return true;
  }
  
  /**
   * Save the game
   */
  public static save(): boolean {
    return saveGame();
  }
  
  /**
   * Load the game
   */
  public static load(): boolean {
    return loadGame();
  }
  
  /**
   * Export save as string
   */
  public static exportSave(): string {
    return exportSave();
  }
  
  /**
   * Import save from string
   */
  public static importSave(saveString: string): boolean {
    return importSave(saveString);
  }
  
  /**
   * Toggle auto-save
   */
  public static toggleAutoSave(enabled: boolean): void {
    getGameCore().toggleAutoSave(enabled);
  }
  
  /**
   * Check if auto-save is enabled
   */
  public static isAutoSaveEnabled(): boolean {
    return getGameCore().isAutoSaveEnabled();
  }
  
  /**
   * Click the main bufo
   */
  public static click(): { 
    bufosGained: number; 
    isCombo: boolean;
    comboMultiplier: number;
  } {
    return getGameCore().click();
  }
  
  /**
   * Get current game state
   */
  public static getState(): any {
    return getStateManager().getState();
  }
  
  /**
   * Get all generators
   */
  public static getGenerators(): any {
    return getGameCore().getGeneratorManager().getAllGenerators();
  }
  
  /**
   * Buy a generator
   */
  public static buyGenerator(generatorType: GeneratorType, quantity: number = 1): boolean {
    const generatorManager = getGameCore().getGeneratorManager();
    const state = getStateManager().getState();
    
    const result = generatorManager.purchaseGenerator(
      generatorType,
      quantity,
      state.resources.bufos
    );
    
    if (result.success) {
      // Spend resources
      getStateManager().setState({
        resources: {
          bufos: state.resources.bufos - result.cost
        }
      });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Get the maximum quantity of a generator that can be purchased
   */
  public static getMaxAffordable(generatorType: GeneratorType): number {
    const generatorManager = getGameCore().getGeneratorManager();
    const state = getStateManager().getState();
    
    return generatorManager.getMaxAffordable(generatorType, state.resources.bufos);
  }
  
  /**
   * Get available upgrades
   */
  public static getAvailableUpgrades(): Upgrade[] {
    const upgradeManager = getGameCore().getUpgradeManager();
    const state = getStateManager().getState();
    
    // Create a properly typed generatorCounts object
    const generatorCounts = {} as Record<GeneratorType, number>;
    
    // Populate with actual values from state.generators
    Object.entries(state.generators).forEach(([type, generator]) => {
      generatorCounts[type as GeneratorType] = generator.count;
    });
    
    return upgradeManager.checkAvailableUpgrades(state, generatorCounts);
  }

  /**
   * Buy an upgrade
   */
  public static buyUpgrade(upgradeId: string): boolean {
    const upgradeManager = getGameCore().getUpgradeManager();
    const state = getStateManager().getState();
    
    const result = upgradeManager.purchaseUpgrade(upgradeId, state.resources.bufos);
    
    if (result.success) {
      // Spend resources
      getStateManager().setState({
        resources: {
          bufos: state.resources.bufos - result.cost
        }
      });
      
      // Apply upgrade effects
      // This would need to be implemented in the future
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Get purchased upgrades
   */
  public static getPurchasedUpgrades(): string[] {
    return getGameCore().getUpgradeManager().getPurchasedUpgrades();
  }
  
  /**
   * Get explorer data
   */
  public static getExplorer(): ExplorerData {
    return getGameCore().getExplorerManager().getExplorer();
  }
  
  /**
   * Start exploration
   */
  public static startExploration(area: string): boolean {
    return getGameCore().getExplorerManager().startExploration(area);
  }
  
  /**
   * Get available exploration areas
   */
  public static getAvailableAreas(): string[] {
    return getGameCore().getExplorerManager().getAvailableAreas();
  }
  
  /**
   * Upgrade explorer stat
   */
  public static upgradeExplorerStat(statName: 'attack' | 'defense' | 'speed' | 'luck'): {
    success: boolean;
    cost: number;
  } {
    const explorerManager = getGameCore().getExplorerManager();
    const state = getStateManager().getState();
    
    const result = explorerManager.upgradeExplorerStat(statName, state.resources.bufos);
    
    if (result.success) {
      // Spend resources
      getStateManager().setState({
        resources: {
          bufos: state.resources.bufos - result.cost
        }
      });
    }
    
    return result;
  }
  
  /**
   * Get explorer stats
   */
  public static getExplorerStats(): {
    powerRating: number;
    dps: number;
    survivalTime: number;
    healthPercent: number;
  } {
    return getGameCore().getExplorerManager().getExplorerStats();
  }
  
  /**
   * Register event listener
   * @param event Event name
   * @param callback Function to call when event is emitted
   */
  public static on(event: string, callback: EventCallback): void {
    getEventBus().on(event, callback);
  }
  
  /**
   * Remove event listener
   * @param event Event name
   * @param callback Function to remove
   */
  public static off(event: string, callback: EventCallback): void {
    getEventBus().off(event, callback);
  }
  
  /**
   * Get production statistics
   */
  public static getProductionStatistics(): any {
    return getGameCore().getGeneratorManager().getProductionStats();
  }
}

// Export all modules
export {
  getGameCore,
  getGameLoop,
  saveGame,
  loadGame,
  exportSave,
  importSave,
  DEFAULT_GAME_STATE,
  updateState,
  calculateDerivedState,
  validateState
};