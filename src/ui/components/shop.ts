// src/ui/components/shop.ts
import { Container } from '../core/Container';
import { ComponentOptions, ChildComponent } from '../core/types';
import { ShopItem } from './shopItem';
import { getGameCore } from '../../game/gameCore';
import { getStateManager } from '../../core/stateManager';
import { GeneratorData, GeneratorType, calculateBulkCost } from '../../models/generators';

/**
 * Enum for purchase amounts
 */
enum PurchaseAmount {
  One = 1,
  Ten = 10,
  Hundred = 100,
  Max = -1
}

/**
 * Shop component that displays purchasable generators
 */
export class Shop extends Container {
  /** Currently selected purchase amount */
  private purchaseAmount: PurchaseAmount = PurchaseAmount.One;
  /** Purchase amount button elements */
  private purchaseAmountButtons: Map<PurchaseAmount, HTMLElement> = new Map();
  /** Update interval for checking affordability */
  private updateIntervalId: number | null = null;

  /**
   * Create a shop component
   */
  constructor(options: ComponentOptions = {}) {
    super({
      id: options.id || 'buildings-container',
      className: options.className || 'buildings-container',
      ...options
    });
  }

  // Update the setup method in src/ui/components/shop.ts

/**
 * Set up the component
 */
protected setup(): void {
  // Create purchase controls
  this.createPurchaseControls();
  
  // Immediately load and display the available generators
  //this.immediatelyLoadGenerators();
  
  // Connect to state to get available generators
  this.connectToState(
    state => {
      // Get all generators that can be purchased
      return getGameCore().getGeneratorManager().getUnlockedGenerators();
    },
    this.updateGenerators.bind(this)
  );
  
  // Listen for generator unlock events
  this.subscribeToEvent('GENERATOR_UNLOCKED', () => {
    this.refreshGenerators();
  });
  
  // Listen for generator purchase events for updates
  this.subscribeToEvent('GENERATOR_PURCHASED', () => {
    this.updateAffordability();
  });
  
  // Listen for game loaded events
  this.subscribeToEvent('GAME_LOADED', () => {
    // Force a refresh when game is loaded
    setTimeout(() => {
      this.refreshGenerators();
    }, 200);
  });
  
  // Listen for explicit UI refresh events
  this.subscribeToEvent('refreshUI', () => {
    this.refreshGenerators();
  });
  
  // Start update interval for affordability checks
  this.updateIntervalId = window.setInterval(() => {
    this.updateAffordability();
  }, 200);
}

  /**
   * Create purchase amount controls
   */
  private createPurchaseControls(): void {
    if (!this.element) return;
    
    const purchaseControls = document.createElement('div');
    purchaseControls.classList.add('purchase-controls');
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('purchase-amount-buttons');
    
    // Create buttons for different purchase amounts
    const amounts = [
      { value: PurchaseAmount.One, label: '1' },
      { value: PurchaseAmount.Ten, label: '10' },
      { value: PurchaseAmount.Hundred, label: '100' },
      { value: PurchaseAmount.Max, label: 'Max' }
    ];
    
    amounts.forEach(({ value, label }) => {
      const button = document.createElement('button');
      button.classList.add('purchase-amount-button');
      button.textContent = label;
      button.dataset.amount = value.toString();
      
      // Set active button
      if (value === this.purchaseAmount) {
        button.classList.add('active');
      }
      
      // Add click event listener
      button.addEventListener('click', () => {
        this.setPurchaseAmount(value);
      });
      
      buttonsContainer.appendChild(button);
      this.purchaseAmountButtons.set(value, button);
    });
    
    purchaseControls.appendChild(buttonsContainer);
    this.element.appendChild(purchaseControls);
  }
  
  /**
   * Set the purchase amount
   */
  private setPurchaseAmount(amount: PurchaseAmount): void {
    this.purchaseAmount = amount;
    
    // Update button styles
    this.purchaseAmountButtons.forEach((button, value) => {
      if (value === amount) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
    
    // Update costs and affordability
    this.updateCosts();
    this.updateAffordability();
  }
  
  /**
   * Update generators based on state change
   */
  private updateGenerators(availableGenerators: GeneratorData[]): void {
    // Clear all children except purchase controls
    const children = this.getChildren();
    for (const child of children) {
      if (child.component instanceof ShopItem) {
        this.removeChild(child.component);
      }
    }
    
    // Add shop items for each available generator
    availableGenerators.forEach(generator => {
      const shopItem = new ShopItem({
        id: `shop-item-${generator.id}`,
        className: `building-item category-${generator.category}`
      });
      
      this.addChild(shopItem, generator);
      shopItem.update({
        generator,
        purchaseAmount: this.purchaseAmount
      });
    });
    
    // Update costs and affordability
    this.updateCosts();
    this.updateAffordability();
  }
  
  /**
   * Update costs for all generators based on purchase amount
   */
  private updateCosts(): void {
    const children = this.getChildren();
    
    // Update each shop item
    for (const child of children) {
      if (child.component instanceof ShopItem && child.data) {
        child.component.update({
          generator: child.data,
          purchaseAmount: this.purchaseAmount
        });
      }
    }
  }
  
  /**
   * Update affordability of all generators
   */
  private updateAffordability(): void {
    const state = getStateManager().getState();
    const currentBufos = state.resources.bufos;
    const children = this.getChildren();
    const generatorManager = getGameCore().getGeneratorManager();
    
    // Update each shop item's affordability
    for (const child of children) {
      if (child.component instanceof ShopItem && child.data) {
        // Important: Get the most up-to-date generator data
        const generator = state.generators[child.data.id as GeneratorType];
        
        if (generator) {
          let canAfford = false;
          
          if (this.purchaseAmount === PurchaseAmount.Max) {
            // Calculate max affordable using generator manager
            const maxAffordable = generatorManager.getMaxAffordable(generator.id, currentBufos);
            canAfford = maxAffordable > 0;
          } else {
            // Calculate cost for bulk purchase
            const bulkCost = calculateBulkCost(generator, this.purchaseAmount);
            canAfford = currentBufos >= bulkCost;
          }
          
          child.component.update({
            generator, // Use the current state's generator data
            purchaseAmount: this.purchaseAmount,
            canAfford
          });
        }
      }
    }
  }
  
  /**
   * Refresh all generators
   */
  public refreshGenerators(): void {
    const availableGenerators = getGameCore().getGeneratorManager().getUnlockedGenerators();
    this.updateGenerators(availableGenerators);
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    // Clear update interval
    if (this.updateIntervalId !== null) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }
    
    // Clear buttons map
    this.purchaseAmountButtons.clear();
    
    super.destroy();
  }
}