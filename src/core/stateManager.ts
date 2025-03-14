import { GameState, StateChangeListener, PartialGameState } from './types';
import { createDefaultState, updateState, validateState } from '../utils/stateUtils';

/**
 * Singleton state manager class for centralized game state management
 */
export class StateManager {
  private static instance: StateManager;
  private state: GameState;
  private subscribers: StateChangeListener[] = [];
  private batchUpdating = false;
  private pendingUpdates: PartialGameState[] = [];
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.state = createDefaultState();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }
  
  /**
   * Get the current state (immutable copy)
   */
  public getState(): GameState {
    return structuredClone(this.state);
  }
  
  /**
   * Update the state with partial updates
   * @param updates Partial state updates
   */
  public setState(updates: PartialGameState): void {
    const oldState = this.state;
    
    // Apply updates and get new state
    this.state = updateState(oldState, updates);
    
    // Notify subscribers
    if (!this.batchUpdating) {
      this.notifySubscribers(oldState);
    } else {
      // Store updates for batching
      this.pendingUpdates.push(updates);
    }
  }
  
  /**
   * Start batching updates to reduce notifications
   */
  public startBatch(): void {
    this.batchUpdating = true;
    this.pendingUpdates = [];
  }
  
  /**
   * End batching updates and notify subscribers once
   */
  public endBatch(): void {
    if (!this.batchUpdating) return;
    
    this.batchUpdating = false;
    
    if (this.pendingUpdates.length > 0) {
      const oldState = structuredClone(this.state);
      this.notifySubscribers(oldState);
      this.pendingUpdates = [];
    }
  }
  
  /**
   * Subscribe to state changes
   * @param callback Function to call when state changes
   * @returns Unsubscribe function
   */
  public subscribe(callback: StateChangeListener): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.unsubscribe(callback);
    };
  }
  
  /**
   * Unsubscribe from state changes
   * @param callback The callback to remove
   */
  public unsubscribe(callback: StateChangeListener): void {
    const index = this.subscribers.indexOf(callback);
    if (index !== -1) {
      this.subscribers.splice(index, 1);
    }
  }
  
  /**
   * Reset state to defaults
   */
  public resetState(): void {
    const oldState = this.state;
    this.state = createDefaultState();
    this.notifySubscribers(oldState);
  }
  
  /**
   * Load state from an object
   * @param loadedState State to load
   * @returns True if state was valid and loaded successfully
   */
  public loadState(loadedState: any): boolean {
    if (!validateState(loadedState)) {
      return false;
    }
    
    const oldState = this.state;
    this.state = loadedState;
    this.notifySubscribers(oldState);
    return true;
  }
  
  /**
   * Notify all subscribers of state change
   */
  private notifySubscribers(oldState: GameState): void {
    const currentState = this.getState();
    
    for (const subscriber of this.subscribers) {
      try {
        subscriber(currentState, oldState);
      } catch (error) {
        console.error('Error in state change subscriber:', error);
      }
    }
  }
}

// Export a singleton instance getter
export function getStateManager(): StateManager {
  return StateManager.getInstance();
}