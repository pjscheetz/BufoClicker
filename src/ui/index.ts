/**
 * UI module exports
 * This file serves as the public API for the UI module
 */

// Re-export components for external use
export * from './components/resourceDisplay';
export * from './components/clickArea';
export * from './components/generatorList';
export * from './components/generatorItem';
export * from './components/shop';
export * from './components/shopItem';
export * from './components/upgradeList';
export * from './components/upgradeItem';

// Export UI Manager and related utilities
export { UIManager, getUIManager, ModalOptions } from '../managers/UIManager';
export * as templates from './templates';
export * as styles from './styles';
export * from './constants';

// Factory functions for creating UI components
import { 
  ResourceDisplay, ResourceDisplayOptions,
  ClickArea, ClickAreaOptions
} from './index';

/**
 * Initialize the UI manager
 * @param containerId ID of the container element
 * @returns The UIManager instance
 */
export function initUI(containerId: string = 'game-container'): UIManager {
  const manager = getUIManager();
  manager.init(containerId);
  return manager;
}

// Factory functions for all UI components
import { UIManager, getUIManager } from '../managers/UIManager';

/**
 * Update UI based on game state
 * This is a convenience method for updating key UI elements
 */
export function updateUI(): void {
  // This function can be expanded to trigger UI-wide updates
  // For now it just ensures the UI manager is initialized
  getUIManager();
}