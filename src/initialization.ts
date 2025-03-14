import { getStateManager } from './core/stateManager';
import { getEventBus } from './core/eventBus';
import { GameCore, getGameCore } from './game/gameCore';
import { GameLoop, getGameLoop } from './game/gameLoop';
import { loadGame, saveGame } from './game/gameSave';
import { getUIManager } from './managers/UIManager';
import { initializeManagers } from './managers';
import * as Logger from './utils/logger';
import { GAME_STARTED, GAME_LOADED, GAME_TICK } from './core/eventTypes';
import { loadGameData, isGameDataLoaded, verifyGameData } from './game/gameLoader';

/**
 * Initialization status for progress tracking
 */
export interface InitializationStatus {
  step: string;
  progress: number;
  error?: Error;
}

/**
 * Callback function to report initialization progress
 */
export type InitStatusCallback = (status: InitializationStatus) => void;

/**
 * Initialize the entire game
 * @param rootElementId ID of the root DOM element for the game
 * @param statusCallback Optional callback for reporting initialization progress
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeGame(
  rootElementId: string = 'game-container',
  statusCallback?: InitStatusCallback
): Promise<boolean> {
  try {
    // Setup logger first
    Logger.setLogLevel(process.env.NODE_ENV === 'development' ? Logger.LogLevel.DEBUG : Logger.LogLevel.INFO);
    Logger.setContext('GameInit');
    Logger.log('Starting game initialization');
    
    // Report status
    const reportStatus = (step: string, progress: number) => {
      Logger.debug(`Initialization step: ${step} (${progress}%)`);
      if (statusCallback) {
        statusCallback({ step, progress });
      }
    };
    
    // Step 1: Initialize core systems
    reportStatus('Initializing core systems', 10);
    const stateManager = getStateManager();
    const eventBus = getEventBus();
    
    // Enable event debugging in development
    if (process.env.NODE_ENV === 'development') {
      eventBus.setDebugMode(true);

      // Exclude noisy events from debug logging
    eventBus.setExcludedEvents([
      GAME_TICK,
      'EXPLORER_UPDATED',
      'tick',
      'explorerUpdated',
      'GENERATOR_PRODUCTION_UPDATED'
  ]);
    }
    
    // Step 2: Load game data from JSON files
    reportStatus('Loading game data', 20);
    try {
      // Load all game data (generators, upgrades, etc.)
      await loadGameData();
      
      // Verify data loaded correctly
      const dataStatus = verifyGameData();
      Logger.log(`Data loaded: ${dataStatus.generatorsLoaded} generators, ${dataStatus.upgradesLoaded} upgrades`);
      
      if (!isGameDataLoaded()) {
        Logger.warn('Some game data failed to load. Using defaults where necessary.');
      }
    } catch (error) {
      Logger.error('Error loading game data from JSON:', error);
      // We'll continue anyway but with defaults
    }
    
    // Step 3: Initialize managers (which will use the loaded data)
    reportStatus('Initializing managers', 40);
    initializeManagers();
    
    // Step 4: Initialize the UI
    reportStatus('Initializing UI', 60);
    const uiManager = getUIManager();
    try {
      uiManager.init(rootElementId);
    } catch (error) {
      Logger.error('Error initializing UI', error);
      // Continue initialization even if UI fails
    }
    
    // Step 5: Initialize game core
    reportStatus('Initializing game core', 70);
    const gameCore = getGameCore();
    gameCore.init();
    
    // Step 6: Initialize game loop
    reportStatus('Initializing game loop', 80);
    const gameLoop = getGameLoop();
    
    // Step 7: Load saved game or use default state
    reportStatus('Loading saved game', 90);
    const loadedSuccessfully = await loadGameWithRetry();
    
    // Step 8: Start game systems
    reportStatus('Starting game systems', 95);
    
    // Register event listeners for global events
    setupGlobalEvents();
    
    // Start game loop
    gameLoop.start();
    
    // Step 9: Complete initialization
    reportStatus('Initialization complete', 100);
    Logger.log('Game initialization complete');
    
    // Emit game started event
    eventBus.emit(GAME_STARTED, {
      timestamp: Date.now(),
      loadedSave: loadedSuccessfully
    });
    
    return true;
  } catch (error) {
    Logger.error('Critical error during initialization:', error);
    if (statusCallback) {
      statusCallback({
        step: 'Initialization failed',
        progress: 0,
        error: error instanceof Error ? error : new Error(String(error))
      });
    }
    return false;
  }
}

/**
 * Setup global event handlers for the game
 */
// Modified section from initialization.ts

/**
 * Setup global event handlers for the game
 */
function setupGlobalEvents(): void {
  const eventBus = getEventBus();
  
  // Handle window visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Game is being hidden, pause game but don't automatically save
      Logger.debug('Game visibility changed to hidden, pausing game');
      
      // Pause game processing
      getGameCore().stop();
      getGameLoop().stop();
    } else {
      // Game is becoming visible again, resume
      Logger.debug('Game visibility changed to visible, resuming game');
      getGameCore().start();
      getGameLoop().start();
    }
  });
  
  // We're removing the beforeunload handler to prevent auto-saving
  // when the page refreshes or closes
  
  // Report errors through the event bus
  window.addEventListener('error', (event) => {
    eventBus.emit('ERROR', {
      message: event.message,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });
  
  // Setup custom event handlers
  eventBus.on(GAME_LOADED, (data) => {
    // Perform any post-load operations
    getGameCore().checkUnlocks();
  });
}

/**
 * Attempt to load game with retry capability
 * @param maxRetries Maximum number of retries
 * @returns Whether load was successful
 */
async function loadGameWithRetry(maxRetries: number = 2): Promise<boolean> {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      const loadResult = loadGame();
      
      if (loadResult) {
        Logger.log('Game save loaded successfully');
        return true;
      } else if (retries < maxRetries) {
        Logger.warn(`Failed to load save, retrying (${retries + 1}/${maxRetries})...`);
        // Wait a moment before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        Logger.warn('Failed to load save, reverting to default state');
      }
    } catch (error) {
      Logger.error('Error loading save:', error);
      if (retries >= maxRetries) {
        // Reset to fresh state on final error
        getGameCore().resetState();
        return false;
      }
    }
    
    retries++;
  }
  
  return false;
}
/**
 * Create a loading UI element to display initialization progress
 * @param containerId Container element ID
 * @returns Object with methods to update and remove the loading UI
 */
export function createLoadingUI(containerId: string = 'game-container'): {
  update: (status: InitializationStatus) => void;
  remove: () => void;
} {
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error(`Container element #${containerId} not found`);
    return {
      update: () => {},
      remove: () => {}
    };
  }
  
  // Create loading UI elements
  const loadingElement = document.createElement('div');
  loadingElement.className = 'game-loading';
  loadingElement.style.position = 'absolute';
  loadingElement.style.top = '0';
  loadingElement.style.left = '0';
  loadingElement.style.width = '100%';
  loadingElement.style.height = '100%';
  loadingElement.style.display = 'flex';
  loadingElement.style.flexDirection = 'column';
  loadingElement.style.alignItems = 'center';
  loadingElement.style.justifyContent = 'center';
  loadingElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  loadingElement.style.color = '#fff';
  loadingElement.style.zIndex = '1000';
  
  const titleElement = document.createElement('h2');
  titleElement.textContent = 'Loading Bufo Idle...';
  titleElement.style.marginBottom = '20px';
  
  const progressContainer = document.createElement('div');
  progressContainer.style.width = '300px';
  progressContainer.style.height = '20px';
  progressContainer.style.backgroundColor = '#333';
  progressContainer.style.borderRadius = '10px';
  progressContainer.style.overflow = 'hidden';
  
  const progressBar = document.createElement('div');
  progressBar.style.width = '0%';
  progressBar.style.height = '100%';
  progressBar.style.backgroundColor = '#4CAF50';
  progressBar.style.transition = 'width 0.3s ease-out';
  
  const statusElement = document.createElement('div');
  statusElement.style.marginTop = '10px';
  statusElement.style.fontSize = '14px';
  statusElement.style.color = '#ccc';
  
  // Assemble elements
  progressContainer.appendChild(progressBar);
  loadingElement.appendChild(titleElement);
  loadingElement.appendChild(progressContainer);
  loadingElement.appendChild(statusElement);
  
  // Add to container
  container.appendChild(loadingElement);
  
  // Return methods for updating and removing
  return {
    update: (status: InitializationStatus) => {
      progressBar.style.width = `${status.progress}%`;
      statusElement.textContent = status.step;
      
      if (status.error) {
        statusElement.textContent = `Error: ${status.error.message}`;
        statusElement.style.color = '#FF5252';
      }
    },
    remove: () => {
      // Fade out animation
      loadingElement.style.transition = 'opacity 0.5s ease-out';
      loadingElement.style.opacity = '0';
      
      // Remove after animation
      setTimeout(() => {
        if (loadingElement.parentNode) {
          loadingElement.parentNode.removeChild(loadingElement);
        }
      }, 500);
    }
  };
}