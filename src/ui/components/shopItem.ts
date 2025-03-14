// src/ui/components/shopItem.ts
import { Component } from '../core/Component';
import { ComponentOptions } from '../core/types';
import { GeneratorData, GeneratorCategory } from '../../models/generators';
import { formatNumber } from '../../utils/numberUtils';
import { pulse, shake } from '../../utils/animationUtils';
import { getGameCore } from '../../game/gameCore';
import { getStateManager } from '../../core/stateManager';
import { calculateBulkCost } from '../../models/generators';
import { showTooltip, updateTooltipPosition, hideTooltip } from '../../utils/tooltipUtils';

/**
 * Shop item update data
 */
interface ShopItemUpdateData {
  generator: GeneratorData;
  purchaseAmount?: number;
  canAfford?: boolean;
}

/**
 * Component for displaying a purchasable generator in the shop
 */
export class ShopItem extends Component {
  /** Generator data */
  private generator: GeneratorData | null = null;
  /** Purchase amount */
  private purchaseAmount: number = 1;
  /** Can afford flag */
  private canAfford: boolean = false;
  /** Buy button element */
  private buyButton: HTMLButtonElement | null = null;
  /** Info button element for tooltip */
  private infoButton: HTMLButtonElement | null = null;
  /** Generator name element */
  private nameElement: HTMLElement | null = null;
  /** Generator production element */
  private productionElement: HTMLElement | null = null;

  private iconElement: HTMLElement | null = null;

  /**
   * Create a shop item component
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
  
  // Find elements
  if (this.element) {
    this.buyButton = this.element.querySelector('.buy-button');
    this.nameElement = this.element.querySelector('.generator-name');
    this.productionElement = this.element.querySelector('.generator-production');
    this.iconElement = this.element.querySelector('.generator-icon'); // Add this line
    
    // Add click handler to buy button
    if (this.buyButton) {
      this.buyButton.addEventListener('click', (e: Event) => {
        this.handlePurchase(e as MouseEvent);
      });
    }
    
    // Make the left side clickable for info
    const generatorInfo = this.element.querySelector('.generator-left');
    if (generatorInfo) {
      generatorInfo.addEventListener('click', (e: Event) => {
        this.handleInfoClick(e as MouseEvent);
      });
    }
  }
}

  /**
   * Handle info click
   */
  private handleInfoClick(e: MouseEvent): void {
    if (!this.generator || !this.element) return;
    e.stopPropagation(); // Prevent event bubbling
    
    // Show tooltip with generator details
    showTooltip(this.generateTooltipContent(), e);
    
    // Setup document-level listeners that will be cleaned up when tooltip is closed
    const handleMouseMove = (e: Event) => updateTooltipPosition(e as MouseEvent);
    const handleMouseUp = () => {
      // Remove all document event listeners when tooltip is closed
      hideTooltip();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  /**
   * Handle purchase button click
   */
  private handlePurchase(e: MouseEvent): void {
    e.stopPropagation(); // Prevent event bubbling
    
    if (!this.generator || !this.canAfford) return;
    
    // Get generator manager from gameCore
    const generatorManager = getGameCore().getGeneratorManager();
    const state = getStateManager().getState();
    
    // Attempt to purchase
    const result = generatorManager.purchaseGenerator(
      this.generator.id,
      this.purchaseAmount,
      state.resources.bufos
    );
    
    const success = result.success;
    
    if (success) {
      // Visual feedback for successful purchase
      if (this.element) {
        this.element.classList.add('purchase-success');
        
        setTimeout(() => {
          this.element?.classList.remove('purchase-success');
        }, 300);
      }
      
      // Update state with spent resources
      getStateManager().setState({
        resources: {
          bufos: state.resources.bufos - result.cost
        }
      });

      // Update the current cost display
      this.updateDisplay();
    } else {
      // Visual feedback for failed purchase
      if (this.element) {
        this.element.classList.add('purchase-error');
        
        // Shake animation for error
        if (this.buyButton) {
          shake(this.buyButton, 5, 500);
        }
        
        setTimeout(() => {
          this.element?.classList.remove('purchase-error');
        }, 300);
      }
    }
  }

  /**
   * Update display after purchase
   */
  private updateDisplay(): void {
    // After purchase, get the updated generator data
    if (this.generator) {
      const state = getStateManager().getState();
      const updatedGenerator = state.generators[this.generator.id];
      
      if (updatedGenerator) {
        this.generator = updatedGenerator;
        
        // Update button cost
        this.updateButtonCost();
      }
    }
  }

  /**
   * Update the button cost display
   */
  private updateButtonCost(): void {
    if (!this.generator || !this.buyButton) return;
    
    const generatorManager = getGameCore().getGeneratorManager();
    const state = getStateManager().getState();
    const currentBufos = state.resources.bufos;
    
    let buttonLabel = `${formatNumber(this.generator.currentCost)} bufos`;
    
    if (this.purchaseAmount === -1) {
      // Max purchase
      const maxAffordable = generatorManager.getMaxAffordable(this.generator.id, currentBufos);
      if (maxAffordable === 0) {
        buttonLabel = `Can't afford`;
      } else {
        const cost = calculateBulkCost(this.generator, maxAffordable);
        buttonLabel = `${formatNumber(cost)} bufos`;
      }
    } else if (this.purchaseAmount > 1) {
      // Bulk purchase
      const cost = calculateBulkCost(this.generator, this.purchaseAmount);
      buttonLabel = `${formatNumber(cost)} bufos`;
    }
    
    this.buyButton.textContent = buttonLabel;
  }

  /**
   * Generate tooltip content
   */
  private generateTooltipContent(): string {
    if (!this.generator) return '';
    
    // Get generator manager from gameCore
    const generatorManager = getGameCore().getGeneratorManager();
    
    // Get current game state
    const state = getStateManager().getState();
    const currentBufos = state.resources.bufos;
    
    // Calculate costs for different purchase amounts
    const nextCost = this.generator.currentCost;
    const tenCost = calculateBulkCost(this.generator, 10);
    const hundredCost = calculateBulkCost(this.generator, 100);
    
    // Calculate affordable amount
    const affordable = generatorManager.getMaxAffordable(this.generator.id, currentBufos);
    
    // Category color
    const categoryColors: Record<GeneratorCategory, string> = {
      [GeneratorCategory.Basic]: '#4CAF50',
      [GeneratorCategory.Premium]: '#3f51b5',
      [GeneratorCategory.Special]: '#FF9800'
    };
    
    const titleColor = categoryColors[this.generator.category] || '#4CAF50';
    
    return `
      <div class="tooltip-header" style="color: ${titleColor};">
        <strong>${this.generator.name}</strong> <span class="tooltip-count">x${this.generator.count}</span>
      </div>
      
      <div class="tooltip-description">
        ${this.generator.detailedDescription || this.generator.description}
      </div>
      
      <div class="tooltip-section">
        <div class="tooltip-section-title">Production</div>
        <div class="tooltip-production">
          <div class="tooltip-production-item">
            <span class="tooltip-label">Production:</span>
            <span class="tooltip-value">${formatNumber(this.generator.currentProduction)}/sec per unit</span>
          </div>
        </div>
      </div>
      
      <div class="tooltip-section">
        <div class="tooltip-section-title">Purchase Info</div>
        <div class="tooltip-costs">
          <div class="tooltip-cost-item">
            <span class="tooltip-label">Next:</span>
            <span class="tooltip-value">${formatNumber(nextCost)} bufos</span>
          </div>
          <div class="tooltip-cost-item">
            <span class="tooltip-label">Next 10:</span>
            <span class="tooltip-value">${formatNumber(tenCost)} bufos</span>
          </div>
          <div class="tooltip-cost-item">
            <span class="tooltip-label">Next 100:</span>
            <span class="tooltip-value">${formatNumber(hundredCost)} bufos</span>
          </div>
          <div class="tooltip-cost-item affordable">
            <span class="tooltip-label">You can afford:</span>
            <span class="tooltip-value">${affordable}</span>
          </div>
        </div>
      </div>
    `;
  }

 /**
 * Get HTML for generator icon
 */
private getGeneratorIconHtml(generator: GeneratorData): string {
  console.log("Getting shop item icon for:", generator.name, "Icon path:", generator.iconPath);
  
  // Define default category icons
  const defaultIcons: Record<string, string> = {
    'basic': '🐸',
    'premium': '✨',
    'special': '🔮'
  };
  
  if (generator.iconPath) {
    // Fix relative paths
    let iconPath = generator.iconPath;
    if (iconPath.startsWith('./')) {
      iconPath = iconPath.substring(2);
    }
    
    return `
      <div class="generator-icon-wrapper">
        <img src="${iconPath}" alt="${generator.name}" class="generator-icon-img" 
             onerror="console.error('Failed to load icon:', this.src); this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="generator-icon-fallback" style="display:none;">${defaultIcons[generator.category] || '🐸'}</div>
      </div>
    `;
  }
  
  // Default icons if no image provided
  const defaultIcon = defaultIcons[generator.category] || '🐸';
  
  return `
    <div class="generator-icon-wrapper">
      <div class="generator-icon-fallback" style="display:flex;">${defaultIcon}</div>
    </div>
  `;
}

  /**
   * Render the shop item
   */
  public render(): string {
    if (!this.generator) {
      return `
        <div class="generator-row">
          <div class="generator-left">
            <div class="generator-icon"></div>
            <div class="generator-info">
              <div class="generator-name-section">
                <span class="generator-name">Unknown</span>
              </div>
              <div class="generator-production">0/sec per unit</div>
            </div>
          </div>
          <button class="buy-button disabled">0 bufos</button>
        </div>
      `;
    }
    
    const generatorManager = getGameCore().getGeneratorManager();
    const state = getStateManager().getState();
    const currentBufos = state.resources.bufos;
    
    let buttonLabel = `${formatNumber(this.generator.currentCost)} bufos`;
    if (this.purchaseAmount === -1) {
      // Max purchase
      const maxAffordable = generatorManager.getMaxAffordable(this.generator.id, currentBufos);
      if (maxAffordable === 0) {
        buttonLabel = `Can't afford`;
      } else {
        const cost = calculateBulkCost(this.generator, maxAffordable);
        buttonLabel = `${formatNumber(cost)} bufos`;
      }
    } else if (this.purchaseAmount > 1) {
      // Bulk purchase
      const cost = calculateBulkCost(this.generator, this.purchaseAmount);
      buttonLabel = `${formatNumber(cost)} bufos`;
    }
    
    return `
      <div class="generator-row">
        <div class="generator-left">
          <div class="generator-icon">
            ${this.getGeneratorIconHtml(this.generator)}
          </div>
          <div class="generator-info">
            <div class="generator-name-section">
              <span class="generator-name">${this.generator.name}</span>
            </div>
            <div class="generator-production">
              ${formatNumber(this.generator.currentProduction)}/sec per unit
            </div>
          </div>
        </div>
        <button class="buy-button ${!this.canAfford ? 'disabled' : ''}" data-generator-id="${this.generator.id}">${buttonLabel}</button>
      </div>
    `;
  }

  /**
 * Update the shop item
 */
public update(data: ShopItemUpdateData): void {
  if (!data.generator) return;
  
  const previousGenerator = this.generator;
  this.generator = data.generator;
  
  // Update UI elements directly if they exist
  if (this.nameElement) {
    this.nameElement.textContent = data.generator.name;
  }
  
  if (this.productionElement) {
    this.productionElement.textContent = `${formatNumber(data.generator.currentProduction)}/sec per unit`;
  }
  
  // Update the icon if the generator changed or we're doing a first-time update
  if (this.iconElement && (!previousGenerator || previousGenerator.id !== data.generator.id)) {
    console.log("Updating icon for", data.generator.name);
    this.iconElement.innerHTML = this.getGeneratorIconHtml(data.generator);
  }
  
  if (data.purchaseAmount !== undefined) {
    this.purchaseAmount = data.purchaseAmount;
  }
  
  if (data.canAfford !== undefined) {
    this.canAfford = data.canAfford;
  }
  
  // Get required managers and state
  const generatorManager = getGameCore().getGeneratorManager();
  const state = getStateManager().getState();
  const currentBufos = state.resources.bufos;
  
  // Update button text and state
  if (this.buyButton) {
    if (this.canAfford) {
      this.buyButton.classList.remove('disabled');
      this.buyButton.disabled = false;
    } else {
      this.buyButton.classList.add('disabled');
      this.buyButton.disabled = true;
    }
    
    // Update button text based on purchase amount
    this.updateButtonCost();
  }
  
  // Update category class
  if (this.element) {
    // Remove existing category classes
    Object.values(GeneratorCategory).forEach(category => {
      this.element?.classList.remove(`category-${category}`);
    });
    
    // Add current category class
    this.element.classList.add(`category-${this.generator.category}`);
  }
}
}