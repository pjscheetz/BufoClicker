import { GameState, PartialGameState } from '../core/types';
import { DEFAULT_EXPLORER_DATA } from '../models/explorer';
import { INITIAL_GENERATORS, GeneratorType, GeneratorData } from '../models/generators';
import * as Logger from './logger';

/**
 * Deep merges partial state updates into the current state while maintaining immutability
 */
export function updateState(currentState: GameState, updates: PartialGameState): GameState {
  const newState = { ...currentState };

  // Update resources
  if (updates.resources) {
    newState.resources = {
      ...newState.resources,
      ...updates.resources
    };
  }

  // Update generators
  if (updates.generators) {
    newState.generators = { ...newState.generators };
    
    Object.entries(updates.generators).forEach(([key, genUpdate]) => {
      const genKey = key as keyof typeof updates.generators;
      if (genUpdate && newState.generators[genKey]) {
        newState.generators[genKey] = {
          ...newState.generators[genKey],
          ...genUpdate
        };
      }
    });
  }

  // Update explorer
  if (updates.explorer) {
    newState.explorer = {
      ...newState.explorer,
      ...updates.explorer
    };
  }

  // Update upgrades
  if (updates.upgrades) {
    newState.upgrades = {
      ...newState.upgrades,
      ...updates.upgrades,
      // Handle array properties to ensure they're new references
      purchased: updates.upgrades.purchased 
        ? [...updates.upgrades.purchased] 
        : [...newState.upgrades.purchased],
      available: updates.upgrades.available 
        ? [...updates.upgrades.available] 
        : [...newState.upgrades.available]
    };
  }

  // Update achievements
  if (updates.achievements) {
    newState.achievements = {
      ...newState.achievements,
      ...updates.achievements,
      // Handle array and object properties to ensure they're new references
      unlocked: updates.achievements.unlocked 
        ? [...updates.achievements.unlocked] 
        : [...newState.achievements.unlocked],
      progress: updates.achievements.progress 
        ? {...updates.achievements.progress} 
        : {...newState.achievements.progress},
      customEvents: updates.achievements.customEvents 
        ? {...updates.achievements.customEvents} 
        : {...newState.achievements.customEvents}
    };
  }

  // Update game settings
  if (updates.gameSettings) {
    newState.gameSettings = {
      ...newState.gameSettings,
      ...updates.gameSettings
    };
  }

  return calculateDerivedState(newState);
}

/**
 * Creates a default game state
 */
export function createDefaultState(): GameState {
  // Check if generators data is loaded
  const hasGeneratorsData = Object.keys(INITIAL_GENERATORS).length > 0;
  
  // Log warning if generators data isn't loaded
  if (!hasGeneratorsData) {
    Logger.warn('Creating default state with empty generators data. Data may not be loaded yet.');
  }
  
  // Use default values or loaded data depending on availability
  return {
    resources: {
      bufos: 0,
      totalBufos: 0,
      baseClickPower: 1,
      clickPower: 1,
      clickMultiplier: 1, // Add clickMultiplier property
      productionMultiplier: 1
    },
    // Use available data or create a fallback empty object if no generators are loaded
    generators: hasGeneratorsData 
      ? structuredClone(INITIAL_GENERATORS)
      : {} as Record<GeneratorType, GeneratorData>,
    explorer: structuredClone(DEFAULT_EXPLORER_DATA),
    upgrades: {
      purchased: [],
      available: []
    },
    achievements: {
      unlocked: [],
      progress: {},
      clickCount: 0,
      customEvents: {}
    },
    gameSettings: {
      lastTick: Date.now(),
      lastSaved: Date.now(),
      autoSave: true,
      version: '1.0.0'
    }
  };
}

/**
 * Calculate derived state values that depend on other state values
 * @param state Current game state
 * @returns Updated game state with derived values
 */
export function calculateDerivedState(state: GameState): GameState {
  // Calculate click power based on base power and click multiplier
  const clickPower = state.resources.baseClickPower * state.resources.clickMultiplier;
  
  return {
    ...state,
    resources: {
      ...state.resources,
      clickPower
    }
  };
}

/**
 * Validates if an object conforms to the GameState interface
 * @param state Object to validate
 * @returns Whether the object is a valid GameState
 */
export function validateState(state: any): state is GameState {
  if (!state || typeof state !== 'object') return false;
  
  // Check primary structures
  if (!state.resources || !state.generators || !state.explorer || 
      !state.upgrades || !state.gameSettings) {
    return false;
  }
  
  // Check essential resources properties
  const requiredResourceProps = ['bufos', 'totalBufos', 'clickPower', 'clickMultiplier', 'productionMultiplier'];
  if (!requiredResourceProps.every(prop => typeof state.resources[prop] === 'number')) {
    return false;
  }
  
  // Check upgrades structure
  if (!Array.isArray(state.upgrades.purchased) || !Array.isArray(state.upgrades.available)) {
    return false;
  }
  
  // Check game settings
  const requiredSettingsProps = ['lastSaved', 'lastTick', 'version'];
  if (!requiredSettingsProps.every(prop => typeof state.gameSettings[prop] !== 'undefined')) {
    return false;
  }
  
  return true;
}