import { Component } from '../core/Component';
import { ComponentOptions } from '../core/types';
import { Upgrade, UpgradeCategory } from '../../models/upgrades';
import { formatNumber } from '../../utils/numberUtils';
import { getGameCore } from '../../game/gameCore';
import { getStateManager } from '../../core/stateManager';

/**
 * Component for displaying a purchasable upgrade
 */
export class UpgradeItem extends Component {
  /** Upgrade data */
  private upgrade: Upgrade | null = null;
  /** Can afford flag */
  private canAfford: boolean = false;
  /** Button element */
  private button: HTMLButtonElement | null = null;
  /** Active tooltip element */
  private activeTooltip: HTMLElement | null = null;
  /** Flag to track if mouse is over */
  private isMouseOver: boolean = false;
  /** Tooltip timeout ID */
  private tooltipTimeout: number | null = null;

  /**
   * Create an upgrade item component
   */
  constructor(options: ComponentOptions = {}) {
    super(options);
  }

  /**
   * Set up the component
   */
  protected setup(): void {
    // Initial render
    this.setContent(this.render());
    
    // Find button
    if (this.element) {
      this.button = this.element.querySelector('.upgrade-icon');
      
      // Add click handler directly to the element
      this.element.addEventListener('click', this.handlePurchase.bind(this));
      
      // Add tooltip event listeners
      this.element.addEventListener('mouseenter', () => {
        this.isMouseOver = true;
        this.showTooltip();
      });
      
      this.element.addEventListener('mouseleave', () => {
        this.isMouseOver = false;
        this.hideTooltip();
      });
    }
    
    // Connect to state to check affordability
    this.connectToState(
      state => ({ bufos: state.resources.bufos }),
      this.checkAffordability.bind(this)
    );
  }

  /**
   * Check if upgrade is affordable
   */
  private checkAffordability(state: { bufos: number }): void {
    if (!this.upgrade) return;
    
    const canAfford = state.bufos >= this.upgrade.cost;
    
    if (canAfford !== this.canAfford) {
      this.canAfford = canAfford;
      
      // Update affordability class
      if (this.element) {
        if (this.canAfford) {
          this.element.classList.add('affordable');
          this.element.classList.remove('not-affordable');
        } else {
          this.element.classList.add('not-affordable');
          this.element.classList.remove('affordable');
        }
      }
    }
  }

  /**
   * Handle purchase button click
   */
  private handlePurchase(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.upgrade || !this.canAfford) return;
    
    const currentBufos = getStateManager().getState().resources.bufos;
    
    // Get upgrade manager from GameCore
    const upgradeManager = getGameCore().getUpgradeManager();
    
    // Attempt to purchase
    const result = upgradeManager.purchaseUpgrade(this.upgrade.id, currentBufos);
    
    if (result.success) {
      // Visual feedback for successful purchase
      if (this.element) {
        this.element.classList.add('purchase-success');
        
        setTimeout(() => {
          this.element?.classList.remove('purchase-success');
        }, 300);
      }
      
      // Update state to reduce bufo count
      const state = getStateManager().getState();
      getStateManager().setState({
        resources: {
          bufos: state.resources.bufos - this.upgrade.cost
        }
      });
    } else {
      // Visual feedback for failed purchase
      if (this.element) {
        this.element.classList.add('purchase-error');
        
        setTimeout(() => {
          this.element?.classList.remove('purchase-error');
        }, 500);
      }
    }
  }

  /**
   * Show tooltip with upgrade details
   */
  private showTooltip(): void {
    // Clear any existing tooltip timeout
    if (this.tooltipTimeout !== null) {
      clearTimeout(this.tooltipTimeout);
      this.tooltipTimeout = null;
    }
    
    // If already showing a tooltip, don't create another
    if (this.activeTooltip) return;
    
    if (!this.upgrade || !this.element) return;
    
    const rect = this.element.getBoundingClientRect();
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.classList.add('game-tooltip');
    
    // Generate tooltip content
    tooltip.innerHTML = this.generateTooltipContent();
    
    // Position tooltip
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.bottom + 10}px`;
    tooltip.style.transform = 'translateX(-50%)';
    
    // Add to document
    document.body.appendChild(tooltip);
    
    // Store reference to active tooltip
    this.activeTooltip = tooltip;
    
    // Make visible after positioning
    this.tooltipTimeout = setTimeout(() => {
      if (tooltip) {
        tooltip.classList.add('visible');
      }
      this.tooltipTimeout = null;
    }, 10) as unknown as number;
  }

  /**
   * Generate tooltip content
   */
  private generateTooltipContent(): string {
    if (!this.upgrade) return '';
    
    // Get display names for categories
    const categoryDisplayNames: Record<UpgradeCategory, string> = {
      [UpgradeCategory.Click]: 'Click Upgrade',
      [UpgradeCategory.Generator]: 'Generator Upgrade',
      [UpgradeCategory.Global]: 'Global Upgrade'
    };
    
    // Get flavor text
    const flavorText = this.getUpgradeFlavorText();
    
    return `
      <div class="tooltip-upgrade tooltip-category-${this.upgrade.category}">
        <div class="tooltip-header">
          <span class="tooltip-title">${this.upgrade.name}</span>
          <span class="tooltip-category">${categoryDisplayNames[this.upgrade.category]}</span>
        </div>
        <div class="tooltip-description">${this.upgrade.description}</div>
        <div class="tooltip-flavor">${flavorText}</div>
        <div class="tooltip-cost">${formatNumber(this.upgrade.cost)} bufos</div>
      </div>
    `;
  }

  /**
   * Get flavor text for upgrade
   */
  private getUpgradeFlavorText(): string {
    if (!this.upgrade) return '';
    
    // Check if flavor text exists on the upgrade
    if (this.upgrade.flavorText) {
      return this.upgrade.flavorText;
    }
    
    // Fall back to generated flavor text based on upgrade id and category
    const flavorTexts: Record<string, string> = {
      'stronger_clicks_1': 'Your fingertips tingle with the power of a thousand taps. The frogs sense your newfound strength.',
      'stronger_clicks_2': 'Advanced clicking techniques passed down from the ancient Bufo masters. Your fingers move with blinding speed.',
      'tadpole_boost_1': 'A safe, nurturing environment for tadpoles to thrive. Happy tadpoles mean more bufos!',
      'froglet_boost_1': 'An intensive training regimen that transforms ordinary froglets into bufo-producing champions.',
      'global_production_1': 'A rising tide lifts all frogs. Your management skills benefit the entire operation.',
      'click_default': 'Every click reverberates through the pond, sending ripples of power across the lily pads.',
      'generator_default': 'Optimized production techniques allow your frogs to work smarter, not harder.',
      'global_default': 'A rising tide lifts all frogs. Your management skills benefit the entire operation.'
    };
    
    // Return specific text if available, otherwise use category default
    return flavorTexts[this.upgrade.id] || 
           flavorTexts[`${this.upgrade.category}_default`] || 
           'A mysterious upgrade with untold powers. The frogs whisper of its potential.';
  }

  /**
   * Hide tooltip
   */
  private hideTooltip(): void {
    // Clear any existing tooltip timeout
    if (this.tooltipTimeout !== null) {
      clearTimeout(this.tooltipTimeout);
      this.tooltipTimeout = null;
    }
    
    if (!this.activeTooltip) return;
    
    this.activeTooltip.classList.remove('visible');
    
    const tooltipToRemove = this.activeTooltip;
    this.activeTooltip = null;
    
    // Remove after transition
    setTimeout(() => {
      if (tooltipToRemove.parentNode) {
        tooltipToRemove.parentNode.removeChild(tooltipToRemove);
      }
    }, 300);
  }

  /**
   * Get HTML for upgrade icon
   */
  private getUpgradeIconHtml(): string {
    if (!this.upgrade) return '';
    
    // Use iconPath if available
    if (this.upgrade.iconPath) {
      return `<img src="${this.upgrade.iconPath}" alt="${this.upgrade.name}" class="upgrade-icon-img">`;
    }

    // Map of emoji icons based on category and effects
    const categoryIcons: Record<UpgradeCategory, string> = {
      [UpgradeCategory.Click]: '👆',
      [UpgradeCategory.Generator]: '🐸',
      [UpgradeCategory.Global]: '🌍'
    };
    
    // Get more specific icon based on upgrade id
    const specificIcons: Record<string, string> = {
      'stronger_clicks_1': '💪',
      'stronger_clicks_2': '✨👆',
      'tadpole_boost_1': '🥚',
      'froglet_boost_1': '🐸',
      'global_production_1': '🌿'
    };
    
    const icon = specificIcons[this.upgrade.id] || categoryIcons[this.upgrade.category] || '✨';
    return `<div class="upgrade-icon-emoji">${icon}</div>`;
  }

  /**
   * Render the upgrade item
   */
  public render(): string {
    return `
      <button class="upgrade-icon" data-upgrade-id="${this.upgrade?.id || ''}">
        ${this.getUpgradeIconHtml()}
      </button>
    `;
  }

  /**
   * Update the upgrade item
   */
  public update(upgrade: Upgrade): void {
    this.upgrade = upgrade;
    
    // Update category data attribute
    if (this.element) {
      this.element.dataset.category = upgrade.category;
    }
    
    // Re-render the button content
    if (this.button) {
      this.button.innerHTML = this.getUpgradeIconHtml();
      this.button.dataset.upgradeId = upgrade.id;
    }
    
    // Check affordability
    const state = getStateManager().getState();
    this.checkAffordability({ bufos: state.resources.bufos });
  }
  
  /**
   * Clean up resources when component is destroyed
   */
  public destroy(): void {
    // Remove any lingering tooltips
    this.hideTooltip();
    
    // Clear event listeners
    if (this.element) {
      this.element.removeEventListener('mouseenter', () => this.isMouseOver = true);
      this.element.removeEventListener('mouseleave', () => this.isMouseOver = false);
    }
    
    // Clear timeouts
    if (this.tooltipTimeout !== null) {
      clearTimeout(this.tooltipTimeout);
      this.tooltipTimeout = null;
    }
    
    // Call parent destroy method
    super.destroy();
  }
}