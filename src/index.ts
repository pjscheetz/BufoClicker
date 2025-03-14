import { initializeGame, createLoadingUI } from './initialization';
import * as Logger from './utils/logger';

// Stylesheets
import '/styles/index.css';

/**
 * Main entry point for the application
 */
async function main() {
  // Set up logging
  Logger.setContext('BufoIdle');
  Logger.setLogLevel(process.env.NODE_ENV === 'development' ? Logger.LogLevel.DEBUG : Logger.LogLevel.INFO);
  
  Logger.log('Application starting');
  
  // Create loading UI
  const loadingUI = createLoadingUI('game-container');
  loadingUI.update({ step: 'Starting game initialization...', progress: 10 });
  
  // Add global error handler
  window.onerror = (message, source, lineno, colno, error) => {
    Logger.error('Unhandled error:', error || message);
    return false; // Let the default handler run as well
  };
  
  try {
    // Initialize the game - loading will happen inside initializeGame
    const success = await initializeGame('game-container', (status) => {
      // Update loading UI with status
      loadingUI.update(status);
      
      // If there's an error, log it
      if (status.error) {
        Logger.error('Initialization error:', status.error);
      }
    });
    
    // Remove loading UI after a short delay to ensure it's seen
    setTimeout(() => {
      loadingUI.remove();
    }, success ? 500 : 2000); // Keep error messages visible longer
    
    if (!success) {
      throw new Error('Game initialization failed');
    }
    
    Logger.log('Game successfully initialized and ready to play');
    
    // Check if development mode
    if (process.env.NODE_ENV === 'development') {
      // Add debug helpers to window for development
      setupDebugHelpers();
    }
  } catch (error) {
    Logger.error('Critical application error:', error);
    
    // Show error in loading UI
    loadingUI.update({
      step: 'Fatal Error: Could not initialize the game',
      progress: 0,
      error: error instanceof Error ? error : new Error(String(error))
    });
    
    // Don't remove loading UI, keep error visible
  }
}

/**
 * Set up debug helpers for development environment
 */
function setupDebugHelpers() {
  // Import all debug utilities
  import('./utils/debugTools').then(debugTools => {
    // Expose debug tools to the window object
    (window as any).debugTools = debugTools;
    
    Logger.log('Debug tools loaded. Access via window.debugTools');
    
    // Log some helpful debug message to console
    console.log(
      '%c🐸 Bufo Idle: Development Mode 🐸',
      'background: #4CAF50; color: white; font-size: 14px; padding: 5px; border-radius: 5px;'
    );
    console.log(
      '%cDebug tools available via window.debugTools',
      'font-style: italic; color: #333;'
    );
  }).catch(error => {
    Logger.error('Failed to load debug tools:', error);
  });
}

// Start the application
main().catch(error => {
  console.error('Fatal error in main:', error);
  
  // Create a visible error message if the loading UI isn't available
  const container = document.getElementById('game-container');
  if (container) {
    container.innerHTML = `
      <div style="color: red; padding: 20px; text-align: center;">
        <h2>Game Failed to Start</h2>
        <p>An unexpected error occurred: ${error?.message || 'Unknown error'}</p>
        <p>Please try refreshing the page. If the problem persists, contact support.</p>
      </div>
    `;
  }
});