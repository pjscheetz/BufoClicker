import { getStateManager } from '../core/stateManager';
import { getEventBus } from '../core/eventBus';
import { getGameCore } from '../game/gameCore';
import { getGameLoop } from '../game/gameLoop';
import { getUIManager } from '../managers/UIManager';
import { getGeneratorManager } from '../managers/generatorManager';
import { getUpgradeManager } from '../managers/upgradeManager';
import { getExplorerManager } from '../managers/explorerManager';
import { exportSave, importSave, saveGame, loadGame } from '../game/gameSave';
import * as Logger from './logger';

/**
 * Debug Tools
 * 
 * Provides debugging utilities accessible in development mode
 * Do not import this file in production code!
 */

// Export core systems for debugging
export const state = getStateManager();
export const events = getEventBus();
export const gameCore = getGameCore();
export const gameLoop = getGameLoop();
export const ui = getUIManager();

// Export managers for debugging
export const generators = getGeneratorManager();
export const upgrades = getUpgradeManager();
export const explorer = getExplorerManager();

// Save/load helpers
export const save = {
  save: () => saveGame(),
  load: () => loadGame(),
  export: () => exportSave(),
  import: (saveString: string) => importSave(saveString)
};

// Time control
export const time = {
  pause: () => gameLoop.stop(),
  resume: () => gameLoop.start(),
  setTimeScale: (scale: number) => gameLoop.setTimeScale(scale),
  getTimeScale: () => gameLoop.getTimeScale()
};

// Resource manipulation
export const resources = {
  add: (amount: number) => {
    const currentState = state.getState();
    state.setState({
      resources: {
        bufos: currentState.resources.bufos + amount,
        totalBufos: currentState.resources.totalBufos + amount
      }
    });
    return currentState.resources.bufos + amount;
  },
  set: (amount: number) => {
    state.setState({
      resources: {
        bufos: amount,
        totalBufos: Math.max(amount, state.getState().resources.totalBufos)
      }
    });
    return amount;
  },
  get: () => {
    const currentState = state.getState();
    return {
      bufos: currentState.resources.bufos,
      totalBufos: currentState.resources.totalBufos
    };
  }
};

// Game state inspection
export const inspect = {
  state: () => state.getState(),
  generators: () => generators.getAllGenerators(),
  upgrades: () => {
    const purchasedUpgrades = upgrades.getPurchasedUpgrades();
    const availableUpgrades = upgrades.getAvailableUpgrades();
    return { purchased: purchasedUpgrades, available: availableUpgrades };
  },
  explorer: () => explorer.getExplorer(),
  production: () => generators.getProductionStats()
};

// Event debugging
export const events_debug = {
  enableDebug: () => events.setDebugMode(true),
  disableDebug: () => events.setDebugMode(false),
  listEvents: () => events.getEventNames(),
  emit: (eventName: string, data?: any) => events.emit(eventName, data)
};

// Logger controls
export const logging = {
  setLevel: (level: Logger.LogLevel) => Logger.setLogLevel(level),
  getLevel: () => Logger.getLogLevel(),
  enableTimestamps: (enable: boolean) => Logger.enableTimestamps(enable),
  enableConsoleColors: (enable: boolean) => Logger.enableConsoleColors(enable)
};

import { GeneratorType } from '../models/generators';

// Generator manipulation
export const generator_debug = {
  unlockAll: () => {
    const allGenerators = generators.getAllGenerators();
    allGenerators.forEach(generator => {
      if (!generator.unlocked) {
        state.setState({
          generators: {
            [generator.id]: {
              unlocked: true,
              enabled: true
            }
          }
        });
      }
    });
    return "All generators unlocked";
  },
  give: (type: string, amount: number = 1) => {
    const currentState = state.getState();
    
    // Check if the provided type is a valid GeneratorType
    if (!Object.values(GeneratorType).includes(type as GeneratorType)) {
      return `Generator ${type} not found - valid types are: ${Object.values(GeneratorType).join(', ')}`;
    }
    
    // Safe to cast since we've validated
    const generatorType = type as GeneratorType;
    const generator = currentState.generators[generatorType];
    
    if (!generator) {
      return `Generator ${type} exists in enum but not in state - this is an error`;
    }
    
    state.setState({
      generators: {
        [generatorType]: {
          count: generator.count + amount
        }
      }
    });
    
    // Recalculate generators
    generators.recalculateGenerator(generatorType);
    
    return `Added ${amount} ${generator.name} generators`;
  }
};

// Upgrade manipulation
export const upgrade_debug = {
  unlockAll: () => {
    const allUpgrades = upgrades.getAvailableUpgrades();
    const purchasedUpgrades = upgrades.getPurchasedUpgrades();
    const currentState = state.getState();
    
    // Make all upgrades available
    state.setState({
      upgrades: {
        available: [...currentState.upgrades.available, ...allUpgrades.map(u => u.id)]
      }
    });
    
    return `Unlocked ${allUpgrades.length} upgrades`;
  },
  purchase: (upgradeId: string) => {
    const result = upgrades.purchaseUpgrade(upgradeId, Infinity);
    return result.success ? `Purchased upgrade ${upgradeId}` : `Failed to purchase ${upgradeId}`;
  }
};

// Reset functions
export const reset = {
  softReset: () => {
    gameCore.resetState();
    return "Game state reset";
  },
  hardReset: () => {
    localStorage.clear();
    window.location.reload();
    return "Local storage cleared, reloading page";
  }
};

// Performance measurement
export const performance = {
  measure: (label: string, fn: () => void) => {
    console.time(label);
    try {
      fn();
    } finally {
      console.timeEnd(label);
    }
  }
};

// Print help information
export function help() {
  console.group('%c🐸 Bufo Idle Debug Tools 🐸', 'color: #4CAF50; font-weight: bold;');
  
  console.log('%cState Management:', 'font-weight: bold;');
  console.log('- state: Access to the state manager');
  console.log('- inspect: Functions to inspect game state');
  console.log('- resources: Manipulate game resources');
  
  console.log('%cGame Control:', 'font-weight: bold;');
  console.log('- gameCore: Access to the game core');
  console.log('- gameLoop: Access to the game loop');
  console.log('- time: Control game time');
  
  console.log('%cSaving/Loading:', 'font-weight: bold;');
  console.log('- save: Save/load/export/import functions');
  console.log('- reset: Reset game state');
  
  console.log('%cDebugging:', 'font-weight: bold;');
  console.log('- events: Event bus access');
  console.log('- events_debug: Event debugging tools');
  console.log('- logging: Logger configuration');
  console.log('- performance: Performance measurement tools');
  
  console.log('%cGame Mechanics:', 'font-weight: bold;');
  console.log('- generators: Generator manager access');
  console.log('- generator_debug: Generator debugging tools');
  console.log('- upgrades: Upgrade manager access');
  console.log('- upgrade_debug: Upgrade debugging tools');
  console.log('- explorer: Explorer manager access');
  
  console.groupEnd();
  
  return "Debug tools help displayed in console";
}

// Call help by default when accessed in console
help();

// Return everything in a single object for easy access
export default {
  state,
  events,
  gameCore,
  gameLoop,
  ui,
  generators,
  upgrades,
  explorer,
  save,
  time,
  resources,
  inspect,
  events_debug,
  logging,
  generator_debug,
  upgrade_debug,
  reset,
  performance,
  help
};