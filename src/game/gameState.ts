import { GameState, PartialGameState } from '../core/types';
import { INITIAL_GENERATORS, GeneratorType, GeneratorData } from '../models/generators';
import { DEFAULT_EXPLORER_DATA } from '../models/explorer';

/**
 * Default initial game state
 */
export const DEFAULT_GAME_STATE: GameState = {
  resources: {
    bufos: 0,
    totalBufos: 0,
    baseClickPower: 1,
    clickPower: 1,
    clickMultiplier: 1,  // Initialize click multiplier
    productionMultiplier: 1,  // This now only affects generators
    clickCount: 0  // Initialize click count
  },
  generators: INITIAL_GENERATORS,
  explorer: DEFAULT_EXPLORER_DATA,
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
 * Update part of the game state
 * @param currentState Current game state
 * @param updates Partial state updates
 * @returns Updated game state
 */
export function updateState(currentState: GameState, updates: PartialGameState): GameState {
  // Create a new state object to maintain immutability
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
    
    // Update each generator that exists in updates
    Object.keys(updates.generators).forEach((key) => {
      // We need to verify this is a valid GeneratorType key
      if (key in newState.generators) {
        const generatorKey = key as GeneratorType;
        // We use non-null assertion here because we already checked updates.generators exists
        const genUpdate = updates.generators![generatorKey];
        
        if (genUpdate) {
          newState.generators[generatorKey] = {
            ...newState.generators[generatorKey],
            ...genUpdate
          };
        }
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

  // Update game settings
  if (updates.gameSettings) {
    newState.gameSettings = {
      ...newState.gameSettings,
      ...updates.gameSettings
    };
  }

  // Calculate and apply derived state
  return calculateDerivedState(newState);
}

/**
 * Validate if an object conforms to the GameState interface
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
  const requiredResourceProps = ['bufos', 'totalBufos', 'clickPower'];
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

/**
 * Get production statistics
 * @param state Current game state
 * @returns Production statistics
 */
export function getProductionStatistics(state: GameState): {
  currentRate: number;
  perMinute: number;
  perHour: number;
  generatorContributions: {
    id: string;
    name: string;
    production: number;
    percentage: number;
    count: number;
  }[];
} {
  // Calculate total production
  let totalProduction = 0;
  const contributions: Array<{
    id: string;
    name: string;
    production: number;
    percentage: number;
    count: number;
  }> = [];
  
  // Process each generator
  Object.values(state.generators)
    .filter(g => g.count > 0 && g.totalProduction > 0)
    .forEach(generator => {
      totalProduction += generator.totalProduction;
      
      contributions.push({
        id: generator.id,
        name: generator.name,
        production: generator.totalProduction,
        percentage: 0, // Will calculate after summing
        count: generator.count
      });
    });
  
  // Calculate percentages
  if (totalProduction > 0) {
    contributions.forEach(c => {
      c.percentage = (c.production / totalProduction) * 100;
    });
  }
  
  return {
    currentRate: totalProduction,
    perMinute: totalProduction * 60,
    perHour: totalProduction * 3600,
    generatorContributions: contributions
  };
}

/**
 * Get resource display information
 * @param state Current game state
 * @returns Resource display info
 */
export function getResourceDisplay(state: GameState): {
  bufos: number;
  totalBufos: number;
  clickPower: number;
  productionRate: number;
} {
  // Calculate total production rate from all generators
  let productionRate = 0;
  
  Object.values(state.generators).forEach(generator => {
    productionRate += generator.totalProduction;
  });
  
  return {
    bufos: state.resources.bufos,
    totalBufos: state.resources.totalBufos,
    clickPower: state.resources.clickPower,
    productionRate
  };
}