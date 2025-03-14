/**
 * Module for loading and managing styles
 */

/**
 * Load a CSS file from a given path
 * @param path Path to the CSS file
 * @returns Promise that resolves when the CSS is loaded
 */
export function loadStylesheet(path: string): Promise<HTMLLinkElement> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = path;
    
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${path}`));
    
    document.head.appendChild(link);
  });
}

/**
 * Add styles directly to the document
 * @param styles CSS string
 * @param id Optional ID for the style element
 * @returns The created style element
 */
export function addStyles(styles: string, id?: string): HTMLStyleElement {
  const styleElement = document.createElement('style');
  if (id) styleElement.id = id;
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
  return styleElement;
}

/**
 * Initialize all styles for the application
 * This is the main entry point for styles
 */
export async function initializeStyles(): Promise<void> {
  try {
    // Load main style file which imports all others
    await loadStylesheet('./styles/index.css');
    console.log('Styles loaded successfully');
  } catch (error) {
    console.error('Error loading styles:', error);
    
    // Fallback: If loading external stylesheets fails, 
    // we'll need to add critical styles inline
    addStyles(`
      /* Critical styles for basic layout */
      .three-column-layout {
        display: flex;
        gap: 16px;
        width: 100%;
      }
      
      .column {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      /* Tooltip critical styles */
      .game-tooltip {
        position: absolute;
        z-index: 100;
        background-color: white;
        border-radius: 8px;
        border: 1px solid #ddd;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        padding: 16px;
        max-width: 300px;
        pointer-events: none;
      }
      
      @media (max-width: 1024px) {
        .three-column-layout {
          flex-direction: column;
        }
      }
    `, 'critical-fallback-styles');
  }
}

/**
 * Clean up styles (for testing/development)
 */
export function cleanupStyles(): void {
  // Remove any dynamically added style elements
  document.querySelectorAll('style[id^="dynamic-"]').forEach(el => el.remove());
}

// Export the module
export default {
  loadStylesheet,
  addStyles,
  initializeStyles,
  cleanupStyles
};