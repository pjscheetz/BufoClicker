import { Container } from '../core/Container';
import { ComponentOptions } from '../core/types';
import { UpgradeItem } from './upgradeItem';
import { getGameCore } from '../../game/gameCore';
import { getStateManager } from '../../core/stateManager';
import { Upgrade } from '../../models/upgrades';

/**
 * Container component that displays available upgrades
 */
export class UpgradeList extends Container {
  /** Element for empty state messaging */
  private emptyStateElement: HTMLElement | null = null;
  /** Map of active upgrade items */
  private upgradeItems: Map<string, UpgradeItem> = new Map();

  /**
   * Create an upgrade list component
   */
  constructor(options: ComponentOptions = {}) {
    super({
      id: options.id || 'upgrades-container',
      className: options.className || 'upgrades-grid',
      ...options
    });
  }

  /**
   * Set up the component
   */
  protected setup(): void {
    if (!this.element) return;
    
    // Create or find empty state element
    const existingEmptyState = this.element.querySelector('.empty-upgrades');
    if (existingEmptyState) {
      this.emptyStateElement = existingEmptyState as HTMLElement;
    } else {
      this.emptyStateElement = document.createElement('div');
      this.emptyStateElement.classList.add('empty-upgrades');
      this.emptyStateElement.textContent = 'No upgrades available yet.';
      this.element.appendChild(this.emptyStateElement);
    }

    // Connect to state to get available upgrades
    this.connectToState(
      state => {
        // Get available upgrades from state
        return state.upgrades.available.map(upgradeId => {
          // Find the upgrade in the upgrade manager
          return getGameCore().getUpgradeManager().findUpgradeById(upgradeId);
        }).filter(upgrade => upgrade !== undefined) as Upgrade[];
      },
      this.updateUpgrades.bind(this)
    );

    // Listen for upgrade purchase events
    this.subscribeToEvent('UPGRADE_PURCHASED', (data: { upgradeId: string }) => {
      this.refreshUpgrades();
    });

    // Listen for upgrades available event
    this.subscribeToEvent('UPGRADES_AVAILABLE', () => {
      this.refreshUpgrades();
    });
  }

  /**
   * Update upgrades based on state change
   */
  private updateUpgrades(availableUpgrades: Upgrade[]): void {
    if (!this.element) return;

    if (availableUpgrades.length === 0) {
      // Show empty state
      if (this.emptyStateElement) {
        // Make sure the empty state element is in the DOM
        if (!this.element.contains(this.emptyStateElement)) {
          this.element.appendChild(this.emptyStateElement);
        }
        this.emptyStateElement.style.display = 'block';
      }
      
      // Clean up any existing upgrade items
      this.clearUpgradeItems();
    } else {
      // Hide empty state
      if (this.emptyStateElement) {
        this.emptyStateElement.style.display = 'none';
      }
      
      // Determine which upgrades to add/remove
      const currentUpgradeIds = new Set(this.upgradeItems.keys());
      const newUpgradeIds = new Set(availableUpgrades.map(u => u.id));
      
      // Remove upgrade items that are no longer available
      for (const id of currentUpgradeIds) {
        if (!newUpgradeIds.has(id)) {
          this.removeUpgradeItem(id);
        }
      }
      
      // Add new upgrade items
      for (const upgrade of availableUpgrades) {
        if (!currentUpgradeIds.has(upgrade.id)) {
          this.addUpgradeItem(upgrade);
        }
      }
    }
    
    // Update parent count indicator
    this.updateUpgradeCountIndicator(availableUpgrades.length);
  }
  
  /**
   * Add a new upgrade item to the container
   */
  private addUpgradeItem(upgrade: Upgrade): void {
    if (!this.element) return;
    
    // Create container for the upgrade item
    const container = document.createElement('div');
    container.className = 'upgrade-icon-container';
    container.id = `upgrade-container-${upgrade.id}`;
    
    // Add container to grid
    this.element.appendChild(container);
    
    // Create upgrade item
    const upgradeItem = new UpgradeItem({
      element: container,
      id: `upgrade-item-${upgrade.id}`
    });
    
    // Initialize and update upgrade item
    upgradeItem.init();
    upgradeItem.update(upgrade);
    
    // Store reference
    this.upgradeItems.set(upgrade.id, upgradeItem);
  }
  
  /**
   * Remove an upgrade item from the container
   */
  private removeUpgradeItem(upgradeId: string): void {
    const item = this.upgradeItems.get(upgradeId);
    if (item) {
      item.destroy();
      this.upgradeItems.delete(upgradeId);
      
      // Remove container
      const container = document.getElementById(`upgrade-container-${upgradeId}`);
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  }
  
  /**
   * Clear all upgrade items
   */
  private clearUpgradeItems(): void {
    // Destroy all upgrade items
    for (const [id, item] of this.upgradeItems.entries()) {
      item.destroy();
      
      // Remove container
      const container = document.getElementById(`upgrade-container-${id}`);
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
    
    // Clear map
    this.upgradeItems.clear();
  }

  /**
   * Update the indicator showing how many upgrades are available
   */
  private updateUpgradeCountIndicator(count: number): void {
    // Find the upgrades panel header
    const upgradesPanel = document.getElementById('upgrades-panel');
    if (!upgradesPanel) return;
    
    const header = upgradesPanel.querySelector('.panel-header h2');
    
    if (header && count > 0) {
      header.textContent = `Upgrades (${count})`;
      upgradesPanel.classList.add('has-new-upgrades');
    } else if (header) {
      header.textContent = 'Upgrades';
      upgradesPanel.classList.remove('has-new-upgrades');
    }
  }

  /**
   * Refresh all upgrades
   */
  public refreshUpgrades(): void {
    const state = getStateManager().getState();
    const availableUpgradeIds = state.upgrades.available;
    
    const upgradeManager = getGameCore().getUpgradeManager();
    const availableUpgrades = availableUpgradeIds
      .map(id => upgradeManager.findUpgradeById(id))
      .filter(upgrade => upgrade !== undefined) as Upgrade[];
      
    this.updateUpgrades(availableUpgrades);
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    // Clear all upgrade items
    this.clearUpgradeItems();
    
    // Call parent destroy
    super.destroy();
  }
}